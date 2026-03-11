package middleware

import (
	"strings"
	"time"
	"fmt"

	"sso/config"
	"sso/internal/repositories"
	"sso/pkg/cache"
	jwtPkg "sso/pkg/jwt"
	"sso/pkg/response"

	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware memeriksa JWT access token di header Authorization
func AuthMiddleware(cfg *config.Config, redisClient *cache.RedisClient, tokenRepo *repositories.TokenRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Support token from query param for SSE (EventSource can't set headers)
		var tokenString string
		if qt := c.Query("token"); qt != "" {
			tokenString = qt
		} else {
			authHeader := c.Get("Authorization")
			if authHeader == "" {
				return response.Error(c, fiber.StatusUnauthorized, "Token not found", nil)
			}
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				return response.Error(c, fiber.StatusUnauthorized, "Invalid token format", nil)
			}
			tokenString = parts[1]
		}

		claims, err := jwtPkg.ValidateToken(tokenString, cfg.JWTSecret)
		if err != nil {
			return response.Error(c, fiber.StatusUnauthorized, "Invalid or expired token", nil)
		}

		// Validate Session via Redis (Cache-Aside)
		sessionKey := "session:" + claims.SessionID
		exists, err := redisClient.Exists(sessionKey)
		if err != nil {
			fmt.Printf("⚠️ Redis error in middleware: %v\n", err)
		}

		if exists {
			// fmt.Println("✅ Session found in Redis") // Optional debug
		} else {
			fmt.Printf("⚠️ Redis cache miss for session: %s. Checking DB...\n", claims.SessionID)
			
			// Cache Miss - Check DB
			session, err := tokenRepo.FindByID(claims.SessionID)
			if err != nil || session == nil {
				fmt.Println("❌ Session not found in DB (Revoked)")
				return response.Error(c, fiber.StatusUnauthorized, "Session revoked or invalid", nil)
			}
			
			// Check DB Expiry
			if session.ExpiresAt.Before(time.Now()) {
				fmt.Println("❌ Session expired in DB")
				return response.Error(c, fiber.StatusUnauthorized, "Session expired", nil)
			}

			// Valid in DB -> Populate Redis with remaining TTL
			ttl := time.Until(session.ExpiresAt)
			if err := redisClient.Set(sessionKey, session.UserID, ttl); err != nil {
				fmt.Printf("⚠️ Failed to populate Redis: %v\n", err)
			} else {
				fmt.Println("✅ Session repopulated to Redis from DB")
			}
		}

		c.Locals("userID", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}
