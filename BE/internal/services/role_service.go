package services

import (
	cryptoRand "crypto/rand"
	"errors"
	"fmt"
	"sso/internal/models"
	"sso/internal/repositories"
)

type RoleService struct {
	roleRepo *repositories.RoleRepository
}

func NewRoleService(roleRepo *repositories.RoleRepository) *RoleService {
	return &RoleService{roleRepo: roleRepo}
}

type CreateRoleInput struct {
	Name           string `json:"name"`
	Label          string `json:"label"`
	CanAccessAdmin bool   `json:"can_access_admin"`
}

type UpdateRoleInput struct {
	Label          string `json:"label"`
	CanAccessAdmin *bool  `json:"can_access_admin"`
}

func (s *RoleService) GetAll() ([]models.Role, error) {
	return s.roleRepo.FindAll()
}

func (s *RoleService) Create(input CreateRoleInput) (*models.Role, error) {
	if input.Name == "" || input.Label == "" {
		return nil, errors.New("name and label are required")
	}

	// cek duplikat
	if _, err := s.roleRepo.FindByName(input.Name); err == nil {
		return nil, errors.New("role with this name already exists")
	}

	role := &models.Role{
		ID:             generateRoleUUID(),
		Name:           input.Name,
		Label:          input.Label,
		CanAccessAdmin: input.CanAccessAdmin,
	}
	if err := s.roleRepo.Create(role); err != nil {
		return nil, errors.New("failed to create role")
	}
	return role, nil
}

func (s *RoleService) Update(id string, input UpdateRoleInput) (*models.Role, error) {
	role, err := s.roleRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("role not found")
	}
	if input.Label != "" {
		role.Label = input.Label
	}
	if input.CanAccessAdmin != nil {
		role.CanAccessAdmin = *input.CanAccessAdmin
	}
	if err := s.roleRepo.Update(role); err != nil {
		return nil, errors.New("failed to update role")
	}
	return role, nil
}

func (s *RoleService) Delete(id string) error {
	if _, err := s.roleRepo.FindByID(id); err != nil {
		return errors.New("role not found")
	}
	return s.roleRepo.Delete(id)
}

func generateRoleUUID() string {
	b := make([]byte, 16)
	_, _ = cryptoRand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
