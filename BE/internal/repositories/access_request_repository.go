package repositories

import (
	"sso/internal/models"

	"gorm.io/gorm"
)

type AccessRequestRepository struct {
	db *gorm.DB
}

func NewAccessRequestRepository(db *gorm.DB) *AccessRequestRepository {
	return &AccessRequestRepository{db: db}
}

func (r *AccessRequestRepository) Create(req *models.AccessRequest) error {
	return r.db.Create(req).Error
}

func (r *AccessRequestRepository) FindAll() ([]models.AccessRequest, error) {
	var requests []models.AccessRequest
	err := r.db.Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *AccessRequestRepository) FindPending() ([]models.AccessRequest, error) {
	var requests []models.AccessRequest
	err := r.db.Where("status = ?", models.AccessRequestPending).
		Order("created_at DESC").Find(&requests).Error
	return requests, err
}

func (r *AccessRequestRepository) FindByID(id string) (*models.AccessRequest, error) {
	var req models.AccessRequest
	err := r.db.Where("id = ?", id).First(&req).Error
	return &req, err
}

func (r *AccessRequestRepository) Update(req *models.AccessRequest) error {
	return r.db.Save(req).Error
}

func (r *AccessRequestRepository) CountPending() (int64, error) {
	var count int64
	err := r.db.Model(&models.AccessRequest{}).Where("status = ?", models.AccessRequestPending).Count(&count).Error
	return count, err
}

// FindPendingByEmail cek apakah ada request pending untuk email tertentu
func (r *AccessRequestRepository) FindPendingByEmail(email string) (*models.AccessRequest, error) {
	var req models.AccessRequest
	err := r.db.Where("email = ? AND status = ?", email, models.AccessRequestPending).First(&req).Error
	if err != nil {
		return nil, err
	}
	return &req, nil
}

// FindRejectedByEmail ambil request rejected terbaru untuk email tertentu
func (r *AccessRequestRepository) FindRejectedByEmail(email string) (*models.AccessRequest, error) {
	var req models.AccessRequest
	err := r.db.Where("email = ? AND status = ?", email, models.AccessRequestRejected).
		Order("reviewed_at DESC").First(&req).Error
	if err != nil {
		return nil, err
	}
	return &req, nil
}
