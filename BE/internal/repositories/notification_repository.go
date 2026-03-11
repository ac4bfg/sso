package repositories

import (
	"sso/internal/models"

	"gorm.io/gorm"
)

type NotificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Create(n *models.Notification) error {
	return r.db.Create(n).Error
}

func (r *NotificationRepository) FindAll(limit int) ([]models.Notification, error) {
	var notifs []models.Notification
	err := r.db.Order("created_at DESC").Limit(limit).Find(&notifs).Error
	return notifs, err
}

func (r *NotificationRepository) CountUnread() (int64, error) {
	var count int64
	err := r.db.Model(&models.Notification{}).Where("is_read = false").Count(&count).Error
	return count, err
}

func (r *NotificationRepository) MarkRead(id string) error {
	return r.db.Model(&models.Notification{}).Where("id = ?", id).Update("is_read", true).Error
}

func (r *NotificationRepository) MarkAllRead() error {
	return r.db.Model(&models.Notification{}).Where("is_read = false").Update("is_read", true).Error
}

