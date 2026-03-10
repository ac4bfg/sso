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

type DailyLoginStat struct {
	Date    string `json:"date"`
	Success int    `json:"success"`
	Failed  int    `json:"failed"`
}

func (r *AuditRepository) GetLoginStatsByDay(days int) ([]DailyLoginStat, error) {
	var results []DailyLoginStat
	err := r.db.Raw(`
		SELECT
			DATE(created_at) as date,
			SUM(CASE WHEN event_type = 'login_success' THEN 1 ELSE 0 END) as success,
			SUM(CASE WHEN event_type = 'login_failed' THEN 1 ELSE 0 END) as failed
		FROM audit_logs
		WHERE created_at >= NOW() - INTERVAL '? days'
		  AND event_type IN ('login_success', 'login_failed')
		GROUP BY DATE(created_at)
		ORDER BY DATE(created_at) ASC
	`, days).Scan(&results).Error
	return results, err
}
