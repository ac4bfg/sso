package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// JWT
	JWTSecret        string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration

	// Cookie
	CookieDomain string
	CookieSecure bool

	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string
	RedisDB       int

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// CORS
	CORSOrigins string

	// Frontend URL (used for OAuth redirects)
	FrontendURL string

	// Seed
	SeedAdminEmail    string
	SeedAdminPassword string
	SeedAdminName     string

	// App Base URLs (untuk seed waffle menu)
	AppURLCostControl string
	AppURLInvoice     string
	AppURLProcurement string
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		Port: getEnv("PORT", "8081"),

		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "cost_control"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		JWTSecret:        getEnv("JWT_SECRET", "default-secret-change-me"),
		JWTAccessExpiry:  parseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m")),
		JWTRefreshExpiry: parseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h")),

		CookieDomain: getEnv("COOKIE_DOMAIN", "localhost"),
		CookieSecure: getEnv("COOKIE_SECURE", "false") == "true",

		// Redis
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8081/api/auth/google/callback"),

		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:3000"),

		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3001"),

		SeedAdminEmail:    getEnv("SEED_ADMIN_EMAIL", "admin@ksm.co.id"),
		SeedAdminPassword: getEnv("SEED_ADMIN_PASSWORD", "admin123"),
		SeedAdminName:     getEnv("SEED_ADMIN_NAME", "Administrator"),

		AppURLCostControl: getEnv("APP_URL_COST_CONTROL", "http://localhost:3000"),
		AppURLInvoice:     getEnv("APP_URL_INVOICE", "http://localhost:3003"),
		AppURLProcurement: getEnv("APP_URL_PROCUREMENT", "http://localhost:3002"),
	}
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" port=" + c.DBPort +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" sslmode=" + c.DBSSLMode +
		" TimeZone=Asia/Jakarta"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 15 * time.Minute
	}
	return d
}

func getEnvAsInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}
