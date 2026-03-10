package repositories

import (
	"sso/internal/models"

	"gorm.io/gorm"
)

type RoleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) FindAll() ([]models.Role, error) {
	var roles []models.Role
	err := r.db.Order("name ASC").Find(&roles).Error
	return roles, err
}

func (r *RoleRepository) FindByName(name string) (*models.Role, error) {
	var role models.Role
	err := r.db.Where("name = ?", name).First(&role).Error
	return &role, err
}

func (r *RoleRepository) FindByID(id string) (*models.Role, error) {
	var role models.Role
	err := r.db.First(&role, "id = ?", id).Error
	return &role, err
}

func (r *RoleRepository) Create(role *models.Role) error {
	return r.db.Create(role).Error
}

func (r *RoleRepository) Update(role *models.Role) error {
	return r.db.Save(role).Error
}

func (r *RoleRepository) Delete(id string) error {
	return r.db.Delete(&models.Role{}, "id = ?", id).Error
}
