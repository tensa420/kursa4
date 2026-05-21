package usecase

import (
	"context"
	"math"
	"sort"
	"strings"
	"time"

	"farmmarket/internal/domain"
)

// CatalogService implements Catalog.
type CatalogService struct {
	products  ProductRepository
	producers ProducerRepository
}

func NewCatalogService(p ProductRepository, pr ProducerRepository) *CatalogService {
	return &CatalogService{products: p, producers: pr}
}

func (s *CatalogService) ListProducts(ctx context.Context, q ProductQuery) ([]domain.Product, int, error) {
	all, err := s.products.AllProducts(ctx)
	if err != nil {
		return nil, 0, err
	}
	prodByID := map[string]domain.Producer{}
	pp, _ := s.producers.AllProducers(ctx)
	for _, x := range pp {
		prodByID[x.ID] = x
	}
	var out []domain.Product
	for _, p := range all {
		pr := prodByID[p.ProducerID]
		if q.Search != "" {
			qs := strings.ToLower(q.Search)
			if !strings.Contains(strings.ToLower(p.Name), qs) &&
				!strings.Contains(strings.ToLower(p.Description), qs) &&
				!strings.Contains(strings.ToLower(pr.Name), qs) {
				continue
			}
		}
		if q.Category != "" && p.Category != q.Category {
			continue
		}
		if q.MinPrice != nil && p.Price < *q.MinPrice {
			continue
		}
		if q.MaxPrice != nil && p.Price > *q.MaxPrice {
			continue
		}
		if q.City != "" && !strings.EqualFold(pr.City, q.City) {
			continue
		}
		if q.MinRating != nil && p.Rating < *q.MinRating {
			continue
		}
		if q.Eco != nil && *q.Eco && !p.Eco {
			continue
		}
		if q.Organic != nil && *q.Organic && !p.Organic {
			continue
		}
		if q.MaxDistanceKm != nil && q.UserLat != nil && q.UserLng != nil {
			d := haversine(*q.UserLat, *q.UserLng, pr.Lat, pr.Lng)
			if d > *q.MaxDistanceKm {
				continue
			}
		}
		out = append(out, p)
	}
	sort.Slice(out, func(i, j int) bool {
		switch q.Sort {
		case "price_asc":
			return out[i].Price < out[j].Price
		case "price_desc":
			return out[i].Price > out[j].Price
		case "newest":
			return out[i].CreatedAt.After(out[j].CreatedAt)
		default: // popularity
			if out[i].Popularity == out[j].Popularity {
				return out[i].Rating > out[j].Rating
			}
			return out[i].Popularity > out[j].Popularity
		}
	})
	total := len(out)
	page, size := q.Page, q.PageSize
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 12
	}
	if size > 48 {
		size = 48
	}
	start := (page - 1) * size
	if start > len(out) {
		return []domain.Product{}, total, nil
	}
	end := start + size
	if end > len(out) {
		end = len(out)
	}
	items := out[start:end]
	if items == nil {
		items = []domain.Product{}
	}
	return items, total, nil
}

func (s *CatalogService) GetProduct(ctx context.Context, id string) (*domain.Product, error) {
	p, err := s.products.ProductByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if p != nil {
		return p, nil
	}
	return s.products.ProductBySlug(ctx, id)
}

func (s *CatalogService) SimilarProducts(ctx context.Context, productID string, limit int) ([]domain.Product, error) {
	p, err := s.GetProduct(ctx, productID)
	if err != nil || p == nil {
		return nil, domain.ErrNotFound
	}
	all, _ := s.products.AllProducts(ctx)
	var sameCat []domain.Product
	for _, x := range all {
		if x.ID == p.ID {
			continue
		}
		if x.Category == p.Category {
			sameCat = append(sameCat, x)
		}
	}
	sort.Slice(sameCat, func(i, j int) bool { return sameCat[i].Popularity > sameCat[j].Popularity })
	if limit <= 0 || limit > len(sameCat) {
		limit = len(sameCat)
	}
	if limit > 8 {
		limit = 8
	}
	items := sameCat[:limit]
	if items == nil {
		items = []domain.Product{}
	}
	return items, nil
}

func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0
	toRad := math.Pi / 180
	dLat := (lat2 - lat1) * toRad
	dLon := (lon2 - lon1) * toRad
	a := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(lat1*toRad)*math.Cos(lat2*toRad)*math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

// ProducerService implements Producers.
type ProducerService struct {
	products  ProductRepository
	producers ProducerRepository
}

func NewProducerService(p ProductRepository, pr ProducerRepository) *ProducerService {
	return &ProducerService{products: p, producers: pr}
}

func (s *ProducerService) ListProducers(ctx context.Context) ([]domain.Producer, error) {
	return s.producers.AllProducers(ctx)
}

