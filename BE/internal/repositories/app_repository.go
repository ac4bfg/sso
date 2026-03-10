package repositories

import (
	"sso/internal/models"

	"gorm.io/gorm"
)

type AppRepository struct {
	db *gorm.DB
}

func NewAppRepository(db *gorm.DB) *AppRepository {
	return &AppRepository{db: db}
}

func (r *AppRepository) Create(app *models.App) error {
	return r.db.Create(app).Error
}

func (r *AppRepository) FindAll() ([]models.App, error) {
	var apps []models.App
	err := r.db.Where("is_active = ?", true).Find(&apps).Error
	return apps, err
}

func (r *AppRepository) FindByName(name string) (*models.App, error) {
	var app models.App
	err := r.db.Where("name = ?", name).First(&app).Error
	return &app, err
}

func (r *AppRepository) AssignUserToApp(role *models.UserAppRole) error {
	return r.db.Save(role).Error
}

func (r *AppRepository) FindAppsByUserID(userID string) ([]models.App, error) {
	var apps []models.App
	err := r.db.Joins("JOIN user_app_roles ON apps.id = user_app_roles.app_id").
		Where("user_app_roles.user_id = ? AND apps.is_active = ?", userID, true).
		Find(&apps).Error
	return apps, err
}

func (r *AppRepository) RevokeUserFromApp(userID, appID string) error {
	return r.db.Where("user_id = ? AND app_id = ?", userID, appID).Delete(&models.UserAppRole{}).Error
}

func (r *AppRepository) FindAppsWithRolesByUserID(userID string) ([]models.AppWithRole, error) {
	var results []models.AppWithRole
	err := r.db.Table("apps").
		Select("apps.id, apps.name, apps.description, apps.icon, apps.base_url, apps.allowed_roles, user_app_roles.role").
		Joins("JOIN user_app_roles ON apps.id = user_app_roles.app_id").
		Where("user_app_roles.user_id = ? AND apps.is_active = ?", userID, true).
		Scan(&results).Error
	return results, err
}

func (r *AppRepository) FindByID(id string) (*models.App, error) {
	var app models.App
	err := r.db.First(&app, "id = ?", id).Error
	return &app, err
}

func (r *AppRepository) FindAllAdmin() ([]models.App, error) {
	var apps []models.App
	err := r.db.Find(&apps).Error
	return apps, err
}

func (r *AppRepository) Update(app *models.App) error {
	return r.db.Save(app).Error
}

func (r *AppRepository) Delete(id string) error {
	return r.db.Model(&models.App{}).Where("id = ?", id).Update("is_active", false).Error
}
