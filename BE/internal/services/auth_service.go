package services

import (
	"errors"
	"fmt"
	"time"

	"sso/config"
	"sso/internal/models"
	"sso/internal/repositories"
	"sso/pkg/cache"
	"sso/pkg/hash"
	jwtPkg "sso/pkg/jwt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthService struct {
	userRepo    *repositories.UserRepository
	tokenRepo   *repositories.TokenRepository
	auditRepo   *repositories.AuditRepository
	appRepo     *repositories.AppRepository
	redisClient *cache.RedisClient
	cfg         *config.Config
}

func NewAuthService(cfg *config.Config, userRepo *repositories.UserRepository, tokenRepo *repositories.TokenRepository, auditRepo *repositories.AuditRepository, appRepo *repositories.AppRepository, redisClient *cache.RedisClient) *AuthService {
	return &AuthService{
		cfg:         cfg,
		userRepo:    userRepo,
		tokenRepo:   tokenRepo,
		auditRepo:   auditRepo,
		appRepo:     appRepo,
		redisClient: redisClient,
	}
}

type RegisterInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	AccessToken  string              `json:"access_token"`
	RefreshToken string              `json:"refresh_token"`
	User         models.UserResponse `json:"user"`
}

// Register mendaftarkan user baru
func (s *AuthService) Register(input RegisterInput, userAgent, ipAddress string) (*AuthResponse, error) {
	// Cek email sudah terdaftar
	existing, _ := s.userRepo.FindByEmail(input.Email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	// Hash password
	hashedPassword, err := hash.HashPassword(input.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	// Buat user
	user := &models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: hashedPassword,
		Role:     "staff",
		IsActive: true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	// Generate tokens
	return s.generateTokens(user, userAgent, ipAddress)
}

// Login melakukan autentikasi user
func (s *AuthService) Login(input LoginInput, userAgent, ipAddress string) (*AuthResponse, error) {
	// Cari user
	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid email or password")
		}
		return nil, errors.New("something went wrong")
	}

	// Cek apakah user aktif
	if !user.IsActive {
		return nil, errors.New("account is inactive, contact admin")
	}

	// Cek apakah akun terkunci
	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		remaining := time.Until(*user.LockedUntil).Minutes()
		return nil, fmt.Errorf("account is locked, try again in %.0f minutes", remaining)
	}

	// Verifikasi password
	if !hash.CheckPassword(input.Password, user.Password) {
		// Increment failed attempts
		_ = s.userRepo.IncrementFailedAttempts(user.ID)
		newAttempts := user.FailedLoginAttempts + 1

		// Lock account after 5 failed attempts (15 min lockout)
		if newAttempts >= 5 {
			lockUntil := time.Now().Add(15 * time.Minute)
			_ = s.userRepo.LockAccount(user.ID, lockUntil)
			return nil, errors.New("too many failed attempts, account locked for 15 minutes")
		}

		return nil, errors.New("invalid email or password")
	}

	// Successful login — reset failed attempts
	_ = s.userRepo.ResetFailedAttempts(user.ID)

	// Update last login
	_ = s.userRepo.UpdateLastLogin(user.ID)

	// Generate tokens
	return s.generateTokens(user, userAgent, ipAddress)
}

// RefreshToken menukar refresh token lama dengan access token baru
func (s *AuthService) RefreshToken(refreshToken, userAgent, ipAddress string) (*AuthResponse, error) {
	// Validasi JWT refresh token
	userID, err := jwtPkg.ValidateRefreshToken(refreshToken, s.cfg.JWTSecret)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Cek di database
	storedToken, err := s.tokenRepo.FindByToken(refreshToken)
	if err != nil {
		return nil, errors.New("refresh token not found or expired")
	}

	// Hapus refresh token lama dan dari Redis
	_ = s.redisClient.Del(fmt.Sprintf("session:%s", storedToken.ID))
	_ = s.tokenRepo.Delete(storedToken.ID)

	// Cari user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if !user.IsActive {
		return nil, errors.New("account is inactive")
	}

	// Generate token baru
	return s.generateTokens(user, userAgent, ipAddress)
}

// Logout menghapus refresh token
func (s *AuthService) Logout(refreshToken string) error {
	token, err := s.tokenRepo.FindByToken(refreshToken)
	if err != nil {
		return nil // Already deleted or invalid
	}

	// Delete from Redis
	_ = s.redisClient.Del(fmt.Sprintf("session:%s", token.ID))

	// Delete from DB
	return s.tokenRepo.Delete(token.ID)
}

// RevokeSession menghapus session berdasarkan ID (bukan token string)
func (s *AuthService) RevokeSession(sessionID string) error {
	// Delete from Redis (Key: session:ID)
	_ = s.redisClient.Del(fmt.Sprintf("session:%s", sessionID))

	// Delete from DB
	return s.tokenRepo.Delete(sessionID)
}

