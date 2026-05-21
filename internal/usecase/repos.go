package usecase

import (
	"context"

	"farmmarket/internal/domain"
)

// ProductRepository read/write products (seller updates).
type ProductRepository interface {
	AllProducts(ctx context.Context) ([]domain.Product, error)
	SaveProduct(ctx context.Context, p domain.Product) error
	ProductByID(ctx context.Context, id string) (*domain.Product, error)
	ProductBySlug(ctx context.Context, slug string) (*domain.Product, error)
}

// ProducerRepository reads producers.
type ProducerRepository interface {
	AllProducers(ctx context.Context) ([]domain.Producer, error)
	ProducerByID(ctx context.Context, id string) (*domain.Producer, error)
	ProducerBySlug(ctx context.Context, slug string) (*domain.Producer, error)
}

// ReviewRepository reviews.
type ReviewRepository interface {
	ReviewsByTarget(ctx context.Context, t domain.ReviewTarget, id string) ([]domain.Review, error)
	CommentsByReview(ctx context.Context, reviewID string) ([]domain.ReviewComment, error)
	AddReview(ctx context.Context, r domain.Review) error
}

// OrderRepository orders.
type OrderRepository interface {
	AddOrder(ctx context.Context, o domain.Order) error
	OrdersByUser(ctx context.Context, userID string) ([]domain.Order, error)
	OrderByID(ctx context.Context, id string) (*domain.Order, error)
	UpdateOrder(ctx context.Context, o domain.Order) error
	AllOrders(ctx context.Context) ([]domain.Order, error)
}

// ProfileRepository buyer profile persistence.
type ProfileRepository interface {
	GetBuyer(ctx context.Context) (*domain.BuyerProfile, error)
	SaveBuyer(ctx context.Context, p domain.BuyerProfile) error
}

// ChatRepository messages.
type ChatRepository interface {
	MessagesByProducer(ctx context.Context, producerID string) ([]domain.ChatMessage, error)
}
