package domain

import "time"

// ReviewTarget — к чему привязан отзыв.
type ReviewTarget string

const (
	ReviewProduct  ReviewTarget = "product"
	ReviewProducer ReviewTarget = "producer"
)

// Review — отзыв покупателя.
type Review struct {
	ID         string       `json:"id"`
	Target     ReviewTarget `json:"target"`
	TargetID   string       `json:"targetId"`
	AuthorID   string       `json:"authorId"`
	AuthorName string       `json:"authorName"`
	Rating     int          `json:"rating"`
	Text       string       `json:"text"`
	PhotoURL   string       `json:"photoUrl,omitempty"`
	Likes      int          `json:"likes"`
	CreatedAt  time.Time    `json:"createdAt"`
}

// ReviewComment — комментарий к отзыву.
type ReviewComment struct {
	ID         string    `json:"id"`
	ReviewID   string    `json:"reviewId"`
	AuthorName string    `json:"authorName"`
	Text       string    `json:"text"`
	CreatedAt  time.Time `json:"createdAt"`
}
