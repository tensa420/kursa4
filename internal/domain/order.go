package domain

import "time"

// OrderStatus — статус заказа.
type OrderStatus string

const (
	OrderNew        OrderStatus = "new"
	OrderProcessing OrderStatus = "processing"
	OrderShipped    OrderStatus = "shipped"
	OrderDelivered  OrderStatus = "delivered"
	OrderCancelled  OrderStatus = "cancelled"
)

// DeliveryMethod — способ доставки.
type DeliveryMethod string

const (
	DeliveryCourier DeliveryMethod = "courier"
	DeliveryPickup  DeliveryMethod = "pickup"
	DeliveryPVZ     DeliveryMethod = "pvz"
)

// PaymentMethod — способ оплаты.
type PaymentMethod string

const (
	PaymentCard   PaymentMethod = "card"
	PaymentCash   PaymentMethod = "cash"
	PaymentOnline PaymentMethod = "online"
)

// OrderLine — позиция в заказе.
type OrderLine struct {
	ProductID   string  `json:"productId"`
	ProducerID  string  `json:"producerId"`
	Name        string  `json:"name"`
	Image       string  `json:"image"`
	UnitPrice   float64 `json:"unitPrice"`
	Qty         int     `json:"qty"`
	DeliveryFee float64 `json:"deliveryFee"`
}

// Order — оформленный заказ.
type Order struct {
	ID              string         `json:"id"`
	UserID          string         `json:"userId"`
	Status          OrderStatus    `json:"status"`
	Lines           []OrderLine    `json:"lines"`
	Subtotal        float64        `json:"subtotal"`
	Discount        float64        `json:"discount"`
	PromoCode       string         `json:"promoCode,omitempty"`
	ContactName     string         `json:"contactName"`
	ContactPhone    string         `json:"contactPhone"`
	ContactEmail    string         `json:"contactEmail"`
	AddressLine     string         `json:"addressLine"`
	City            string         `json:"city"`
	PostalCode      string         `json:"postalCode"`
	DeliveryMethod  DeliveryMethod `json:"deliveryMethod"`
	PaymentMethod   PaymentMethod  `json:"paymentMethod"`
	Total           float64        `json:"total"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}
