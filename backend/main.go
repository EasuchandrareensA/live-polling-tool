package main

import (
	"fmt"
	"net/http"
	"os"

	"live-polling-tool/auth"
	"live-polling-tool/database"
	"live-polling-tool/handlers"
	"live-polling-tool/middleware"
	"live-polling-tool/redis"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env locally.
	// On Render, environment variables are provided by Render.
	if err := godotenv.Load(); err != nil {
		fmt.Println("No .env file found. Using environment variables.")
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

	// MongoDB database and collections
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

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set(
			"Access-Control-Allow-Origin",
			"*",
		)

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

	// Authentication
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

	// Server-Sent Events for live polling
	router.GET(
		"/api/polls/:id/live",
		handlers.LivePoll,
	)

	// Render provides the PORT environment variable.
	// Locally, we use port 8081.
	port := os.Getenv("PORT")

	if port == "" {
		port = "8081"
	}

	fmt.Println("Server starting on port " + port)

	// IMPORTANT:
	// Render requires the server to listen on 0.0.0.0
	// instead of localhost.
	err = router.Run("0.0.0.0:" + port)

	if err != nil {
		panic(err)
	}
}