package handlers

import (
	"time"

	"sso/internal/repositories"
	"sso/internal/services"
	"sso/pkg/response"
	"sso/pkg/validator"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userService *services.UserService
	auditRepo   *repositories.AuditRepository
}

func NewUserHandler(userService *services.UserService, auditRepo *repositories.AuditRepository) *UserHandler {
	return &UserHandler{userService: userService, auditRepo: auditRepo}
}

// Create POST /api/users
func (h *UserHandler) Create(c *fiber.Ctx) error {
	var input services.CreateUserInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}

	if err := validator.ValidatePassword(input.Password); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	user, err := h.userService.Create(input)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusCreated, "User created successfully", user)
}

// GetAll GET /api/users
func (h *UserHandler) GetAll(c *fiber.Ctx) error {
	users, err := h.userService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch users", nil)
	}

	return response.Success(c, fiber.StatusOK, "User list", users)
}

// GetByID GET /api/users/:id
func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	user, err := h.userService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "User detail", user)
}

// Update PUT /api/users/:id
func (h *UserHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var input services.UpdateUserInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}

	user, err := h.userService.Update(id, input)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "User updated successfully", user)
}

// Delete DELETE /api/users/:id
func (h *UserHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.userService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "User deleted successfully", nil)
}

// ChangeRole PATCH /api/users/:id/role
func (h *UserHandler) ChangeRole(c *fiber.Ctx) error {
	id := c.Params("id")

	var input services.ChangeRoleInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}

	user, err := h.userService.ChangeRole(id, input)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Role updated successfully", user)
}

// UpdateProfile PUT /api/user/profile
func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	id := c.Locals("userID").(string)

	var input services.UpdateUserInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}

	// Security: Prevent updating sensitive fields via this endpoint if UpdateUserInput has them
	// In our case UpdateUserInput has Password, but we should ignore it here or handle it?
	// UserService.Update handles password if provided. We should probably force it empty here
	// to enforce using ChangePassword endpoint.
	input.Password = ""

	user, err := h.userService.Update(id, input)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Profile updated successfully", user)
}

// ChangePassword PUT /api/user/password
func (h *UserHandler) ChangePassword(c *fiber.Ctx) error {
	id := c.Locals("userID").(string)

	var input services.ChangePasswordInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}

	// Validation for NewPassword is mandatory
	if input.NewPassword == "" {
		return response.Error(c, fiber.StatusBadRequest, "New password is required", nil)
	}
	// CurrentPassword validation is handled in service based on IsPasswordSet status

	if err := h.userService.ChangePassword(id, input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Password updated successfully", nil)
}

// GetMyApps GET /api/user/apps
func (h *UserHandler) GetMyApps(c *fiber.Ctx) error {
	id := c.Locals("userID").(string)

	apps, err := h.userService.GetMyApps(id)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Authorized apps retrieved", apps)
}

// GetAllApps GET /api/apps
func (h *UserHandler) GetAllApps(c *fiber.Ctx) error {
	apps, err := h.userService.GetAllApps()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch apps", nil)
	}
	return response.Success(c, fiber.StatusOK, "Apps retrieved", apps)
}

// GetUserApps GET /api/users/:id/apps
func (h *UserHandler) GetUserApps(c *fiber.Ctx) error {
	userID := c.Params("id")

	apps, err := h.userService.GetUserApps(userID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusOK, "User apps retrieved", apps)
}

// AssignApp POST /api/users/:id/apps
func (h *UserHandler) AssignApp(c *fiber.Ctx) error {
	userID := c.Params("id")

	var body struct {
		AppID string `json:"app_id"`
		Role  string `json:"role"`
	}
	if err := c.BodyParser(&body); err != nil || body.AppID == "" {
		return response.Error(c, fiber.StatusBadRequest, "app_id is required", nil)
	}
	if body.Role == "" {
		body.Role = "staff"
	}

	if err := h.userService.AssignApp(userID, body.AppID, body.Role); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusOK, "App assigned", nil)
}

// RevokeApp DELETE /api/users/:id/apps/:appId
func (h *UserHandler) RevokeApp(c *fiber.Ctx) error {
	userID := c.Params("id")
	appID := c.Params("appId")

	if err := h.userService.RevokeApp(userID, appID); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusOK, "App revoked", nil)
}

// GetMyActivity GET /api/user/activity
func (h *UserHandler) GetMyActivity(c *fiber.Ctx) error {
	id := c.Locals("userID").(string)
	logs, err := h.auditRepo.FindByUserID(id, 10)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch activity", nil)
	}
	return response.Success(c, fiber.StatusOK, "Activity retrieved", logs)
}

// GetLoginStats GET /api/user/login-stats?from=2025-01-01&to=2025-01-07
func (h *UserHandler) GetLoginStats(c *fiber.Ctx) error {
	from := c.Query("from")
	to := c.Query("to")

	// default: 7 hari terakhir
	if from == "" || to == "" {
		now := time.Now()
		to = now.Format("2006-01-02")
		from = now.AddDate(0, 0, -6).Format("2006-01-02")
	}

	stats, err := h.auditRepo.GetLoginStatsByRange(from, to)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch login stats", nil)
	}
	return response.Success(c, fiber.StatusOK, "Login stats retrieved", stats)
}

// GetRecentActivity GET /api/admin/activity
func (h *UserHandler) GetRecentActivity(c *fiber.Ctx) error {
	logs, err := h.auditRepo.FindRecentWithUsers(10)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch activity", nil)
	}
	return response.Success(c, fiber.StatusOK, "Recent activity retrieved", logs)
}

// GetLogs GET /api/admin/logs
func (h *UserHandler) GetLogs(c *fiber.Ctx) error {
	filter := repositories.LogFilter{
		UserID:    c.Query("user_id"),
		Email:     c.Query("email"),
		EventType: c.Query("event_type"),
	}

	if s := c.Query("success"); s == "true" {
		v := true
		filter.Success = &v
	} else if s == "false" {
		v := false
		filter.Success = &v
	}

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)
	filter.Page = page
	filter.Limit = limit

	logs, total, err := h.auditRepo.FindPaginated(filter)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch logs", nil)
	}

	return response.Success(c, fiber.StatusOK, "Logs retrieved", fiber.Map{
		"logs":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
