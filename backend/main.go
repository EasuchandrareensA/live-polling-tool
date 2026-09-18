package main

import (
	"fmt"
	"net/http"

	"live-polling-tool/auth"
	"live-polling-tool/database"
	"live-polling-tool/handlers"
	"live-polling-tool/middleware"
	"live-polling-tool/redis"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env
	if err := godotenv.Load(); err != nil {
		panic("Error loading .env file")
	}

	// Connect to Redis
	err := redis.Connect()
	if err != nil {
		panic(err)
	}

	fmt.Println("Redis connected successfully!")

	// Connect to MongoDB
	client, err := database.Connect()
	if err != nil {
		panic(err)
	}

	fmt.Println("MongoDB connected successfully!")

	// Select database and collections
	database := client.Database("live_polling")

	pollCollection := database.Collection("polls")
	userCollection := database.Collection("users")

	// Set user collection for authentication
	auth.UserCollection = userCollection

	// Create poll handler
	pollHandler := &handlers.PollHandler{
		Collection: pollCollection,
	}

	// Create Gin router
	router := gin.Default()

	// CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS",
		)
		c.Writer.Header().Set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization",
		)

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Home route
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Live Polling API is running",
		})
	})

	// Health check
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Backend is healthy",
		})
	})

	// Authentication routes
	router.POST("/api/register", auth.Register)
	router.POST("/api/login", auth.Login)

	// Protected poll routes
	router.POST(
		"/api/polls",
		middleware.AuthRequired,
		pollHandler.CreatePoll,
	)

	router.GET(
		"/api/my-polls",
		middleware.AuthRequired,
		pollHandler.GetMyPolls,
	)

	router.DELETE(
		"/api/polls/:id",
		middleware.AuthRequired,
		pollHandler.DeletePoll,
	)

	// Public poll routes
	router.GET(
		"/api/polls/:id",
		pollHandler.GetPoll,
	)

	router.POST(
		"/api/polls/:id/vote/:optionId",
		pollHandler.VotePoll,
	)

	// Live polling using Redis Pub/Sub + SSE
	router.GET(
		"/api/polls/:id/live",
		handlers.LivePoll,
	)

	// Start server
	fmt.Println("Server starting on http://localhost:8081")

	err = router.Run(":8081")
	if err != nil {
		panic(err)
	}
}