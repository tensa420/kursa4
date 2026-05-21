package domain

import "time"

// ProductCategory — категория товара.
type ProductCategory string

const (
	CatVegetables ProductCategory = "vegetables"
	CatFruits     ProductCategory = "fruits"
	CatMeat       ProductCategory = "meat"
	CatDairy      ProductCategory = "dairy"
	CatBakery     ProductCategory = "bakery"
	CatHoney      ProductCategory = "honey"
	CatJam        ProductCategory = "jam"
	CatCheese     ProductCategory = "cheese"
	CatCraft      ProductCategory = "craft"
)

// Product — товар на витрине.
type Product struct {
	ID            string          `json:"id"`
	ProducerID    string          `json:"producerId"`
	Name          string          `json:"name"`
	Slug          string          `json:"slug"`
	Description   string          `json:"description"`
	Category      ProductCategory `json:"category"`
	Price         float64         `json:"price"`
	Currency      string          `json:"currency"`
	Images        []string        `json:"images"`
	Stock         int             `json:"stock"`
	ExpiryDays    *int            `json:"expiryDays,omitempty"`
	Rating        float64         `json:"rating"`
	ReviewCount   int             `json:"reviewCount"`
	Eco           bool            `json:"eco"`
	Organic       bool            `json:"organic"`
	Featured      bool            `json:"featured"`
	IsNew         bool            `json:"isNew"`
	Popularity    int             `json:"popularity"`
	OriginStory   string          `json:"originStory"`
	CreatedAt     time.Time       `json:"createdAt"`
}
