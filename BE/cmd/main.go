package main

import (
	"log"
	"strings"
	"time"

	"sso/config"
	"sso/database"
	"sso/internal/handlers"
	"sso/internal/middleware"
	"sso/internal/repositories"
	"sso/internal/services"
	"sso/pkg/cache"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	cfg := config.Load()

	database.Connect(cfg)
	database.Migrate()

	redisClient, err := cache.NewRedisClient(cfg)
	if err != nil {
		log.Fatalf("❌ Gagal connect Redis: %v", err)
	}
	log.Println("✅ Redis connected")

	userRepo := repositories.NewUserRepository(database.DB)
	tokenRepo := repositories.NewTokenRepository(database.DB)
	auditRepo := repositories.NewAuditRepository(database.DB)
	appRepo := repositories.NewAppRepository(database.DB)
	roleRepo := repositories.NewRoleRepository(database.DB)

	go func() {
		if err := tokenRepo.DeleteExpired(); err == nil {
			log.Println("🧹 Housekeeping: Session kadaluarsa dibersihkan saat boot")
		}

		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for range ticker.C {
			if err := tokenRepo.DeleteExpired(); err != nil {
				log.Printf("⚠️ Gagal membuang session kadaluarsa: %v", err)
			} else {
				log.Println("🧹 Housekeeping: Berhasil membuang session kadaluarsa")
			}
		}
	}()

	authService := services.NewAuthService(cfg, userRepo, tokenRepo, auditRepo, appRepo, roleRepo, redisClient)
	oauthService := services.NewOAuthService(cfg, authService, userRepo)
	userService := services.NewUserService(userRepo, appRepo, roleRepo)
	appService := services.NewAppService(appRepo, roleRepo)
	roleService := services.NewRoleService(roleRepo)

	if err := authService.SeedAdmin(cfg.SeedAdminName, cfg.SeedAdminEmail, cfg.SeedAdminPassword); err != nil {
		log.Printf("⚠️ Gagal seed admin: %v", err)
	} else {
		log.Println("✅ Admin seed checked")
	}

	if err := authService.SeedAppsAndAssignAdmin(cfg.SeedAdminEmail); err != nil {
		log.Printf("⚠️ Gagal seed apps: %v", err)
	} else {
		log.Println("✅ Apps seed checked")
	}

	authHandler := handlers.NewAuthHandler(authService, oauthService, auditRepo, cfg)
	sessionHandler := handlers.NewSessionHandler(tokenRepo, redisClient)
	userHandler := handlers.NewUserHandler(userService, auditRepo)
	appHandler := handlers.NewAppHandler(appService)
	roleHandler := handlers.NewRoleHandler(roleService)

	app := fiber.New(fiber.Config{
		AppName:      "Cost Control SSO",
		ErrorHandler: customErrorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${method} ${path}\n",
	}))
	app.Use(helmet.New())

	corsConfig := cors.Config{
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}

	if cfg.CORSOrigins == "*" {
		corsConfig.AllowOriginsFunc = func(origin string) bool {
			return true
		}
	} else {
		allowedOrigins := cfg.CORSOrigins
		corsConfig.AllowOriginsFunc = func(origin string) bool {
			// Allow all localhost origins regardless of port (for local dev)
			if strings.HasPrefix(origin, "http://localhost:") || origin == "http://localhost" {
				return true
			}
			// Check against explicit allowed origins
			for _, o := range strings.Split(allowedOrigins, ",") {
				if strings.TrimSpace(o) == origin {
					return true
				}
			}
			return false
		}
	}

	app.Use(cors.New(corsConfig))

	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "OK", "service": "SSO"})
	})

	auth := api.Group("/auth")

	authLimiter := limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"message": "Too many attempts, please try again later",
			})
		},
	})

	auth.Post("/register", authLimiter, authHandler.Register)
	auth.Post("/login", authLimiter, authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/logout", authHandler.Logout)
	auth.Post("/exchange", authHandler.ExchangeToken)
	auth.Get("/google", authHandler.GoogleLogin)
	auth.Get("/google/callback", authHandler.GoogleCallback)

	auth.Use(middleware.AuthMiddleware(cfg, redisClient, tokenRepo))
	auth.Get("/me", authHandler.GetMe)
	auth.Head("/check", authHandler.CheckSession)

	sessions := api.Group("/sessions")
	sessions.Use(middleware.AuthMiddleware(cfg, redisClient, tokenRepo))
	sessions.Get("/", sessionHandler.GetSessions)
	sessions.Delete("/:id", sessionHandler.RevokeSession)

	roles := api.Group("/roles")
	roles.Use(middleware.AuthMiddleware(cfg, redisClient, tokenRepo))
	roles.Use(middleware.AdminAccessMiddleware(roleRepo))
	roles.Get("/", roleHandler.GetAll)
	roles.Post("/", roleHandler.Create)
	roles.Put("/:id", roleHandler.Update)
	roles.Delete("/:id", roleHandler.Delete)

	users := api.Group("/users")
	users.Use(middleware.AuthMiddleware(cfg, redisClient, tokenRepo))
	users.Use(middleware.AdminAccessMiddleware(roleRepo))
	users.Get("/", userHandler.GetAll)
	users.Get("/:id", userHandler.GetByID)
	users.Put("/:id", userHandler.Update)
	users.Delete("/:id", userHandler.Delete)
	users.Patch("/:id/role", userHandler.ChangeRole)
	users.Get("/:id/apps", userHandler.GetUserApps)
	users.Post("/:id/apps", userHandler.AssignApp)
	users.Delete("/:id/apps/:appId", userHandler.RevokeApp)

	apps := api.Group("/apps")
	apps.Use(middleware.AuthMiddleware(cfg, redisClient, tokenRepo))
	apps.Use(middleware.AdminAccessMiddleware(roleRepo))
	apps.Get("/", appHandler.GetAll)
	apps.Get("/:id", appHandler.GetByID)
	apps.Post("/", appHandler.Create)
	apps.Put("/:id", appHandler.Update)
	apps.Delete("/:id", appHandler.Delete)

	userSelf := api.Group("/user")
	userSelf.Use(middleware.AuthMiddleware(cfg, redisClient, tokenRepo))
	userSelf.Get("/apps", userHandler.GetMyApps)
	userSelf.Get("/activity", userHandler.GetMyActivity)
	userSelf.Get("/login-stats", userHandler.GetLoginStats)
	userSelf.Put("/profile", userHandler.UpdateProfile)
	userSelf.Put("/password", userHandler.ChangePassword)

	log.Printf("🚀 Server running on :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Gagal start server: %v", err)
	}
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}
	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"message": err.Error(),
	})
}
