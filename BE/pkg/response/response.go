package response

import "github.com/gofiber/fiber/v2"

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Errors  interface{} `json:"errors,omitempty"`
}

func Success(c *fiber.Ctx, status int, message string, data interface{}) error {
	return c.Status(status).JSON(Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Error(c *fiber.Ctx, status int, message string, errors interface{}) error {
	return c.Status(status).JSON(Response{
		Success: false,
		Message: message,
		Errors:  errors,
	})
}
