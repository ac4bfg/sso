# Build stage
FROM golang:1.24.0-alpine AS builder

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o sso_api ./cmd/main.go

# Final stage
FROM alpine:latest

WORKDIR /app

# Add timezone data
RUN apk add --no-cache tzdata

# Copy binary from builder
COPY --from=builder /app/sso_api .

EXPOSE 8081

# Run the binary
CMD ["./sso_api"]
