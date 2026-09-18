package models

import "go.mongodb.org/mongo-driver/v2/bson"

type Poll struct {
	ID       bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Owner    string        `bson:"owner" json:"owner"`
	Question string        `bson:"question" json:"question"`
	Options  []Option      `bson:"options" json:"options"`
}

type Option struct {
	ID    string `bson:"id" json:"id"`
	Text  string `bson:"text" json:"text"`
	Votes int    `bson:"votes" json:"votes"`
}