package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"sso/config"
	"sso/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: newLogger,
	})

	if err != nil {
		log.Fatalf("❌ Gagal connect ke database: %v", err)
	}

	// Setting connection pool
	sqlDB, _ := db.DB()
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("✅ Database SSO connected")
	DB = db
}

func Migrate() {
	err := DB.AutoMigrate(
		&models.User{},
		&models.RefreshToken{},
		&models.AuditLog{},
		&models.App{},
		&models.UserAppRole{},
	)
	if err != nil {
		log.Fatalf("❌ Gagal migrasi database SSO: %v", err)
	}
	log.Println("✅ Database Migrated")
}
