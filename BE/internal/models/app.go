package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type App struct {
	ID          string         `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string         `json:"name" gorm:"type:varchar(100);not null"`
	Description string         `json:"description" gorm:"type:text"`
	Icon        string         `json:"icon" gorm:"type:varchar(50)"`
	BaseURL     string         `json:"base_url" gorm:"type:varchar(255);not null"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

func (a *App) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}
