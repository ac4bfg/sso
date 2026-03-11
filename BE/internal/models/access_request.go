package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccessRequest struct {
	ID         string     `json:"id" gorm:"type:uuid;primaryKey"`
	Name       string     `json:"name" gorm:"type:varchar(255);not null"`
	Email      string     `json:"email" gorm:"type:varchar(255);not null;index"`
	Department string     `json:"department" gorm:"type:varchar(255)"`
	Reason     string     `json:"reason" gorm:"type:text"`
	Status     string     `json:"status" gorm:"type:varchar(20);default:'pending';index"` // pending | approved | rejected
	ReviewedBy *string    `json:"reviewed_by" gorm:"type:uuid"`
	ReviewNote string     `json:"review_note" gorm:"type:text"`
	ReviewedAt *time.Time `json:"reviewed_at"`
	CreatedAt  time.Time  `json:"created_at" gorm:"index"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

func (a *AccessRequest) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}

const (
	AccessRequestPending  = "pending"
	AccessRequestApproved = "approved"
	AccessRequestRejected = "rejected"
)
