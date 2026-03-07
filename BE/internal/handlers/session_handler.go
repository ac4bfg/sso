package handlers

import (
	"sso/internal/repositories"
	"sso/pkg/cache"
	"sso/pkg/response"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

type SessionHandler struct {
	tokenRepo   *repositories.TokenRepository
	redisClient *cache.RedisClient
}

func NewSessionHandler(tokenRepo *repositories.TokenRepository, redisClient *cache.RedisClient) *SessionHandler {
	return &SessionHandler{
		tokenRepo:   tokenRepo,
		redisClient: redisClient,
	}
}

// GetSessions GET /api/sessions returns active sessions for the authenticated user
func (h *SessionHandler) GetSessions(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	
	tokens, err := h.tokenRepo.FindByUserID(userID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch sessions", nil)
	}

	currentRefreshToken := c.Cookies("refresh_token")
	var sessionList []fiber.Map

	for _, t := range tokens {
		isCurrent := t.Token == currentRefreshToken
		sessionList = append(sessionList, fiber.Map{
			"id":           t.ID,
			"user_agent":   t.UserAgent,
			"ip_address":   t.IPAddress,
			"last_used_at": t.LastUsedAt,
			"created_at":   t.CreatedAt,
			"is_current":   isCurrent,
		})
	}

	return response.Success(c, fiber.StatusOK, "Active sessions", sessionList)
}

// RevokeSession DELETE /api/sessions/:id revokes a specific session
func (h *SessionHandler) RevokeSession(c *fiber.Ctx) error {
	// userID := c.Locals("userID").(string) // In future, use this for ownership check
	id := c.Params("id")
	currentRefreshToken := c.Cookies("refresh_token")

	// Check if trying to revoke current session
	if currentRefreshToken != "" {
		currentSession, err := h.tokenRepo.FindByToken(currentRefreshToken)
		if err == nil && currentSession != nil && currentSession.ID == id {
			return response.Error(c, fiber.StatusBadRequest, "Cannot revoke current session. Please use logout instead.", nil)
		}
	}

	// Delete from Redis (Wait, we should delete from Redis FIRST or concurrently)
	_ = h.redisClient.Del(fmt.Sprintf("session:%s", id))

	if err := h.tokenRepo.Delete(id); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to revoke session", nil)
	}

	return response.Success(c, fiber.StatusOK, "Session revoked", nil)
}
