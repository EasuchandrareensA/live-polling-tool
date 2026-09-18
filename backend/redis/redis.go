package redis

import (
	"context"
	"os"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func Connect() error {
	Client = redis.NewClient(&redis.Options{
		Addr:     os.Getenv("hyperfast-lace-crowded-33721.db.redis.io:11381"),
		Username: os.Getenv("Easu chandra reens"),
		Password: os.Getenv("706ksHjuieGWoZ85B2pLdIbxdG0q9cEp"),
	})

	_, err := Client.Ping(context.Background()).Result()

	return err
}