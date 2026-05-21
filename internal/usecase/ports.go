package usecase

import (
	"context"

	"farmmarket/internal/domain"
)

// Catalog lists and searches products.
type Catalog interface {
	ListProducts(ctx context.Context, q ProductQuery) ([]domain.Product, int, error)
	GetProduct(ctx context.Context, id string) (*domain.Product, error)
	SimilarProducts(ctx context.Context, productID string, limit int) ([]domain.Product, error)
}

// Producers lists producer profiles.
type Producers interface {
	ListProducers(ctx context.Context) ([]domain.Producer, error)
	GetProducer(ctx context.Context, idOrSlug string) (*domain.Producer, error)
	ProductsByProducer(ctx context.Context, producerID string) ([]domain.Product, error)
}

// Reviews manages ratings.
type Reviews interface {
	ListReviews(ctx context.Context, target domain.ReviewTarget, targetID string) ([]domain.Review, error)
	ListComments(ctx context.Context, reviewID string) ([]domain.ReviewComment, error)
	AddReview(ctx context.Context, r domain.Review) (*domain.Review, error)
}

// Orders checkout and history.
type Orders interface {
	CreateOrder(ctx context.Context, in CreateOrderInput) (*domain.Order, error)
	ListOrdersByUser(ctx context.Context, userID string) ([]domain.Order, error)
	UpdateOrderStatus(ctx context.Context, orderID string, status domain.OrderStatus) error
}

// Promo validates discount codes.
type Promo interface {
	ValidatePromo(ctx context.Context, code string) (discountPercent float64, err error)
}

// Profile buyer cabinet.
type Profile interface {
	GetProfile(ctx context.Context) (*domain.BuyerProfile, error)
	UpdateProfile(ctx context.Context, p domain.BuyerProfile) error
}

// SellerPanel producer dashboard.
type SellerPanel interface {
	ListProducerOrders(ctx context.Context, producerID string) ([]domain.ProducerOrderView, error)
	UpsertProduct(ctx context.Context, p domain.Product) error
	ListChat(ctx context.Context, producerID string) ([]domain.ChatMessage, error)
	SalesStats(ctx context.Context, producerID string) (SalesStats, error)
}

// ProductQuery filters for catalog.
type ProductQuery struct {
	Search     string
	Category   domain.ProductCategory
	MinPrice   *float64
	MaxPrice   *float64
	City       string
	MinRating  *float64
	Eco        *bool
	Organic    *bool
	Sort       string // popularity, price_asc, price_desc, newest
	Page       int
	PageSize   int
	// MaxDistanceKm and user lat/lng optional — filter in usecase
	UserLat       *float64
	UserLng       *float64
	MaxDistanceKm *float64
}

// CreateOrderInput payload for checkout.
type CreateOrderInput struct {
	UserID         string             `json:"userId"`
	Lines          []domain.OrderLine `json:"lines"`
	PromoCode      string             `json:"promoCode"`
	ContactName    string             `json:"contactName"`
	ContactPhone   string             `json:"contactPhone"`
	ContactEmail   string             `json:"contactEmail"`
	AddressLine    string             `json:"addressLine"`
	City           string             `json:"city"`
	PostalCode     string             `json:"postalCode"`
	DeliveryMethod domain.DeliveryMethod `json:"deliveryMethod"`
	PaymentMethod  domain.PaymentMethod  `json:"paymentMethod"`
}

// SalesStats for producer dashboard.
type SalesStats struct {
	TotalRevenue   float64            `json:"totalRevenue"`
	OrdersCount    int                `json:"ordersCount"`
	TopProducts    []TopProductStat   `json:"topProducts"`
	MonthlyRevenue []MonthlyPoint     `json:"monthlyRevenue"`
}

type TopProductStat struct {
	ProductID string  `json:"productId"`
	Name      string  `json:"name"`
	Units     int     `json:"units"`
	Revenue   float64 `json:"revenue"`
}

type MonthlyPoint struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
}
