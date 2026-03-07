package repositories

import (
	"sso/internal/models"

	"gorm.io/gorm"
)

type AuditRepository struct {
	db *gorm.DB
}

func NewAuditRepository(db *gorm.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) Create(log *models.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *AuditRepository) FindByUserID(userID string, limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}

func (r *AuditRepository) FindRecent(limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error
	return logs, err
}
