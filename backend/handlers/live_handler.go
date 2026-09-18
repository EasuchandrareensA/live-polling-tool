package handlers

import (
	"fmt"
	"net/http"

	"live-polling-tool/redis"

	"github.com/gin-gonic/gin"
)

func LivePoll(c *gin.Context) {
	pollID := c.Param("id")
	channel := "poll:" + pollID + ":updates"

	pubsub := redis.Client.Subscribe(c.Request.Context(), channel)
	defer pubsub.Close()

	_, err := pubsub.Receive(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to subscribe to live updates",
		})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	for {
		message, err := pubsub.ReceiveMessage(c.Request.Context())
		if err != nil {
			return
		}

		fmt.Fprintf(c.Writer, "data: %s\n\n", message.Payload)
		c.Writer.Flush()
	}
}
