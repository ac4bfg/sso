package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Notification struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey"`
	Type      string    `json:"type" gorm:"type:varchar(50);not null;index"`
	Title     string    `json:"title" gorm:"type:varchar(255);not null"`
	Message   string    `json:"message" gorm:"type:text;not null"`
	UserName  string    `json:"user_name" gorm:"type:varchar(255)"`
	Email     string    `json:"email" gorm:"type:varchar(255)"`
	IPAddress string    `json:"ip_address" gorm:"type:varchar(45)"`
	IsRead    bool      `json:"is_read" gorm:"default:false;index"`
	CreatedAt time.Time `json:"created_at" gorm:"index"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	return nil
}

// Notification type constants
const (
	NotifBruteForce    = "brute_force"
	NotifNewIPLogin    = "new_ip_login"
	NotifPasswordReset = "password_reset"
	NotifUserDisabled  = "user_disabled"
	NotifAccessRequest = "access_request"
)
