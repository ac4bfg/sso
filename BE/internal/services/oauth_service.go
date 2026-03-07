package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"sso/config"
	"sso/internal/models"
	"sso/internal/repositories"
	"sso/pkg/hash"

	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type OAuthService struct {
	cfg         *config.Config
	oauthConfig *oauth2.Config
	authService *AuthService
	userRepo    *repositories.UserRepository
}

func NewOAuthService(cfg *config.Config, authService *AuthService, userRepo *repositories.UserRepository) *OAuthService {
	oauthConfig := &oauth2.Config{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleRedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	return &OAuthService{
		cfg:         cfg,
		oauthConfig: oauthConfig,
		authService: authService,
		userRepo:    userRepo,
	}
}

// GetGoogleLoginURL returns the URL to redirect the user to for Google login
func (s *OAuthService) GetGoogleLoginURL() string {
	// In production, use a random state string to prevent CSRF
	return s.oauthConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
}

// GoogleUserInfo represents the user data returned by Google
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

// GoogleLogin handles the code exchange and user login/creation
func (s *OAuthService) GoogleLogin(code, userAgent, ipAddress string) (*AuthResponse, error) {
	// Exchange code for token
	token, err := s.oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange token: %v", err)
	}

	// Get user info from Google
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %v", err)
	}
	defer resp.Body.Close()

	content, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var googleUser GoogleUserInfo
	if err := json.Unmarshal(content, &googleUser); err != nil {
		return nil, fmt.Errorf("failed to parse user info: %v", err)
	}

	// Check if user exists
	user, err := s.userRepo.FindByEmail(googleUser.Email)
	if err != nil {
		// User not found, create new user
		randomPassword, _ := uuid.NewRandom()
		hashedPassword, _ := hash.HashPassword(randomPassword.String())

		newUser := &models.User{
			Name:          googleUser.Name,
			Email:         googleUser.Email,
			Password:      hashedPassword,
			Role:          "staff", // Default role
			IsActive:      true,
			IsPasswordSet: false, // Explicitly false for Google users
		}

		if err := s.userRepo.Create(newUser); err != nil {
			return nil, fmt.Errorf("failed to create user: %v", err)
		}
		user = newUser
	}

	if !user.IsActive {
		return nil, errors.New("account is inactive")
	}

	// Update last login
	_ = s.userRepo.UpdateLastLogin(user.ID)

	// Generate tokens using existing auth service
	return s.authService.generateTokens(user, userAgent, ipAddress)
}