// LogoutAll menghapus semua refresh token user
func (s *AuthService) LogoutAll(userID string) error {
	return s.tokenRepo.DeleteByUserID(userID)
}

// GetMe mengambil data user yang sedang login
func (s *AuthService) GetMe(userID string) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	resp := user.ToResponse()
	return &resp, nil
}

// generateTokens membuat access + refresh token pair
func (s *AuthService) generateTokens(user *models.User, userAgent, ipAddress string) (*AuthResponse, error) {
	// Generate Session ID (Refresh Token ID)
	sessionID := uuid.New().String()

	// Access token bound to Session ID
	accessToken, err := jwtPkg.GenerateAccessToken(
		user.ID, sessionID, user.Email, user.Role,
		s.cfg.JWTSecret, s.cfg.JWTAccessExpiry,
	)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	// Refresh token
	refreshToken, err := jwtPkg.GenerateRefreshToken(
		user.ID, s.cfg.JWTSecret, s.cfg.JWTRefreshExpiry,
	)
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	// Store in Redis (Key: session:ID, Value: UserID, TTL: Refresh Expiry)
	redisKey := fmt.Sprintf("session:%s", sessionID)
	if err := s.redisClient.Set(redisKey, user.ID, s.cfg.JWTRefreshExpiry); err != nil {
		fmt.Printf("⚠️ Failed to set Redis key %s: %v\n", redisKey, err)
		// Log error but proceed? Or fail? Better fail for consistency.
		return nil, errors.New("failed to cache session")
	}
	fmt.Printf("✅ Generated and cached session: %s\n", redisKey)

	// Store in DB
	rt := &models.RefreshToken{
		ID:         sessionID,
		UserID:     user.ID,
		Token:      refreshToken,
		UserAgent:  userAgent,
		IPAddress:  ipAddress,
		LastUsedAt: time.Now(),
		ExpiresAt:  time.Now().Add(s.cfg.JWTRefreshExpiry),
	}
	if err := s.tokenRepo.Create(rt); err != nil {
		// Clean up Redis if DB fails
		_ = s.redisClient.Del(redisKey)
		return nil, errors.New("failed to store refresh token")
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user.ToResponse(),
	}, nil
}

// StoreTempToken menyimpan temp token ke Redis dengan TTL 1 menit
func (s *AuthService) StoreTempToken(tempToken, accessToken string) error {
	key := fmt.Sprintf("temp_token:%s", tempToken)
	return s.redisClient.Set(key, accessToken, 1*time.Minute)
}

// ExchangeTempToken menukar temp token dengan access token, lalu hapus dari Redis
func (s *AuthService) ExchangeTempToken(tempToken string) (string, error) {
	key := fmt.Sprintf("temp_token:%s", tempToken)
	accessToken, err := s.redisClient.Get(key)
	if err != nil {
		return "", errors.New("token not found or expired")
	}
	_ = s.redisClient.Del(key)
	return accessToken, nil
}

// SeedAdmin membuat admin pertama jika belum ada user sama sekali
func (s *AuthService) SeedAdmin(name, email, password string) error {
	count, _ := s.userRepo.Count()
	if count > 0 {
		return nil // Sudah ada user, skip
	}

	hashedPassword, err := hash.HashPassword(password)
	if err != nil {
		return err
	}

	admin := &models.User{
		Name:     name,
		Email:    email,
		Password: hashedPassword,
		Role:     "admin",
		IsActive: true,
	}

	return s.userRepo.Create(admin)
}

func (s *AuthService) SeedAppsAndAssignAdmin(adminEmail string) error {
	appsToSeed := []models.App{
		{Name: "Cost Control", Description: "Project Cost Management", Icon: "📊", BaseURL: s.cfg.AppURLCostControl},
		{Name: "Procurement", Description: "Purchase Orders & Vendors", Icon: "🛒", BaseURL: s.cfg.AppURLProcurement},
		{Name: "Invoice", Description: "Billing & Invoicing", Icon: "🧾", BaseURL: s.cfg.AppURLInvoice},
	}

	for _, app := range appsToSeed {
		existing, _ := s.appRepo.FindByName(app.Name)
		if existing == nil || existing.ID == "" {
			_ = s.appRepo.Create(&app)
		}
	}

	// Assign apps to admin
	admin, err := s.userRepo.FindByEmail(adminEmail)
	if err == nil && admin != nil {
		apps, _ := s.appRepo.FindAll()
		for _, app := range apps {
			role := &models.UserAppRole{
				UserID: admin.ID,
				AppID:  app.ID,
				Role:   "admin",
			}
			_ = s.appRepo.AssignUserToApp(role)
		}
	}

	return nil
}
