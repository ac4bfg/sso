package handlers

import (
	"sso/internal/services"
	"sso/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type AppHandler struct {
	appService *services.AppService
}

func NewAppHandler(appService *services.AppService) *AppHandler {
	return &AppHandler{appService: appService}
}

// GetAll GET /api/apps
func (h *AppHandler) GetAll(c *fiber.Ctx) error {
	apps, err := h.appService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch apps", nil)
	}
	return response.Success(c, fiber.StatusOK, "App list", apps)
}

// GetByID GET /api/apps/:id
func (h *AppHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	app, err := h.appService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusOK, "App detail", app)
}

// Create POST /api/apps
func (h *AppHandler) Create(c *fiber.Ctx) error {
	var input services.CreateAppInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}

	app, err := h.appService.Create(input)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusCreated, "App created", app)
}

// Update PUT /api/apps/:id
func (h *AppHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var input services.UpdateAppInput
	if err := c.BodyParser(&input); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request data", nil)
	}

	app, err := h.appService.Update(id, input)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusOK, "App updated", app)
}

// Delete DELETE /api/apps/:id
func (h *AppHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.appService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}
	return response.Success(c, fiber.StatusOK, "App deactivated", nil)
}
