package handlers

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"sso/internal/models"
	"sso/internal/repositories"
	"sso/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
)

// SSEHub manages all active SSE connections for admin notifications
type SSEHub struct {
	mu      sync.RWMutex
	clients map[string]chan []byte // clientID → channel
}

var NotifHub = &SSEHub{
	clients: make(map[string]chan []byte),
}

func (h *SSEHub) register(id string) chan []byte {
	ch := make(chan []byte, 10)
	h.mu.Lock()
	h.clients[id] = ch
	h.mu.Unlock()
	return ch
}

func (h *SSEHub) unregister(id string) {
	h.mu.Lock()
	if ch, ok := h.clients[id]; ok {
		close(ch)
		delete(h.clients, id)
	}
	h.mu.Unlock()
}

// Broadcast sends a notification to all connected admin clients
func (h *SSEHub) Broadcast(notif *models.Notification) {
	data, err := json.Marshal(notif)
	if err != nil {
		log.Printf("SSE broadcast marshal error: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()
	for id, ch := range h.clients {
		select {
		case ch <- data:
		default:
			log.Printf("SSE client %s buffer full, skipping", id)
		}
	}
}

// NotificationHandler handles notification REST + SSE endpoints
type NotificationHandler struct {
	notifRepo *repositories.NotificationRepository
}

func NewNotificationHandler(notifRepo *repositories.NotificationRepository) *NotificationHandler {
	return &NotificationHandler{notifRepo: notifRepo}
}

// Stream GET /api/admin/notifications/stream — SSE endpoint
func (h *NotificationHandler) Stream(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")

	ch := NotifHub.register(userID)

	c.Context().SetBodyStreamWriter(fasthttp.StreamWriter(func(w *bufio.Writer) {
		defer NotifHub.unregister(userID)
		for data := range ch {
			fmt.Fprintf(w, "data: %s\n\n", data)
			if err := w.Flush(); err != nil {
				return
			}
		}
	}))

	return nil
}

// GetAll GET /api/admin/notifications
func (h *NotificationHandler) GetAll(c *fiber.Ctx) error {
	notifs, err := h.notifRepo.FindAll(50)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch notifications", nil)
	}
	unread, _ := h.notifRepo.CountUnread()
	return response.Success(c, fiber.StatusOK, "Notifications retrieved", fiber.Map{
		"notifications": notifs,
		"unread_count":  unread,
	})
}

// MarkRead POST /api/admin/notifications/:id/read
func (h *NotificationHandler) MarkRead(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.notifRepo.MarkRead(id); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to mark as read", nil)
	}
	return response.Success(c, fiber.StatusOK, "Marked as read", nil)
}

// MarkAllRead POST /api/admin/notifications/read-all
func (h *NotificationHandler) MarkAllRead(c *fiber.Ctx) error {
	if err := h.notifRepo.MarkAllRead(); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to mark all as read", nil)
	}
	return response.Success(c, fiber.StatusOK, "All notifications marked as read", nil)
}
