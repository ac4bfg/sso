package models

import "time"

type Role struct {
	ID             string    `json:"id" gorm:"type:uuid;primaryKey"`
	Name           string    `json:"name" gorm:"type:varchar(50);uniqueIndex;not null"`
	Label          string    `json:"label" gorm:"type:varchar(100);not null"`
	CanAccessAdmin bool      `json:"can_access_admin" gorm:"default:false"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
