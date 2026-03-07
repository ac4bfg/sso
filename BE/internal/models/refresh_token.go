package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RefreshToken struct {
	ID        string    `json:"id" gorm:"type:uuid;primaryKey"`
	UserID    string    `json:"user_id" gorm:"type:uuid;index;not null"`
	Token     string    `json:"-" gorm:"type:varchar(500);uniqueIndex;not null"`
	UserAgent string    `json:"user_agent" gorm:"type:text"`
	IPAddress string    `json:"ip_address" gorm:"type:varchar(45)"`
	LastUsedAt time.Time `json:"last_used_at"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`

	User User `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

func (rt *RefreshToken) BeforeCreate(tx *gorm.DB) error {
	if rt.ID == "" {
		rt.ID = uuid.New().String()
	}
	return nil
}
