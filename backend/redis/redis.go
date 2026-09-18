package redis

import (
	"context"
	"os"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func Connect() error {
	Client = redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_ADDR"),
		Username: os.Getenv("REDIS_USERNAME"),
		Password: os.Getenv("REDIS_PASSWORD"),
	})

	_, err := Client.Ping(context.Background()).Result()

	return err
}