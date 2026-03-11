package handlers

import (
	"fmt"
	"time"

	"sso/internal/models"
	"sso/internal/repositories"
	"sso/internal/services"
	"sso/pkg/response"
	"sso/pkg/validator"

	"github.com/gofiber/fiber/v2"
)

type AccessRequestHandler struct {
	requestRepo *repositories.AccessRequestRepository
	notifRepo   *repositories.NotificationRepository
	userService *services.UserService
	userRepo    *repositories.UserRepository
}

func NewAccessRequestHandler(
	requestRepo *repositories.AccessRequestRepository,
	notifRepo *repositories.NotificationRepository,
	userService *services.UserService,
	userRepo *repositories.UserRepository,
) *AccessRequestHandler {
	return &AccessRequestHandler{
		requestRepo: requestRepo,
		notifRepo:   notifRepo,
		userService: userService,
		userRepo:    userRepo,
	}
}

// CheckEmail GET /api/access-requests/check?email= — public, no auth
func (h *AccessRequestHandler) CheckEmail(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return response.Error(c, fiber.StatusBadRequest, "Email is required", nil)
	}
	// Check if email already has an account
	if existing, err := h.userRepo.FindByEmail(email); err == nil && existing != nil {
		return response.Success(c, fiber.StatusOK, "Email already registered", fiber.Map{
			"pending":    false,
			"registered": true,
		})
	}
	// Check pending first
	pending, err := h.requestRepo.FindPendingByEmail(email)
	if err == nil && pending != nil {
		return response.Success(c, fiber.StatusOK, "Pending request exists", fiber.Map{
			"pending":    true,
			"created_at": pending.CreatedAt,
		})
	}
	// Check if previously rejected — inform user but allow resubmit
	rejected, err := h.requestRepo.FindRejectedByEmail(email)
	if err == nil && rejected != nil {
		return response.Success(c, fiber.StatusOK, "Previously rejected", fiber.Map{
			"pending":     false,
			"rejected":    true,
			"review_note": rejected.ReviewNote,
			"reviewed_at": rejected.ReviewedAt,
		})
	}
	return response.Success(c, fiber.StatusOK, "Email available", fiber.Map{"pending": false})
}

// Submit POST /api/access-requests — public, no auth
func (h *AccessRequestHandler) Submit(c *fiber.Ctx) error {
	var body struct {
		Name       string `json:"name"`
		Email      string `json:"email"`
		Department string `json:"department"`
		Reason     string `json:"reason"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}
	if body.Name == "" || body.Email == "" {
		return response.Error(c, fiber.StatusBadRequest, "Name and email are required", nil)
	}

	// Block if email already has an account
	if existing, err := h.userRepo.FindByEmail(body.Email); err == nil && existing != nil {
		return response.Error(c, fiber.StatusConflict, "An account with this email already exists", nil)
	}
	// Block duplicate pending request
	if existing, err := h.requestRepo.FindPendingByEmail(body.Email); err == nil && existing != nil {
		return response.Error(c, fiber.StatusConflict, "A pending request already exists for this email", nil)
	}

	req := &models.AccessRequest{
		Name:       body.Name,
		Email:      body.Email,
		Department: body.Department,
		Reason:     body.Reason,
		Status:     models.AccessRequestPending,
	}
	if err := h.requestRepo.Create(req); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to submit request", nil)
	}

	// Notify admins via SSE
	notif := &models.Notification{
		Type:     models.NotifAccessRequest,
		Title:    "New Access Request",
		Message:  fmt.Sprintf("%s (%s) requested access%s", body.Name, body.Email, deptSuffix(body.Department)),
		UserName: body.Name,
		Email:    body.Email,
	}
	if err := h.notifRepo.Create(notif); err == nil {
		NotifHub.Broadcast(notif)
	}

	return response.Success(c, fiber.StatusCreated, "Access request submitted successfully", fiber.Map{
		"id": req.ID,
	})
}

// GetAll GET /api/admin/requests — admin only
func (h *AccessRequestHandler) GetAll(c *fiber.Ctx) error {
	requests, err := h.requestRepo.FindAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch requests", nil)
	}
	pending, _ := h.requestRepo.CountPending()
	return response.Success(c, fiber.StatusOK, "Access requests retrieved", fiber.Map{
		"requests":      requests,
		"pending_count": pending,
	})
}

// Approve POST /api/admin/requests/:id/approve — admin only
func (h *AccessRequestHandler) Approve(c *fiber.Ctx) error {
	id := c.Params("id")
	adminID := c.Locals("userID").(string)

	var body struct {
		Role     string `json:"role"`
		Password string `json:"password"`
		Note     string `json:"note"`
	}
	if err := c.BodyParser(&body); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}
	if body.Password == "" {
		return response.Error(c, fiber.StatusBadRequest, "Password is required", nil)
	}
	if err := validator.ValidatePassword(body.Password); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	req, err := h.requestRepo.FindByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, "Request not found", nil)
	}
	if req.Status != models.AccessRequestPending {
		return response.Error(c, fiber.StatusBadRequest, "Request has already been reviewed", nil)
	}

	// Create user
	role := body.Role
	if role == "" {
		role = "staff"
	}
	user, err := h.userService.Create(services.CreateUserInput{
		Name:     req.Name,
		Email:    req.Email,
		Password: body.Password,
		Role:     role,
	})
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	// Update request status
	now := time.Now()
	req.Status = models.AccessRequestApproved
	req.ReviewedBy = &adminID
	req.ReviewNote = body.Note
	req.ReviewedAt = &now
	_ = h.requestRepo.Update(req)

	return response.Success(c, fiber.StatusOK, "Request approved and user created", user)
}

// Reject POST /api/admin/requests/:id/reject — admin only
func (h *AccessRequestHandler) Reject(c *fiber.Ctx) error {
	id := c.Params("id")
	adminID := c.Locals("userID").(string)

	var body struct {
		Note string `json:"note"`
	}
	_ = c.BodyParser(&body)

	req, err := h.requestRepo.FindByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, "Request not found", nil)
	}
	if req.Status != models.AccessRequestPending {
		return response.Error(c, fiber.StatusBadRequest, "Request has already been reviewed", nil)
	}

	now := time.Now()
	req.Status = models.AccessRequestRejected
	req.ReviewedBy = &adminID
	req.ReviewNote = body.Note
	req.ReviewedAt = &now
	if err := h.requestRepo.Update(req); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to reject request", nil)
	}

	return response.Success(c, fiber.StatusOK, "Request rejected", nil)
}

func deptSuffix(dept string) string {
	if dept != "" {
		return " — " + dept
	}
	return ""
}
