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
}

func NewUserService(userRepo *repositories.UserRepository, appRepo *repositories.AppRepository) *UserService {
	return &UserService{userRepo: userRepo, appRepo: appRepo}
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

// GetAll mengambil semua user
func (s *UserService) GetAll() ([]models.UserResponse, error) {
	users, err := s.userRepo.FindAll()
	if err != nil {
		return nil, err
	}

	var responses []models.UserResponse
	for _, u := range users {
		responses = append(responses, u.ToResponse())
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

	resp := user.ToResponse()
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

	resp := user.ToResponse()
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
	// Validasi role
	validRoles := map[string]bool{"admin": true, "manager": true, "staff": true}
	if !validRoles[input.Role] {
		return nil, errors.New("invalid role (admin, manager, staff)")
	}

	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	user.Role = input.Role
	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("failed to update role")
	}

	resp := user.ToResponse()
	return &resp, nil
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
