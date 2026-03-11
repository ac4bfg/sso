package handlers

import (
	"fmt"
	"time"

	"sso/config"
	"sso/internal/models"
	"sso/internal/repositories"
	"sso/internal/services"
	jwtPkg "sso/pkg/jwt"
	"sso/pkg/response"
	"sso/pkg/validator"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authService  *services.AuthService
	oauthService *services.OAuthService
	auditRepo    *repositories.AuditRepository
	notifRepo    *repositories.NotificationRepository
	cfg          *config.Config
}

func NewAuthHandler(authService *services.AuthService, oauthService *services.OAuthService, auditRepo *repositories.AuditRepository, notifRepo *repositories.NotificationRepository, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService:  authService,
		oauthService: oauthService,
		auditRepo:    auditRepo,
		notifRepo:    notifRepo,
		cfg:          cfg,
	}
}

// createNotif persists a notification and broadcasts it via SSE
func (h *AuthHandler) createNotif(notif *models.Notification) {
	if err := h.notifRepo.Create(notif); err != nil {
		return
	}
	NotifHub.Broadcast(notif)
}

// GoogleLogin GET /api/auth/google
func (h *AuthHandler) GoogleLogin(c *fiber.Ctx) error {
	url := h.oauthService.GetGoogleLoginURL()
	return c.Redirect(url, fiber.StatusTemporaryRedirect)
}

// GoogleCallback GET /api/auth/google/callback
func (h *AuthHandler) GoogleCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return response.Error(c, fiber.StatusBadRequest, "Code not found", nil)
	}

	userAgent := c.Get("User-Agent")
	ipAddress := c.IP()
	result, err := h.oauthService.GoogleLogin(code, userAgent, ipAddress)
	if err != nil {
		h.logAudit(c, nil, "", "google_login", false, err.Error())
		// Redirect to frontend login with error
		return c.Redirect(h.cfg.FrontendURL+"/login?error=google_auth_failed", fiber.StatusTemporaryRedirect)
	}

	h.logAudit(c, &result.User.ID, result.User.Email, "google_login", true, "")
	h.setRefreshTokenCookie(c, result.RefreshToken)

	// Store access token in Redis under a short-lived temp token (1 min)
	// FE will exchange this temp token for the actual access token via /api/auth/exchange
	tempToken := uuid.New().String()
	if err := h.authService.StoreTempToken(tempToken, result.AccessToken); err != nil {
		return c.Redirect(h.cfg.FrontendURL+"/login?error=google_auth_failed", fiber.StatusTemporaryRedirect)
	}

	redirectURL := fmt.Sprintf("%s/auth/callback?code=%s", h.cfg.FrontendURL, tempToken)
	return c.Redirect(redirectURL, fiber.StatusTemporaryRedirect)
}

// logAudit creates an audit log entry
func (h *AuthHandler) logAudit(c *fiber.Ctx, userID *string, email, eventType string, success bool, details string) {
	_ = h.auditRepo.Create(&models.AuditLog{
		UserID:    userID,
		Email:     email,
		EventType: eventType,
		Success:   success,
		IPAddress: c.IP(),
		UserAgent: c.Get("User-Agent"),
		Details:   details,
	})
}

// setRefreshTokenCookie sets the refresh token as an HTTP-Only cookie
// setRefreshTokenCookie sets the refresh token as an HTTP-Only cookie
func (h *AuthHandler) setRefreshTokenCookie(c *fiber.Ctx, refreshToken string) {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		Domain:   h.cfg.CookieDomain,
		MaxAge:   int(h.cfg.JWTRefreshExpiry.Seconds()),
		Secure:   h.cfg.CookieSecure,
		HTTPOnly: true,
		SameSite: "Lax",
	})
}

// clearRefreshTokenCookie clears the refresh token cookie
func (h *AuthHandler) clearRefreshTokenCookie(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Domain:   h.cfg.CookieDomain,
		MaxAge:   -1,
		Secure:   h.cfg.CookieSecure,
		HTTPOnly: true,
		SameSite: "Lax",
		Expires:  time.Now().Add(-1 * time.Hour),
	})
}

// Register POST /api/auth/register
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var input services.RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}

	if input.Name == "" || input.Email == "" || input.Password == "" {
		return response.Error(c, fiber.StatusBadRequest, "Name, email, and password are required", nil)
	}

	if err := validator.ValidatePassword(input.Password); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	userAgent := c.Get("User-Agent")
	ipAddress := c.IP()
	result, err := h.authService.Register(input, userAgent, ipAddress)
	if err != nil {
		h.logAudit(c, nil, input.Email, models.EventRegister, false, err.Error())
		return response.Error(c, fiber.StatusConflict, err.Error(), nil)
	}

	h.logAudit(c, &result.User.ID, input.Email, models.EventRegister, true, "")
	h.setRefreshTokenCookie(c, result.RefreshToken)

	return response.Success(c, fiber.StatusCreated, "Registration successful", fiber.Map{
		"access_token": result.AccessToken,
		"user":         result.User,
	})
}

