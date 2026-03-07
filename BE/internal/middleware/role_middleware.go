package middleware

import (
	"sso/pkg/response"

	"github.com/gofiber/fiber/v2"
)

// RoleMiddleware membatasi akses berdasarkan role
func RoleMiddleware(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role")
		if role == nil {
			return response.Error(c, fiber.StatusForbidden, "Access denied", nil)
		}

		userRole := role.(string)
		for _, allowed := range allowedRoles {
			if userRole == allowed {
				return c.Next()
			}
		}

		return response.Error(c, fiber.StatusForbidden, "You do not have access to this feature", nil)
	}
}
