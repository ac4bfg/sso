package handlers

import (
	"sso/internal/services"
	"sso/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{userService: userService}
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
