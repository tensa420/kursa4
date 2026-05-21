package httpdelivery

import (
	"encoding/json"
	"net/http"
	"reflect"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"farmmarket/internal/domain"
	"farmmarket/internal/usecase"
)

// Deps aggregates use cases for HTTP handlers.
type Deps struct {
	Catalog  *usecase.CatalogService
	Producer *usecase.ProducerService
	Reviews  *usecase.ReviewService
	Orders   *usecase.OrderService
	Promo    *usecase.PromoService
	Profile  *usecase.ProfileService
	Seller   *usecase.SellerService
}

func NewRouter(d Deps) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.RealIP, middleware.Logger, middleware.Recoverer)
	r.Use(cors)

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Get("/api/categories", listCategories)
	r.Get("/api/producers", d.handleListProducers)
	r.Get("/api/producers/{id}", d.handleGetProducer)
	r.Get("/api/producers/{id}/products", d.handleProducerProducts)

	r.Get("/api/products", d.handleListProducts)
	r.Get("/api/products/{id}/similar", d.handleSimilar)
	r.Get("/api/products/{id}", d.handleGetProduct)

	r.Get("/api/reviews", d.handleListReviews)
	r.Get("/api/reviews/{id}/comments", d.handleListComments)
	r.Post("/api/reviews", d.handleAddReview)

	r.Post("/api/promo/validate", d.handlePromo)

	r.Post("/api/orders", d.handleCreateOrder)
	r.Get("/api/orders", d.handleListOrders)
	r.Patch("/api/orders/{id}/status", d.handleOrderStatus)

	r.Get("/api/profile", d.handleGetProfile)
	r.Put("/api/profile", d.handlePutProfile)

	r.Get("/api/seller/orders", d.handleSellerOrders)
	r.Get("/api/seller/stats", d.handleSellerStats)
	r.Get("/api/seller/chat", d.handleSellerChat)
	r.Post("/api/seller/products", d.handleSellerUpsertProduct)
	r.Put("/api/seller/products/{id}", d.handleSellerUpsertProductID)

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
	})
	return r
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		o := r.Header.Get("Origin")
		if o == "" {
			o = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", o)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Id, X-Producer-Id")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// jsonNormalize заменяет nil-срезы на [] (в т.ч. внутри map), иначе в JSON уходит null.
func jsonNormalize(v any) any {
	if v == nil {
		return v
	}
	rv := reflect.ValueOf(v)
	switch rv.Kind() {
	case reflect.Slice:
		if rv.IsNil() {
			return reflect.MakeSlice(rv.Type(), 0, 0).Interface()
		}
		return v
	case reflect.Map:
		out := make(map[string]any, rv.Len())
		for _, key := range rv.MapKeys() {
			if key.Kind() == reflect.String {
				out[key.String()] = jsonNormalize(rv.MapIndex(key).Interface())
			}
		}
		return out
	default:
		return v
	}
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(jsonNormalize(v))
}

func listCategories(w http.ResponseWriter, r *http.Request) {
	type cat struct {
		ID    string `json:"id"`
		Label string `json:"label"`
	}
	writeJSON(w, http.StatusOK, []cat{
		{string(domain.CatVegetables), "Овощи"},
		{string(domain.CatFruits), "Фрукты и ягоды"},
		{string(domain.CatMeat), "Мясо и яйца"},
		{string(domain.CatDairy), "Молочные"},
		{string(domain.CatBakery), "Выпечка"},
		{string(domain.CatHoney), "Мёд и пчёлка"},
		{string(domain.CatJam), "Варенье и заготовки"},
		{string(domain.CatCheese), "Сыры"},
		{string(domain.CatCraft), "Рукоделие"},
	})
}

