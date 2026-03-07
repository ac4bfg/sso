package repositories

import (
	"time"

	"sso/internal/models"

	"gorm.io/gorm"
)

type TokenRepository struct {
	db *gorm.DB
}

func NewTokenRepository(db *gorm.DB) *TokenRepository {
	return &TokenRepository{db: db}
}

func (r *TokenRepository) Create(token *models.RefreshToken) error {
	return r.db.Create(token).Error
}

func (r *TokenRepository) FindByToken(token string) (*models.RefreshToken, error) {
	var rt models.RefreshToken
	err := r.db.Where("token = ? AND expires_at > ?", token, time.Now()).First(&rt).Error
	if err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *TokenRepository) DeleteByToken(token string) error {
	return r.db.Where("token = ?", token).Delete(&models.RefreshToken{}).Error
}

func (r *TokenRepository) DeleteByUserID(userID string) error {
	return r.db.Where("user_id = ?", userID).Delete(&models.RefreshToken{}).Error
}

func (r *TokenRepository) DeleteExpired() error {
	return r.db.Where("expires_at < ?", time.Now()).Delete(&models.RefreshToken{}).Error
}

func (r *TokenRepository) FindByUserID(userID string) ([]models.RefreshToken, error) {
	var tokens []models.RefreshToken
	err := r.db.Where("user_id = ? AND expires_at > ?", userID, time.Now()).
		Order("created_at DESC").
		Find(&tokens).Error
	return tokens, err
}

func (r *TokenRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.RefreshToken{}).Error
}

func (r *TokenRepository) FindByID(id string) (*models.RefreshToken, error) {
	var rt models.RefreshToken
	err := r.db.Where("id = ?", id).First(&rt).Error
	if err != nil {
		return nil, err
	}
	return &rt, nil
}