// Login POST /api/auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var input services.LoginInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}

	if input.Email == "" || input.Password == "" {
		return response.Error(c, fiber.StatusBadRequest, "Email and password are required", nil)
	}

	userAgent := c.Get("User-Agent")
	ipAddress := c.IP()
	result, err := h.authService.Login(input, userAgent, ipAddress)
	if err != nil {
		// Determine event type based on error
		eventType := models.EventLoginFailed
		if err.Error() == "too many failed attempts, account locked for 15 minutes" {
			eventType = models.EventAccountLocked
		}
		h.logAudit(c, nil, input.Email, eventType, false, err.Error())

		// Brute force detection: count recent failed logins from this IP
		go func() {
			count, countErr := h.auditRepo.CountRecentFailedByIP(ipAddress, 5)
			if countErr == nil && count >= 5 {
				h.createNotif(&models.Notification{
					Type:      models.NotifBruteForce,
					Title:     "Brute Force Attempt Detected",
					Message:   fmt.Sprintf("%d failed login attempts from IP %s in the last 5 minutes (email: %s)", count, ipAddress, input.Email),
					Email:     input.Email,
					IPAddress: ipAddress,
				})
			}
		}()

		return response.Error(c, fiber.StatusUnauthorized, err.Error(), nil)
	}

	// New IP login detection
	go func() {
		isNew, checkErr := h.auditRepo.IsNewIPForUser(result.User.ID, ipAddress)
		if checkErr == nil && isNew {
			h.createNotif(&models.Notification{
				Type:      models.NotifNewIPLogin,
				Title:     "Login from New IP Address",
				Message:   fmt.Sprintf("%s logged in from a new IP address: %s", result.User.Name, ipAddress),
				UserName:  result.User.Name,
				Email:     result.User.Email,
				IPAddress: ipAddress,
			})
		}
	}()

	h.logAudit(c, &result.User.ID, input.Email, models.EventLoginSuccess, true, "")
	h.setRefreshTokenCookie(c, result.RefreshToken)

	return response.Success(c, fiber.StatusOK, "Login successful", fiber.Map{
		"access_token": result.AccessToken,
		"user":         result.User,
	})
}

// Refresh POST /api/auth/refresh
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return response.Error(c, fiber.StatusBadRequest, "Refresh token not found", nil)
	}

	userAgent := c.Get("User-Agent")
	ipAddress := c.IP()
	result, err := h.authService.RefreshToken(refreshToken, userAgent, ipAddress)
	if err != nil {
		h.clearRefreshTokenCookie(c)
		h.logAudit(c, nil, "", models.EventTokenRefresh, false, err.Error())
		return response.Error(c, fiber.StatusUnauthorized, err.Error(), nil)
	}

	h.logAudit(c, &result.User.ID, result.User.Email, models.EventTokenRefresh, true, "")
	h.setRefreshTokenCookie(c, result.RefreshToken)

	return response.Success(c, fiber.StatusOK, "Token refreshed successfully", fiber.Map{
		"access_token": result.AccessToken,
		"user":         result.User,
	})
}

// Logout POST /api/auth/logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Attempt 1: Logout via Cookie
	refreshToken := c.Cookies("refresh_token")
	if refreshToken != "" {
		_ = h.authService.Logout(refreshToken)
	}

	// Attempt 2: Logout via Authorization Header (Fallback if cookie missing/invalid)
	// This handles cases where cookie isn't sent (e.g. cross-site) or access token is expired but valid signature
	authHeader := c.Get("Authorization")
	if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		tokenString := authHeader[7:]
		// Use ExtractSessionID to get session ID even if expired
		sessionID, err := jwtPkg.ExtractSessionID(tokenString, h.cfg.JWTSecret)
		if err == nil && sessionID != "" {
			_ = h.authService.RevokeSession(sessionID)
		}
	}

	// Get user info from context if available (protected route) -> might be empty now if public
	userID, _ := c.Locals("userID").(string)
	email, _ := c.Locals("email").(string)
	var uid *string
	if userID != "" {
		uid = &userID
	}

	// If userID is not in locals (because middleware removed/failed), can we get it from token?
	// Not critical for audit log in this "cleanup" phase, but good to have.
	// For now, we prioritize clearing the session.

	h.logAudit(c, uid, email, models.EventLogout, true, "")
	h.clearRefreshTokenCookie(c)

	return response.Success(c, fiber.StatusOK, "Logout successful", nil)
}

// GetMe GET /api/auth/me
func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	user, err := h.authService.GetMe(userID)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "User data", user)
}

// ExchangeToken POST /api/auth/exchange
// Menukar temp code (dari Google callback) dengan access token
func (h *AuthHandler) ExchangeToken(c *fiber.Ctx) error {
	var body struct {
		Code string `json:"code"`
	}
	if err := c.BodyParser(&body); err != nil || body.Code == "" {
		return response.Error(c, fiber.StatusBadRequest, "Code is required", nil)
	}

	accessToken, err := h.authService.ExchangeTempToken(body.Code)
	if err != nil {
		return response.Error(c, fiber.StatusUnauthorized, "Token not found or expired", nil)
	}

	return response.Success(c, fiber.StatusOK, "Token exchanged", fiber.Map{
		"access_token": accessToken,
	})
}

// CheckSession HEAD /api/auth/check
func (h *AuthHandler) CheckSession(c *fiber.Ctx) error {
	// Middleware already validated session
	return c.SendStatus(fiber.StatusOK)
}
