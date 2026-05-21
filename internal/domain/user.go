package domain

// Address — сохранённый адрес доставки.
type Address struct {
	ID         string `json:"id"`
	Label      string `json:"label"`
	Line       string `json:"line"`
	City       string `json:"city"`
	PostalCode string `json:"postalCode"`
	IsDefault  bool   `json:"isDefault"`
}

// NotificationSettings — настройки уведомлений.
type NotificationSettings struct {
	EmailOrders   bool `json:"emailOrders"`
	PushPromo     bool `json:"pushPromo"`
	SmsDelivery   bool `json:"smsDelivery"`
	NewFromSubs   bool `json:"newFromSubs"`
}

// BuyerProfile — личный кабинет покупателя (демо-пользователь).
type BuyerProfile struct {
	ID                     string                 `json:"id"`
	Email                  string                 `json:"email"`
	Name                   string                 `json:"name"`
	Phone                  string                 `json:"phone"`
	FavoriteProductIDs     []string               `json:"favoriteProductIds"`
	SubscribedProducerIDs  []string               `json:"subscribedProducerIds"`
	Addresses              []Address              `json:"addresses"`
	Notifications          NotificationSettings   `json:"notifications"`
}

// ProducerOrderView — заказ в панели производителя.
type ProducerOrderView struct {
	OrderID    string      `json:"orderId"`
	BuyerName  string      `json:"buyerName"`
	Status     OrderStatus `json:"status"`
	Lines      []OrderLine `json:"lines"`
	Total      float64     `json:"total"`
	CreatedAt  string      `json:"createdAt"`
}

// ChatMessage — сообщение чата (упрощённо).
type ChatMessage struct {
	ID         string `json:"id"`
	ProducerID string `json:"producerId"`
	FromBuyer  bool   `json:"fromBuyer"`
	Author     string `json:"author"`
	Text       string `json:"text"`
	CreatedAt  string `json:"createdAt"`
}
