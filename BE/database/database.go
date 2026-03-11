package database

import (
	cryptoRand "crypto/rand"
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
		&models.Role{},
		&models.User{},
		&models.RefreshToken{},
		&models.AuditLog{},
		&models.App{},
		&models.UserAppRole{},
		&models.Notification{},
		&models.AccessRequest{},
	)
	if err != nil {
		log.Fatalf("❌ Gagal migrasi database SSO: %v", err)
	}
	log.Println("✅ Database Migrated")
	SeedRoles()
}

func SeedRoles() {
	defaultRoles := []models.Role{
		{Name: "admin", Label: "Administrator", CanAccessAdmin: true},
		{Name: "manager", Label: "Manager", CanAccessAdmin: true},
		{Name: "staff", Label: "Staff", CanAccessAdmin: false},
		{Name: "marketing", Label: "Marketing", CanAccessAdmin: false},
		{Name: "finance", Label: "Finance", CanAccessAdmin: false},
		{Name: "procon", Label: "Procon", CanAccessAdmin: false},
		{Name: "super_admin", Label: "Super Admin", CanAccessAdmin: true},
	}

	for _, role := range defaultRoles {
		var existing models.Role
		result := DB.Where("name = ?", role.Name).First(&existing)
		if result.Error != nil {
			// generate uuid
			id := generateUUID()
			role.ID = id
			DB.Create(&role)
		}
	}
	log.Println("✅ Roles seeded")
}

func generateUUID() string {
	// use crypto/rand for UUID v4
	b := make([]byte, 16)
	_, _ = cryptoRand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