func (s *ProducerService) GetProducer(ctx context.Context, idOrSlug string) (*domain.Producer, error) {
	p, err := s.producers.ProducerByID(ctx, idOrSlug)
	if err == nil && p != nil {
		return p, nil
	}
	return s.producers.ProducerBySlug(ctx, idOrSlug)
}

func (s *ProducerService) ProductsByProducer(ctx context.Context, producerID string) ([]domain.Product, error) {
	all, err := s.products.AllProducts(ctx)
	if err != nil {
		return nil, err
	}
	var out []domain.Product
	for _, x := range all {
		if x.ProducerID == producerID {
			out = append(out, x)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.After(out[j].CreatedAt) })
	return out, nil
}

// ReviewService implements Reviews.
type ReviewService struct {
	reviews ReviewRepository
}

func NewReviewService(r ReviewRepository) *ReviewService {
	return &ReviewService{reviews: r}
}

func (s *ReviewService) ListReviews(ctx context.Context, target domain.ReviewTarget, targetID string) ([]domain.Review, error) {
	return s.reviews.ReviewsByTarget(ctx, target, targetID)
}

func (s *ReviewService) ListComments(ctx context.Context, reviewID string) ([]domain.ReviewComment, error) {
	return s.reviews.CommentsByReview(ctx, reviewID)
}

func (s *ReviewService) AddReview(ctx context.Context, r domain.Review) (*domain.Review, error) {
	if r.Rating < 1 || r.Rating > 5 {
		return nil, domain.ErrValidation
	}
	r.ID = "rev-" + time.Now().Format("150405.000000000")
	r.CreatedAt = time.Now()
	if err := s.reviews.AddReview(ctx, r); err != nil {
		return nil, err
	}
	return &r, nil
}

// OrderService implements Orders.
type OrderService struct {
	products ProductRepository
	producers ProducerRepository
	orders   OrderRepository
	promo    Promo
}

func NewOrderService(pr ProductRepository, prod ProducerRepository, o OrderRepository, promo Promo) *OrderService {
	return &OrderService{products: pr, producers: prod, orders: o, promo: promo}
}

