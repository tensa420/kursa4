package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	httpdelivery "farmmarket/internal/delivery/http"
	"farmmarket/internal/repository/memory"
	"farmmarket/internal/usecase"
)

func main() {
	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = filepath.Join(".", "data")
	}
	store := memory.NewStore(filepath.Join(dataDir, "store.json"))

	cat := usecase.NewCatalogService(store, store)
	prod := usecase.NewProducerService(store, store)
	rev := usecase.NewReviewService(store)
	promo := usecase.NewPromoService()
	ord := usecase.NewOrderService(store, store, store, promo)
	prof := usecase.NewProfileService(store)
	sell := usecase.NewSellerService(store, store, store)

	h := httpdelivery.NewRouter(httpdelivery.Deps{
		Catalog:  cat,
		Producer: prod,
		Reviews:  rev,
		Orders:   ord,
		Promo:    promo,
		Profile:  prof,
		Seller:   sell,
	})

	addr := ":8080"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}
	log.Printf("farmmarket API %s", addr)
	if err := http.ListenAndServe(addr, h); err != nil {
		log.Fatal(err)
	}
}
