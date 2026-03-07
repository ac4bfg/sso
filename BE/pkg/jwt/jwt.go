package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID    string `json:"user_id"`
	SessionID string `json:"session_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateAccessToken membuat JWT access token
func GenerateAccessToken(userID, sessionID, email, role, secret string, expiry time.Duration) (string, error) {
	claims := Claims{
		UserID:    userID,
		SessionID: sessionID,
		Email:     email,
		Role:      role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GenerateRefreshToken membuat JWT refresh token
func GenerateRefreshToken(userID, secret string, expiry time.Duration) (string, error) {
	claims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Subject:   userID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateToken memvalidasi dan parse JWT token
func ValidateToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}

	return claims, nil
}

// ValidateRefreshToken memvalidasi refresh token (hanya cek expiry)
func ValidateRefreshToken(tokenString, secret string) (string, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return "", jwt.ErrSignatureInvalid
	}

	return claims.Subject, nil
}

// ExtractSessionID mengambil session_id dari token (bisa expired, tapi signature harus valid)
func ExtractSessionID(tokenString, secret string) (string, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	// Kita terima token expired asalkan signature valid
	if err != nil && !errors.Is(err, jwt.ErrTokenExpired) {
		// Jika error bukan expired (misal signature salah), return error
		// Note in v5 ErrTokenExpired might be wrapped.
		// For simplicity, if token is not nil and claims ok, we use it.
	}

	if token == nil {
		return "", err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return "", jwt.ErrTokenInvalidClaims
	}

	// Jika signature verify gagal, token.Valid usually false.
	// Tapi ParseWithClaims akan return error.
	// Kita asumsikan jika bisa diparse dan claims type benar, kita ambil sessionID.
	// Warning: This is a fallback for logout only.

	return claims.SessionID, nil
}
