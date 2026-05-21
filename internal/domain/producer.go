package domain

// Producer — местный производитель.
type Producer struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Slug           string   `json:"slug"`
	Specialty      string   `json:"specialty"` // фермер, пекарь, ремесленник...
	Description    string   `json:"description"`
	City           string   `json:"city"`
	Region         string   `json:"region"`
	Lat            float64  `json:"lat"`
	Lng            float64  `json:"lng"`
	AvatarURL      string   `json:"avatarUrl"`
	CoverURL       string   `json:"coverUrl"`
	Rating         float64  `json:"rating"`
	ReviewCount    int      `json:"reviewCount"`
	EcoCertified   bool     `json:"ecoCertified"`
	Organic        bool     `json:"organic"`
	Story          string   `json:"story"`
	Philosophy     string   `json:"philosophy"`
	Certificates   []string `json:"certificates"`
	Awards         []string `json:"awards"`
	FoundedYear    int      `json:"foundedYear"`
	DeliveryBase   float64  `json:"deliveryBase"` // базовая стоимость доставки
}
