package memory

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"farmmarket/internal/domain"
)

// Store in-memory persistence with optional JSON file sync.
type Store struct {
	mu        sync.RWMutex
	products  []domain.Product
	producers []domain.Producer
	reviews   []domain.Review
	comments  []domain.ReviewComment
	orders    []domain.Order
	buyer     domain.BuyerProfile
	chat      []domain.ChatMessage
	dataFile  string
}

func NewStore(dataFile string) *Store {
	s := &Store{dataFile: dataFile}
	if dataFile != "" {
		if b, err := os.ReadFile(dataFile); err == nil && len(b) > 0 {
			var snap snapshot
			if json.Unmarshal(b, &snap) == nil {
				s.products = snap.Products
				s.producers = snap.Producers
				s.reviews = snap.Reviews
				s.comments = snap.Comments
				s.orders = snap.Orders
				s.buyer = snap.Buyer
				s.chat = snap.Chat
				if len(s.products) > 0 {
					applyImageCatalog(s)
					if snap.CatalogVersion < catalogVersion {
						_ = s.persist()
					}
					return s
				}
			}
		}
	}
	buildSeed(s)
	applyImageCatalog(s)
	_ = s.persist()
	return s
}

type snapshot struct {
	CatalogVersion int                     `json:"catalogVersion"`
	Products       []domain.Product        `json:"products"`
	Producers []domain.Producer       `json:"producers"`
	Reviews   []domain.Review         `json:"reviews"`
	Comments  []domain.ReviewComment  `json:"comments"`
	Orders    []domain.Order          `json:"orders"`
	Buyer     domain.BuyerProfile     `json:"buyer"`
	Chat      []domain.ChatMessage    `json:"chat"`
}

func (s *Store) persist() error {
	if s.dataFile == "" {
		return nil
	}
	_ = os.MkdirAll(filepath.Dir(s.dataFile), 0o755)
	s.mu.RLock()
	snap := snapshot{
		CatalogVersion: catalogVersion,
		Products:       append([]domain.Product(nil), s.products...),
		Producers: append([]domain.Producer(nil), s.producers...),
		Reviews:   append([]domain.Review(nil), s.reviews...),
		Comments:  append([]domain.ReviewComment(nil), s.comments...),
		Orders:    append([]domain.Order(nil), s.orders...),
		Buyer:     s.buyer,
		Chat:      append([]domain.ChatMessage(nil), s.chat...),
	}
	s.mu.RUnlock()
	b, err := json.MarshalIndent(snap, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.dataFile, b, 0o644)
}

func (s *Store) AllProducts(ctx context.Context) ([]domain.Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.Product, len(s.products))
	copy(out, s.products)
	return out, nil
}

func (s *Store) SaveProduct(ctx context.Context, p domain.Product) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now()
	}
	for i, x := range s.products {
		if x.ID == p.ID {
			s.products[i] = p
			return s.persist()
		}
	}
	if p.ID == "" {
		p.ID = "p-" + time.Now().Format("150405000000")
	}
	s.products = append(s.products, p)
	return s.persist()
}

func (s *Store) ProductByID(ctx context.Context, id string) (*domain.Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := range s.products {
		if s.products[i].ID == id {
			c := s.products[i]
			return &c, nil
		}
	}
	return nil, nil
}

func (s *Store) ProductBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := range s.products {
		if s.products[i].Slug == slug {
			c := s.products[i]
			return &c, nil
		}
	}
	return nil, nil
}

func (s *Store) AllProducers(ctx context.Context) ([]domain.Producer, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.Producer, len(s.producers))
	copy(out, s.producers)
	return out, nil
}

func (s *Store) ProducerByID(ctx context.Context, id string) (*domain.Producer, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := range s.producers {
		if s.producers[i].ID == id {
			c := s.producers[i]
			return &c, nil
		}
	}
	return nil, nil
}

func (s *Store) ProducerBySlug(ctx context.Context, slug string) (*domain.Producer, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := range s.producers {
		if s.producers[i].Slug == slug {
			c := s.producers[i]
			return &c, nil
		}
	}
	return nil, nil
}

func (s *Store) ReviewsByTarget(ctx context.Context, t domain.ReviewTarget, id string) ([]domain.Review, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []domain.Review
	for _, r := range s.reviews {
		if r.Target == t && r.TargetID == id {
			out = append(out, r)
		}
	}
	return out, nil
}

func (s *Store) CommentsByReview(ctx context.Context, reviewID string) ([]domain.ReviewComment, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []domain.ReviewComment
	for _, c := range s.comments {
		if c.ReviewID == reviewID {
			out = append(out, c)
		}
	}
	return out, nil
}

func (s *Store) AddReview(ctx context.Context, r domain.Review) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.reviews = append(s.reviews, r)
	return s.persist()
}

func (s *Store) AddOrder(ctx context.Context, o domain.Order) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, ln := range o.Lines {
		for i := range s.products {
			if s.products[i].ID == ln.ProductID {
				s.products[i].Stock -= ln.Qty
				if s.products[i].Stock < 0 {
					s.products[i].Stock = 0
				}
			}
		}
	}
	s.orders = append(s.orders, o)
	return s.persist()
}

func (s *Store) OrdersByUser(ctx context.Context, userID string) ([]domain.Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []domain.Order
	for _, o := range s.orders {
		if o.UserID == userID {
			out = append(out, o)
		}
	}
	return out, nil
}

func (s *Store) OrderByID(ctx context.Context, id string) (*domain.Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for i := range s.orders {
		if s.orders[i].ID == id {
			c := s.orders[i]
			return &c, nil
		}
	}
	return nil, nil
}

func (s *Store) UpdateOrder(ctx context.Context, o domain.Order) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.orders {
		if s.orders[i].ID == o.ID {
			s.orders[i] = o
			return s.persist()
		}
	}
	return domain.ErrNotFound
}

func (s *Store) AllOrders(ctx context.Context) ([]domain.Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]domain.Order, len(s.orders))
	copy(out, s.orders)
	return out, nil
}

func (s *Store) GetBuyer(ctx context.Context) (*domain.BuyerProfile, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	b := s.buyer
	return &b, nil
}

func (s *Store) SaveBuyer(ctx context.Context, p domain.BuyerProfile) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.buyer = p
	return s.persist()
}

func (s *Store) MessagesByProducer(ctx context.Context, producerID string) ([]domain.ChatMessage, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []domain.ChatMessage
	for _, m := range s.chat {
		if m.ProducerID == producerID {
			out = append(out, m)
		}
	}
	return out, nil
}
