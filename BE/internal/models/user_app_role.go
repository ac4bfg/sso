package models

import (
	"time"

	"gorm.io/gorm"
)

type UserAppRole struct {
	UserID    string    `json:"user_id" gorm:"type:uuid;primaryKey"`
	AppID     string    `json:"app_id" gorm:"type:uuid;primaryKey"`
	Role      string    `json:"role" gorm:"type:varchar(50);not null;default:'user'"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Associations
	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	App  App  `gorm:"foreignKey:AppID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (u *UserAppRole) BeforeCreate(tx *gorm.DB) error {
	return nil
}