func (s *OrderService) CreateOrder(ctx context.Context, in CreateOrderInput) (*domain.Order, error) {
	if in.ContactName == "" || in.ContactPhone == "" || in.ContactEmail == "" {
		return nil, domain.ErrValidation
	}
	if len(in.Lines) == 0 {
		return nil, domain.ErrValidation
	}
	var subtotal float64
	var lines []domain.OrderLine
	for _, ln := range in.Lines {
		p, err := s.products.ProductByID(ctx, ln.ProductID)
		if err != nil || p == nil {
			return nil, domain.ErrNotFound
		}
		if ln.Qty < 1 || ln.Qty > p.Stock {
			return nil, domain.ErrOutOfStock
		}
		pr, _ := s.producers.ProducerByID(ctx, p.ProducerID)
		delivery := 0.0
		if pr != nil {
			delivery = pr.DeliveryBase
		}
		img := ""
		if len(p.Images) > 0 {
			img = p.Images[0]
		}
		lines = append(lines, domain.OrderLine{
			ProductID:   p.ID,
			ProducerID:  p.ProducerID,
			Name:        p.Name,
			Image:       img,
			UnitPrice:   p.Price,
			Qty:         ln.Qty,
			DeliveryFee: delivery,
		})
		subtotal += p.Price * float64(ln.Qty)
	}
	// delivery per unique producer
	seen := map[string]bool{}
	deliveryTotal := 0.0
	for _, ln := range lines {
		if !seen[ln.ProducerID] {
			seen[ln.ProducerID] = true
			deliveryTotal += ln.DeliveryFee
		}
	}
	discount := 0.0
	if in.PromoCode != "" {
		pct, err := s.promo.ValidatePromo(ctx, in.PromoCode)
		if err != nil {
			return nil, err
		}
		discount = subtotal * (pct / 100)
	}
	total := subtotal + deliveryTotal - discount
	now := time.Now()
	o := domain.Order{
		ID:             "ord-" + now.Format("20060102150405.000000000"),
		UserID:         in.UserID,
		Status:         domain.OrderNew,
		Lines:          lines,
		Subtotal:       subtotal,
		Discount:       discount,
		PromoCode:      in.PromoCode,
		ContactName:    in.ContactName,
		ContactPhone:   in.ContactPhone,
		ContactEmail:   in.ContactEmail,
		AddressLine:    in.AddressLine,
		City:           in.City,
		PostalCode:     in.PostalCode,
		DeliveryMethod: in.DeliveryMethod,
		PaymentMethod:  in.PaymentMethod,
		Total:          total,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if err := s.orders.AddOrder(ctx, o); err != nil {
		return nil, err
	}
	return &o, nil
}

func (s *OrderService) ListOrdersByUser(ctx context.Context, userID string) ([]domain.Order, error) {
	return s.orders.OrdersByUser(ctx, userID)
}

func (s *OrderService) UpdateOrderStatus(ctx context.Context, orderID string, status domain.OrderStatus) error {
	o, err := s.orders.OrderByID(ctx, orderID)
	if err != nil || o == nil {
		return domain.ErrNotFound
	}
	o.Status = status
	o.UpdatedAt = time.Now()
	return s.orders.UpdateOrder(ctx, *o)
}

// PromoService implements Promo.
type PromoService struct{}

func NewPromoService() *PromoService { return &PromoService{} }

func (s *PromoService) ValidatePromo(ctx context.Context, code string) (float64, error) {
	switch strings.ToUpper(strings.TrimSpace(code)) {
	case "FARM10":
		return 10, nil
	case "ECO15":
		return 15, nil
	case "DIRECT5":
		return 5, nil
	default:
		return 0, domain.ErrInvalidPromo
	}
}

// ProfileService implements Profile.
type ProfileService struct {
	repo ProfileRepository
}

func NewProfileService(r ProfileRepository) *ProfileService {
	return &ProfileService{repo: r}
}

func (s *ProfileService) GetProfile(ctx context.Context) (*domain.BuyerProfile, error) {
	return s.repo.GetBuyer(ctx)
}

func (s *ProfileService) UpdateProfile(ctx context.Context, p domain.BuyerProfile) error {
	return s.repo.SaveBuyer(ctx, p)
}

// SellerService implements SellerPanel.
type SellerService struct {
	orders   OrderRepository
	products ProductRepository
	chat     ChatRepository
}

func NewSellerService(o OrderRepository, p ProductRepository, c ChatRepository) *SellerService {
	return &SellerService{orders: o, products: p, chat: c}
}

func (s *SellerService) ListProducerOrders(ctx context.Context, producerID string) ([]domain.ProducerOrderView, error) {
	all, err := s.orders.AllOrders(ctx)
	if err != nil {
		return nil, err
	}
	var views []domain.ProducerOrderView
	for _, ord := range all {
		var sub []domain.OrderLine
		var sum float64
		for _, ln := range ord.Lines {
			if ln.ProducerID == producerID {
				sub = append(sub, ln)
				sum += ln.UnitPrice * float64(ln.Qty)
			}
		}
		if len(sub) == 0 {
			continue
		}
		views = append(views, domain.ProducerOrderView{
			OrderID:   ord.ID,
			BuyerName: ord.ContactName,
			Status:    ord.Status,
			Lines:     sub,
			Total:     sum,
			CreatedAt: ord.CreatedAt.Format(time.RFC3339),
		})
	}
	return views, nil
}

func (s *SellerService) UpsertProduct(ctx context.Context, p domain.Product) error {
	return s.products.SaveProduct(ctx, p)
}

func (s *SellerService) ListChat(ctx context.Context, producerID string) ([]domain.ChatMessage, error) {
	return s.chat.MessagesByProducer(ctx, producerID)
}

func (s *SellerService) SalesStats(ctx context.Context, producerID string) (SalesStats, error) {
	all, err := s.orders.AllOrders(ctx)
	if err != nil {
		return SalesStats{}, err
	}
	type agg struct {
		name  string
		units int
		sum   float64
	}
	prodAgg := map[string]*agg{}
	total := 0.0
	monthly := map[string]float64{}
	ordersN := 0
	for _, ord := range all {
		hit := false
		for _, ln := range ord.Lines {
			if ln.ProducerID != producerID {
				continue
			}
			hit = true
			lineSum := ln.UnitPrice * float64(ln.Qty)
			total += lineSum
			if prodAgg[ln.ProductID] == nil {
				p, _ := s.products.ProductByID(ctx, ln.ProductID)
				nm := ln.Name
				if p != nil {
					nm = p.Name
				}
				prodAgg[ln.ProductID] = &agg{name: nm}
			}
			prodAgg[ln.ProductID].units += ln.Qty
			prodAgg[ln.ProductID].sum += lineSum
			m := ord.CreatedAt.Format("2006-01")
			monthly[m] += lineSum
		}
		if hit {
			ordersN++
		}
	}
	var tops []TopProductStat
	for id, a := range prodAgg {
		tops = append(tops, TopProductStat{ProductID: id, Name: a.name, Units: a.units, Revenue: a.sum})
	}
	sort.Slice(tops, func(i, j int) bool { return tops[i].Revenue > tops[j].Revenue })
	if len(tops) > 5 {
		tops = tops[:5]
	}
	var mp []MonthlyPoint
	for m, v := range monthly {
		mp = append(mp, MonthlyPoint{Month: m, Revenue: v})
	}
	sort.Slice(mp, func(i, j int) bool { return mp[i].Month < mp[j].Month })
	if len(mp) > 6 {
		mp = mp[len(mp)-6:]
	}
	return SalesStats{
		TotalRevenue:   total,
		OrdersCount:    ordersN,
		TopProducts:    tops,
		MonthlyRevenue: mp,
	}, nil
}
