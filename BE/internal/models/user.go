package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID                  string         `json:"id" gorm:"type:uuid;primaryKey"`
	Name                string         `json:"name" gorm:"type:varchar(255);not null"`
	Email               string         `json:"email" gorm:"type:varchar(255);uniqueIndex;not null"`
	Password            string         `json:"-" gorm:"type:varchar(255);not null"`
	Role                string         `json:"role" gorm:"type:varchar(50);default:'staff'"`
	IsActive            bool           `json:"is_active" gorm:"default:true"`
	IsPasswordSet       bool           `json:"is_password_set" gorm:"default:false"`
	FailedLoginAttempts int            `json:"-" gorm:"default:0"`
	LockedUntil         *time.Time     `json:"-"`
	LastLoginAt         *time.Time     `json:"last_login_at"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `json:"-" gorm:"index"`
	Apps                []UserAppRole  `json:"apps" gorm:"foreignKey:UserID"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

// UserResponse digunakan untuk response tanpa field sensitif
type UserResponse struct {
	ID            string     `json:"id"`
	Name          string     `json:"name"`
	Email         string     `json:"email"`
	Role          string     `json:"role"`
	IsActive      bool       `json:"is_active"`
	IsPasswordSet bool       `json:"is_password_set"`
	LastLoginAt   *time.Time `json:"last_login_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:            u.ID,
		Name:          u.Name,
		Email:         u.Email,
		Role:          u.Role,
		IsActive:      u.IsActive,
		IsPasswordSet: u.IsPasswordSet,
		LastLoginAt:   u.LastLoginAt,
		CreatedAt:     u.CreatedAt,
	}
}
