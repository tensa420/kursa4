package memory

import (
	"fmt"

	"farmmarket/internal/domain"
)

// catalogVersion — при увеличении перезаписываются URL в store.json.
const catalogVersion = 7

// Локальные фото в web/public/products/{id}.jpg (скачаны scripts/download-product-images.ps1).
func localProduct(id string) string {
	return fmt.Sprintf("/products/%s.jpg?v=7", id)
}

var productImageIDs = []string{
	"p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10",
	"p11", "p12", "p13", "p14", "p15", "p16", "p17", "p18", "p19", "p20",
	"p21", "p22", "p23", "p24", "p25", "p26", "p27", "p28", "p29", "p30",
	"p31", "p32", "p33",
}

func init() {
	productImages = make(map[string][]string, len(productImageIDs))
	for _, id := range productImageIDs {
		productImages[id] = []string{localProduct(id)}
	}
}

// productImages — главное фото по ID товара.
var productImages map[string][]string

func productImg(id string) []string {
	if imgs, ok := productImages[id]; ok {
		out := make([]string, len(imgs))
		copy(out, imgs)
		return out
	}
	return []string{localProduct("p1")}
}

type producerVisual struct {
	Avatar string
	Cover  string
}

var producerImages = map[string]producerVisual{
	"pr1":  {Avatar: localProduct("p1"), Cover: localProduct("p3")},
	"pr2":  {Avatar: localProduct("p15"), Cover: localProduct("p16")},
	"pr3":  {Avatar: localProduct("p24"), Cover: localProduct("p25")},
	"pr4":  {Avatar: localProduct("p18"), Cover: localProduct("p20")},
	"pr5":  {Avatar: localProduct("p8"), Cover: localProduct("p33")},
	"pr6":  {Avatar: localProduct("p3"), Cover: localProduct("p30")},
	"pr7":  {Avatar: localProduct("p21"), Cover: localProduct("p22")},
	"pr8":  {Avatar: localProduct("p27"), Cover: localProduct("p28")},
	"pr9":  {Avatar: localProduct("p11"), Cover: localProduct("p13")},
	"pr10": {Avatar: localProduct("p5"), Cover: localProduct("p7")},
}

func applyImageCatalog(s *Store) {
	for i := range s.products {
		if imgs := productImages[s.products[i].ID]; len(imgs) > 0 {
			s.products[i].Images = append([]string(nil), imgs...)
		}
	}
	for i := range s.producers {
		if v, ok := producerImages[s.producers[i].ID]; ok {
			s.producers[i].AvatarURL = v.Avatar
			s.producers[i].CoverURL = v.Cover
		}
	}
	for i := range s.reviews {
		if imgs := productImages[s.reviews[i].TargetID]; s.reviews[i].Target == domain.ReviewProduct && len(imgs) > 0 {
			s.reviews[i].PhotoURL = imgs[0]
		}
	}
	for i := range s.orders {
		for j := range s.orders[i].Lines {
			if imgs := productImages[s.orders[i].Lines[j].ProductID]; len(imgs) > 0 {
				s.orders[i].Lines[j].Image = imgs[0]
			}
		}
	}
}
