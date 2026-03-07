package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditLog struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey"`
	UserID    *string   `json:"user_id" gorm:"type:uuid;index"`
	Email     string    `json:"email" gorm:"type:varchar(255)"`
	EventType string   `json:"event_type" gorm:"type:varchar(50);index;not null"`
	Success   bool      `json:"success"`
	IPAddress string    `json:"ip_address" gorm:"type:varchar(45)"`
	UserAgent string    `json:"user_agent" gorm:"type:text"`
	Details   string    `json:"details" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at" gorm:"index"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}

// Event type constants
const (
	EventLoginSuccess  = "login_success"
	EventLoginFailed   = "login_failed"
	EventLogout        = "logout"
	EventRegister      = "register"
	EventTokenRefresh  = "token_refresh"
	EventAccountLocked = "account_locked"
)
