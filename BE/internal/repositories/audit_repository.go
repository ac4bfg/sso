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

type AuditLogWithUser struct {
	models.AuditLog
	UserName string `json:"user_name"`
}

func (r *AuditRepository) FindRecentWithUsers(limit int) ([]AuditLogWithUser, error) {
	var results []AuditLogWithUser
	err := r.db.Table("audit_logs").
		Select("audit_logs.*, users.name as user_name").
		Joins("LEFT JOIN users ON audit_logs.user_id = users.id").
		Order("audit_logs.created_at DESC").
		Limit(limit).
		Scan(&results).Error
	return results, err
}

type LogFilter struct {
	UserID    string
	Email     string
	EventType string
	Success   *bool
	Page      int
	Limit     int
}

func (r *AuditRepository) FindPaginated(filter LogFilter) ([]AuditLogWithUser, int64, error) {
	var results []AuditLogWithUser
	var total int64

	q := r.db.Table("audit_logs").
		Select("audit_logs.*, users.name as user_name").
		Joins("LEFT JOIN users ON audit_logs.user_id = users.id")

	if filter.UserID != "" {
		q = q.Where("audit_logs.user_id = ?", filter.UserID)
	}
	if filter.Email != "" {
		q = q.Where("audit_logs.email ILIKE ?", "%"+filter.Email+"%")
	}
	if filter.EventType != "" {
		q = q.Where("audit_logs.event_type = ?", filter.EventType)
	}
	if filter.Success != nil {
		q = q.Where("audit_logs.success = ?", *filter.Success)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	err := q.Order("audit_logs.created_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(&results).Error
	return results, total, err
}

// CountRecentFailedByIP menghitung login gagal dari IP tertentu dalam N menit terakhir
func (r *AuditRepository) CountRecentFailedByIP(ip string, minutes int) (int64, error) {
	var count int64
	err := r.db.Model(&models.AuditLog{}).
		Where("ip_address = ? AND event_type = ? AND created_at > NOW() - (? * INTERVAL '1 minute')", ip, models.EventLoginFailed, minutes).
		Count(&count).Error
	return count, err
}

// IsNewIPForUser cek apakah IP ini baru pertama kali dipakai user untuk login sukses
func (r *AuditRepository) IsNewIPForUser(userID, ip string) (bool, error) {
	var count int64
	err := r.db.Model(&models.AuditLog{}).
		Where("user_id = ? AND ip_address = ? AND event_type = ?", userID, ip, models.EventLoginSuccess).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	// count == 1 berarti ini pertama kali (baru saja dicreate di atas)
	return count <= 1, nil
}

type DailyLoginStat struct {
	Date    string `json:"date"`
	Success int    `json:"success"`
	Failed  int    `json:"failed"`
}

func (r *AuditRepository) GetLoginStatsByRange(from, to string) ([]DailyLoginStat, error) {
	var results []DailyLoginStat
	err := r.db.Raw(`
		SELECT
			DATE(created_at) as date,
			SUM(CASE WHEN event_type = 'login_success' THEN 1 ELSE 0 END) as success,
			SUM(CASE WHEN event_type = 'login_failed' THEN 1 ELSE 0 END) as failed
		FROM audit_logs
		WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
		  AND event_type IN ('login_success', 'login_failed')
		GROUP BY DATE(created_at)
		ORDER BY DATE(created_at) ASC
	`, from, to).Scan(&results).Error
	return results, err
}
