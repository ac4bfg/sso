package handlers

import (
	"sso/internal/services"
	"sso/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type RoleHandler struct {
	roleService *services.RoleService
}

func NewRoleHandler(roleService *services.RoleService) *RoleHandler {
	return &RoleHandler{roleService: roleService}
}

// GetAll GET /api/roles
func (h *RoleHandler) GetAll(c *fiber.Ctx) error {
	roles, err := h.roleService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch roles", nil)
	}
	return response.Success(c, fiber.StatusOK, "Roles retrieved", roles)
}

// Create POST /api/roles
func (h *RoleHandler) Create(c *fiber.Ctx) error {
	var input services.CreateRoleInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}
	role, err := h.roleService.Create(input)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusCreated, "Role created", role)
}

// Update PUT /api/roles/:id
func (h *RoleHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var input services.UpdateRoleInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}
	role, err := h.roleService.Update(id, input)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusOK, "Role updated", role)
}

// Delete DELETE /api/roles/:id
func (h *RoleHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.roleService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusOK, "Role deleted", nil)
}
