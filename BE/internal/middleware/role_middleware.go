package middleware

import (
	"sso/internal/repositories"
	"sso/pkg/response"

	"github.com/gofiber/fiber/v2"
)

// RoleMiddleware membatasi akses berdasarkan role (exact match).
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

// AdminAccessMiddleware cek can_access_admin dari tabel roles secara dinamis.
// Gunakan ini untuk admin routes agar role baru dengan can_access_admin=true otomatis bisa akses.
func AdminAccessMiddleware(roleRepo *repositories.RoleRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role")
		if role == nil {
			return response.Error(c, fiber.StatusForbidden, "Access denied", nil)
		}
		userRole := role.(string)

		r, err := roleRepo.FindByName(userRole)
		if err != nil || !r.CanAccessAdmin {
			return response.Error(c, fiber.StatusForbidden, "You do not have access to this feature", nil)
		}

		return c.Next()
	}
}