func (d Deps) handleListProducers(w http.ResponseWriter, r *http.Request) {
	list, err := d.Producer.ListProducers(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (d Deps) handleGetProducer(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := d.Producer.GetProducer(r.Context(), id)
	if err != nil || p == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "producer not found"})
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (d Deps) handleProducerProducts(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	list, err := d.Producer.ProductsByProducer(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func parseProductQuery(r *http.Request) usecase.ProductQuery {
	q := r.URL.Query()
	pq := usecase.ProductQuery{
		Search:   q.Get("search"),
		Category: domain.ProductCategory(q.Get("category")),
		City:     q.Get("city"),
		Sort:     q.Get("sort"),
	}
	if v := q.Get("page"); v != "" {
		pq.Page, _ = strconv.Atoi(v)
	}
	if v := q.Get("pageSize"); v != "" {
		pq.PageSize, _ = strconv.Atoi(v)
	}
	if v := q.Get("minPrice"); v != "" {
		x, _ := strconv.ParseFloat(v, 64)
		pq.MinPrice = &x
	}
	if v := q.Get("maxPrice"); v != "" {
		x, _ := strconv.ParseFloat(v, 64)
		pq.MaxPrice = &x
	}
	if v := q.Get("minRating"); v != "" {
		x, _ := strconv.ParseFloat(v, 64)
		pq.MinRating = &x
	}
	if v := q.Get("eco"); v != "" {
		b := v == "1" || strings.EqualFold(v, "true")
		pq.Eco = &b
	}
	if v := q.Get("organic"); v != "" {
		b := v == "1" || strings.EqualFold(v, "true")
		pq.Organic = &b
	}
	if v := q.Get("userLat"); v != "" {
		x, _ := strconv.ParseFloat(v, 64)
		pq.UserLat = &x
	}
	if v := q.Get("userLng"); v != "" {
		x, _ := strconv.ParseFloat(v, 64)
		pq.UserLng = &x
	}
	if v := q.Get("maxDistanceKm"); v != "" {
		x, _ := strconv.ParseFloat(v, 64)
		pq.MaxDistanceKm = &x
	}
	return pq
}

func (d Deps) handleListProducts(w http.ResponseWriter, r *http.Request) {
	pq := parseProductQuery(r)
	list, total, err := d.Catalog.ListProducts(r.Context(), pq)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": list, "total": total})
}

func (d Deps) handleGetProduct(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := d.Catalog.GetProduct(r.Context(), id)
	if err != nil || p == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "product not found"})
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (d Deps) handleSimilar(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	list, err := d.Catalog.SimilarProducts(r.Context(), id, 8)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (d Deps) handleListReviews(w http.ResponseWriter, r *http.Request) {
	t := domain.ReviewTarget(r.URL.Query().Get("target"))
	tid := r.URL.Query().Get("targetId")
	if tid == "" || (t != domain.ReviewProduct && t != domain.ReviewProducer) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "target and targetId required"})
		return
	}
	list, err := d.Reviews.ListReviews(r.Context(), t, tid)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (d Deps) handleListComments(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	list, err := d.Reviews.ListComments(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (d Deps) handleAddReview(w http.ResponseWriter, r *http.Request) {
	var body domain.Review
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if body.AuthorName == "" {
		body.AuthorName = "Гость"
	}
	body.AuthorID = r.Header.Get("X-User-Id")
	if body.AuthorID == "" {
		body.AuthorID = "guest"
	}
	out, err := d.Reviews.AddReview(r.Context(), body)
	if err == domain.ErrValidation {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, out)
}

type promoReq struct {
	Code string `json:"code"`
}

func (d Deps) handlePromo(w http.ResponseWriter, r *http.Request) {
	var body promoReq
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	pct, err := d.Promo.ValidatePromo(r.Context(), body.Code)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid promo"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"discountPercent": pct})
}

type createOrderBody struct {
	usecase.CreateOrderInput
}

func (d Deps) handleCreateOrder(w http.ResponseWriter, r *http.Request) {
	var body createOrderBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if body.UserID == "" {
		body.UserID = r.Header.Get("X-User-Id")
	}
	if body.UserID == "" {
		body.UserID = "buyer-1"
	}
	o, err := d.Orders.CreateOrder(r.Context(), body.CreateOrderInput)
	if err == domain.ErrValidation || err == domain.ErrInvalidPromo || err == domain.ErrOutOfStock {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if err == domain.ErrNotFound {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": err.Error()})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, o)
}

func (d Deps) handleListOrders(w http.ResponseWriter, r *http.Request) {
	uid := r.URL.Query().Get("userId")
	if uid == "" {
		uid = r.Header.Get("X-User-Id")
	}
	if uid == "" {
		uid = "buyer-1"
	}
	list, err := d.Orders.ListOrdersByUser(r.Context(), uid)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

type statusBody struct {
	Status domain.OrderStatus `json:"status"`
}

func (d Deps) handleOrderStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var body statusBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if err := d.Orders.UpdateOrderStatus(r.Context(), id, body.Status); err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"ok": "true"})
}

func (d Deps) handleGetProfile(w http.ResponseWriter, r *http.Request) {
	p, err := d.Profile.GetProfile(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (d Deps) handlePutProfile(w http.ResponseWriter, r *http.Request) {
	var body domain.BuyerProfile
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	if err := d.Profile.UpdateProfile(r.Context(), body); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"ok": "true"})
}

func sellerID(r *http.Request) string {
	if v := r.Header.Get("X-Producer-Id"); v != "" {
		return v
	}
	return "pr1"
}

func (d Deps) handleSellerOrders(w http.ResponseWriter, r *http.Request) {
	list, err := d.Seller.ListProducerOrders(r.Context(), sellerID(r))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (d Deps) handleSellerStats(w http.ResponseWriter, r *http.Request) {
	st, err := d.Seller.SalesStats(r.Context(), sellerID(r))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, st)
}

func (d Deps) handleSellerChat(w http.ResponseWriter, r *http.Request) {
	list, err := d.Seller.ListChat(r.Context(), sellerID(r))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (d Deps) handleSellerUpsertProduct(w http.ResponseWriter, r *http.Request) {
	var p domain.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	p.ProducerID = sellerID(r)
	if err := d.Seller.UpsertProduct(r.Context(), p); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"ok": "true"})
}

func (d Deps) handleSellerUpsertProductID(w http.ResponseWriter, r *http.Request) {
	var p domain.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}
	p.ID = chi.URLParam(r, "id")
	p.ProducerID = sellerID(r)
	if err := d.Seller.UpsertProduct(r.Context(), p); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"ok": "true"})
}
