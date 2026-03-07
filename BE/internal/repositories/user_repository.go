package repositories

import (
	"time"

	"sso/internal/models"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByID(id string) (*models.User, error) {
	var user models.User
	err := r.db.Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindAll() ([]models.User, error) {
	var users []models.User
	err := r.db.Order("created_at DESC").Find(&users).Error
	return users, err
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.User{}).Error
}

func (r *UserRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&models.User{}).Count(&count).Error
	return count, err
}

func (r *UserRepository) UpdateLastLogin(id string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("last_login_at", gorm.Expr("NOW()")).Error
}

func (r *UserRepository) IncrementFailedAttempts(id string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).
		Update("failed_login_attempts", gorm.Expr("failed_login_attempts + 1")).Error
}

func (r *UserRepository) LockAccount(id string, until time.Time) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"locked_until": until,
		}).Error
}

func (r *UserRepository) ResetFailedAttempts(id string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"failed_login_attempts": 0,
			"locked_until":         nil,
		}).Error
}
