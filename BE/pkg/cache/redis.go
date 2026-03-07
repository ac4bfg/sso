package cache

import (
	"context"
	"sso/config"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

type RedisClient struct {
	client *redis.Client
}

func NewRedisClient(cfg *config.Config) (*RedisClient, error) {
	addr := fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort)
	fmt.Printf("🔌 Connecting to Redis at %s (DB: %d, Password: %s)\n", addr, cfg.RedisDB, cfg.RedisPassword)

	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	})

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		return nil, err
	}

	return &RedisClient{client: rdb}, nil
}

func (r *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	return r.client.Set(ctx, key, value, expiration).Err()
}

func (r *RedisClient) Get(key string) (string, error) {
	return r.client.Get(ctx, key).Result()
}

func (r *RedisClient) Del(key string) error {
	return r.client.Del(ctx, key).Err()
}

func (r *RedisClient) Exists(key string) (bool, error) {
	result, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return result > 0, nil
}
