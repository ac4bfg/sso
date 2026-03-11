package services

import (
	"errors"

	"sso/internal/models"
	"sso/internal/repositories"
	"sso/pkg/hash"

	"gorm.io/gorm"
)

type UserService struct {
	userRepo *repositories.UserRepository
	appRepo  *repositories.AppRepository
	roleRepo *repositories.RoleRepository
}

func NewUserService(userRepo *repositories.UserRepository, appRepo *repositories.AppRepository, roleRepo *repositories.RoleRepository) *UserService {
	return &UserService{userRepo: userRepo, appRepo: appRepo, roleRepo: roleRepo}
}

type CreateUserInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type UpdateUserInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"` // Opsional
}

type ChangeRoleInput struct {
	Role string `json:"role"`
}

type ChangePasswordInput struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// roleInfo mengambil label dan can_access_admin dari DB dengan fallback
func (s *UserService) roleInfo(roleName string) (label string, canAccessAdmin bool) {
	if r, err := s.roleRepo.FindByName(roleName); err == nil {
		return r.Label, r.CanAccessAdmin
	}
	return roleName, false
}

// Create membuat user baru oleh admin
func (s *UserService) Create(input CreateUserInput) (*models.UserResponse, error) {
	if input.Name == "" || input.Email == "" || input.Password == "" {
		return nil, errors.New("name, email, and password are required")
	}

	// Cek email sudah terdaftar
	existing, _ := s.userRepo.FindByEmail(input.Email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	// Validasi role jika diisi
	role := input.Role
	if role == "" {
		role = "staff"
	} else {
		if _, err := s.roleRepo.FindByName(role); err != nil {
			return nil, errors.New("invalid role: role not found")
		}
	}

	hashed, err := hash.HashPassword(input.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		Name:          input.Name,
		Email:         input.Email,
		Password:      hashed,
		Role:          role,
		IsActive:      true,
		IsPasswordSet: true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	label, canAdmin := s.roleInfo(user.Role)
	resp := user.ToResponseWithLabel(label, canAdmin)
	return &resp, nil
}

// GetAll mengambil semua user
func (s *UserService) GetAll() ([]models.UserResponse, error) {
	users, err := s.userRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var responses []models.UserResponse
	for _, u := range users {
		label, canAdmin := s.roleInfo(u.Role)
		responses = append(responses, u.ToResponseWithLabel(label, canAdmin))
	}
	return responses, nil
}

// GetByID mengambil user berdasarkan ID
func (s *UserService) GetByID(id string) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	label, canAdmin := s.roleInfo(user.Role)
	resp := user.ToResponseWithLabel(label, canAdmin)
	return &resp, nil
}

// GetMyApps mengambil daftar aplikasi yang berhak diakses user beserta rolenya
func (s *UserService) GetMyApps(userID string) ([]models.AppWithRole, error) {
	apps, err := s.appRepo.FindAppsWithRolesByUserID(userID)
	if err != nil {
		return nil, errors.New("failed to fetch user apps")
	}
	return apps, nil
}

// Update mengubah data user
func (s *UserService) Update(id string, input UpdateUserInput) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if input.Name != "" {
		user.Name = input.Name
	}
	if input.Email != "" {
		// Cek apakah email sudah dipakai user lain
		existing, _ := s.userRepo.FindByEmail(input.Email)
		if existing != nil && existing.ID != id {
			return nil, errors.New("email already used by another user")
		}
		user.Email = input.Email
	}
	if input.Password != "" {
		hashed, err := hash.HashPassword(input.Password)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}
		user.Password = hashed
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update user")
	}

	label, canAdmin := s.roleInfo(user.Role)
	resp := user.ToResponseWithLabel(label, canAdmin)
	return &resp, nil
}

// Delete menghapus user (soft delete)
func (s *UserService) Delete(id string) error {
	_, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}

	return s.userRepo.Delete(id)
}

// ChangeRole mengubah role user
func (s *UserService) ChangeRole(id string, input ChangeRoleInput) (*models.UserResponse, error) {
	// Validasi role exist di tabel roles
	if _, err := s.roleRepo.FindByName(input.Role); err != nil {
		return nil, errors.New("invalid role: role not found")
	}

	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.Role = input.Role
	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update role")
	}

	label, canAdmin := s.roleInfo(user.Role)
	resp := user.ToResponseWithLabel(label, canAdmin)
	return &resp, nil
}

// AssignApp assign satu app ke user dengan role tertentu
func (s *UserService) AssignApp(userID, appID, role string) error {
	_, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}
	ua := &models.UserAppRole{UserID: userID, AppID: appID, Role: role}
	return s.appRepo.AssignUserToApp(ua)
}

// RevokeApp cabut akses app dari user
func (s *UserService) RevokeApp(userID, appID string) error {
	return s.appRepo.RevokeUserFromApp(userID, appID)
}

// GetUserApps mengambil daftar aplikasi beserta role untuk user tertentu (admin use)
func (s *UserService) GetUserApps(userID string) ([]models.AppWithRole, error) {
	apps, err := s.appRepo.FindAppsWithRolesByUserID(userID)
	if err != nil {
		return nil, errors.New("failed to fetch user apps")
	}
	return apps, nil
}

// GetAllApps mengambil semua app yang terdaftar
func (s *UserService) GetAllApps() ([]models.App, error) {
	return s.appRepo.FindAll()
}

// ChangePassword mengubah password user
func (s *UserService) ChangePassword(id string, input ChangePasswordInput) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify current password ONLY if password is set
	if user.IsPasswordSet {
		if !hash.CheckPassword(input.CurrentPassword, user.Password) {
			return errors.New("current password incorrect")
		}
	}
	// If IsPasswordSet is false, we skip current password check (allowing them to set it)

	// Hash new password
	hashed, err := hash.HashPassword(input.NewPassword)
	if err != nil {
		return errors.New("failed to hash password")
	}

	user.Password = hashed
	user.IsPasswordSet = true // Mark as set
	return s.userRepo.Update(user)
}
