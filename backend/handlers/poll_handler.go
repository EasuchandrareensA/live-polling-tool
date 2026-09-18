package handlers

import (
	"net/http"

	"live-polling-tool/models"
	"live-polling-tool/redis"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type PollHandler struct {
	Collection *mongo.Collection
}

/* =========================
   CREATE POLL
========================= */

func (h *PollHandler) CreatePoll(c *gin.Context) {
	var poll models.Poll

	if err := c.ShouldBindJSON(&poll); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid poll data",
		})
		return
	}

	username, exists := c.Get("username")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User information not found",
		})
		return
	}

	poll.Owner = username.(string)

	if poll.Question == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Poll question is required",
		})
		return
	}

	if len(poll.Options) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "At least 2 options are required",
		})
		return
	}

	result, err := h.Collection.InsertOne(
		c.Request.Context(),
		poll,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create poll",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Poll created successfully",
		"id":      result.InsertedID,
	})
}

/* =========================
   GET POLL
========================= */

func (h *PollHandler) GetPoll(c *gin.Context) {
	id := c.Param("id")

	objectID, err := bson.ObjectIDFromHex(id)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid poll ID",
		})
		return
	}

	var poll models.Poll

	err = h.Collection.FindOne(
		c.Request.Context(),
		bson.M{
			"_id": objectID,
		},
	).Decode(&poll)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Poll not found",
		})
		return
	}

	c.JSON(http.StatusOK, poll)
}

/* =========================
   GET MY POLLS
========================= */

func (h *PollHandler) GetMyPolls(c *gin.Context) {
	username, exists := c.Get("username")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User information not found",
		})
		return
	}

	cursor, err := h.Collection.Find(
		c.Request.Context(),
		bson.M{
			"owner": username.(string),
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch your polls",
		})
		return
	}

	defer cursor.Close(c.Request.Context())

	var polls []models.Poll

	if err := cursor.All(
		c.Request.Context(),
		&polls,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to read polls",
		})
		return
	}

	if polls == nil {
		polls = []models.Poll{}
	}

	c.JSON(http.StatusOK, polls)
}

/* =========================
   VOTE POLL
========================= */

func (h *PollHandler) VotePoll(c *gin.Context) {
	pollID := c.Param("id")
	optionID := c.Param("optionId")

	objectID, err := bson.ObjectIDFromHex(pollID)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid poll ID",
		})
		return
	}

	filter := bson.M{
		"_id":        objectID,
		"options.id": optionID,
	}

	update := bson.M{
		"$inc": bson.M{
			"options.$.votes": 1,
		},
	}

	result, err := h.Collection.UpdateOne(
		c.Request.Context(),
		filter,
		update,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to record vote",
		})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Poll or option not found",
		})
		return
	}

	/* =========================
	   REDIS VOTE COUNTER
	========================= */

	voteKey := "poll:" + pollID + ":option:" + optionID + ":votes"

	_, err = redis.Client.Incr(
		c.Request.Context(),
		voteKey,
	).Result()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update Redis vote count",
		})
		return
	}

	/* =========================
	   REDIS PUB/SUB
	========================= */

	channel := "poll:" + pollID + ":updates"

	err = redis.Client.Publish(
		c.Request.Context(),
		channel,
		optionID,
	).Err()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to publish vote update",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vote recorded successfully",
	})
}

/* =========================
   DELETE POLL
========================= */

func (h *PollHandler) DeletePoll(c *gin.Context) {
	pollID := c.Param("id")

	objectID, err := bson.ObjectIDFromHex(pollID)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid poll ID",
		})
		return
	}

	username, exists := c.Get("username")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User information not found",
		})
		return
	}

	result, err := h.Collection.DeleteOne(
		c.Request.Context(),
		bson.M{
			"_id":   objectID,
			"owner": username.(string),
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete poll",
		})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Poll not found or you are not the owner",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Poll deleted successfully",
	})
}