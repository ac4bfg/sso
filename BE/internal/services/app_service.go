package services

import (
	"encoding/json"
	"errors"
	"sso/internal/models"
	"sso/internal/repositories"
)

type AppService struct {
	appRepo  *repositories.AppRepository
	roleRepo *repositories.RoleRepository
}

func NewAppService(appRepo *repositories.AppRepository, roleRepo *repositories.RoleRepository) *AppService {
	return &AppService{appRepo: appRepo, roleRepo: roleRepo}
}

type CreateAppInput struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Icon         string   `json:"icon"`
	BaseURL      string   `json:"base_url"`
	AllowedRoles []string `json:"allowed_roles"`
}

type UpdateAppInput struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Icon         string   `json:"icon"`
	BaseURL      string   `json:"base_url"`
	IsActive     *bool    `json:"is_active"`
	AllowedRoles []string `json:"allowed_roles"`
}

func (s *AppService) GetAll() ([]models.App, error) {
	return s.appRepo.FindAllAdmin()
}

func (s *AppService) GetByID(id string) (*models.App, error) {
	app, err := s.appRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("app not found")
	}
	return app, nil
}

func (s *AppService) Create(input CreateAppInput) (*models.App, error) {
	if input.Name == "" || input.BaseURL == "" {
		return nil, errors.New("name and base_url are required")
	}

	allowedRoles := input.AllowedRoles
	if len(allowedRoles) == 0 {
		// Default to all roles from DB
		if roles, err := s.roleRepo.FindAll(); err == nil && len(roles) > 0 {
			for _, r := range roles {
				allowedRoles = append(allowedRoles, r.Name)
			}
		} else {
			allowedRoles = []string{"admin", "manager", "staff"}
		}
	}
	rolesJSON, err := json.Marshal(allowedRoles)
	if err != nil {
		return nil, errors.New("invalid allowed_roles")
	}

	app := &models.App{
		Name:         input.Name,
		Description:  input.Description,
		Icon:         input.Icon,
		BaseURL:      input.BaseURL,
		IsActive:     true,
		AllowedRoles: string(rolesJSON),
	}

	if err := s.appRepo.Create(app); err != nil {
		return nil, errors.New("failed to create app")
	}
	return app, nil
}

func (s *AppService) Update(id string, input UpdateAppInput) (*models.App, error) {
	app, err := s.appRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("app not found")
	}

	if input.Name != "" {
		app.Name = input.Name
	}
	if input.Description != "" {
		app.Description = input.Description
	}
	if input.Icon != "" {
		app.Icon = input.Icon
	}
	if input.BaseURL != "" {
		app.BaseURL = input.BaseURL
	}
	if input.IsActive != nil {
		app.IsActive = *input.IsActive
	}
	if len(input.AllowedRoles) > 0 {
		rolesJSON, err := json.Marshal(input.AllowedRoles)
		if err != nil {
			return nil, errors.New("invalid allowed_roles")
		}
		app.AllowedRoles = string(rolesJSON)
	}

	if err := s.appRepo.Update(app); err != nil {
		return nil, errors.New("failed to update app")
	}
	return app, nil
}

func (s *AppService) Delete(id string) error {
	_, err := s.appRepo.FindByID(id)
	if err != nil {
		return errors.New("app not found")
	}
	return s.appRepo.Delete(id)
}
