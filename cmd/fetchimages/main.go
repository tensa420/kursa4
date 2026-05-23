package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const catalogVersion = "7"

var products = []struct {
	ID, Name string
	Files    []string
	Direct   string
}{
	{"p1", "Помидоры черри", []string{"File:Yellow cherry tomatoes.jpg", "File:Cherry-Tomatoes-in-Pack.jpg"}, ""},
	{"p2", "Огурцы", []string{"File:Cucumber in market.jpg"}, ""},
	{"p3", "Морковь", []string{"File:Carrots of many colors.jpg"}, ""},
	{"p4", "Свёкла", []string{"File:Beetroots in a basket.jpg"}, ""},
	{"p5", "Яблоки", []string{"File:Red apples.jpg"}, ""},
	{"p6", "Груша", []string{"File:Pears on tree.jpg"}, ""},
	{"p7", "Клубника", []string{"File:FraiseFruitPhoto.jpg", "File:Garden strawberry (Fragaria × ananassa) halved.jpg"}, ""},
	{"p8", "Куриная грудка", []string{"File:Chicken fillet.jpg", "File:Chicken breast raw.jpg"}, "https://upload.wikimedia.org/wikipedia/commons/d/db/CHICKEN_BREAST.jpg"},
	{"p9", "Кролик", []string{"File:Hasenkeule2.jpg", "File:Wild rabbit, stewed.jpg", "File:Rabbit meat.jpg"}, ""},
	{"p10", "Утка", []string{"File:Peking Roast duck with bread.jpg"}, ""},
	{"p11", "Молоко", []string{"File:Glass of Milk (33657535532).jpg", "File:Milk as a beverage.JPG"}, ""},
	{"p12", "Сметана", []string{"File:Smetana.jpg"}, ""},
	{"p13", "Творог", []string{"File:Skimmed milk quark on spoon.jpg", "File:Tvorog.jpg"}, ""},
	{"p14", "Ряженка", []string{"File:Kefir.jpg"}, ""},
	{"p15", "Ржаной хлеб", []string{"File:Dark rye bread.JPG", "File:Rye-bread-loaf.jpg"}, ""},
	{"p16", "Круассаны", []string{"File:Croissant In Austria.jpg", "File:Pain au chocolat Luc Viatour.jpg"}, ""},
	{"p17", "Багет", []string{"File:Brot 001 2016 07 03.jpg", "File:Baguette de tradition francaise.jpg"}, ""},
	{"p18", "Мёд липовый", []string{"File:Runny hunny.jpg"}, ""},
	{"p19", "Мёд гречишный", []string{"File:Three French monofloral honey jars.jpg"}, ""},
	{"p20", "Прополис", []string{"File:Propolis.jpg"}, ""},
	{"p21", "Варенье малина", []string{"File:Many jars of raspberry jam (19778995921).jpg", "File:P.S. Church Raspberry Jam Jar.JPG"}, ""},
	{"p22", "Джем смородина", []string{"File:Blackcurrant jam.jpg"}, ""},
	{"p23", "Солёные огурцы", []string{"File:A jar of sliced pickled cucumber.jpg", "File:Pickled cucumber 2.jpg"}, ""},
	{"p24", "Сыр козий", []string{"File:Goat cheese (4804052501).jpg", "File:Goat cheese with thymus.JPG", "File:Crottin 02.jpg"}, ""},
	{"p25", "Сыр выдержанный", []string{"File:Parmigiano reggiano cheese 2.jpg", "File:Parmigiano-Reggiano.jpg", "File:Parmesan cheese.jpg"}, ""},
	{"p26", "Брынза", []string{"File:Greek feta cheese.jpg", "File:Feta Cheese.jpg"}, ""},
	{"p27", "Корзина", []string{"File:Eggs in basket 2020 G1.jpg", "File:Wicker basket.jpg"}, ""},
	{"p28", "Горшок глиняный", []string{"File:Clay pot.jpg"}, ""},
	{"p29", "Базилик", []string{"File:Basil leaves.jpg"}, ""},
	{"p30", "Капуста", []string{"File:White cabbage.jpg"}, ""},
	{"p31", "Смородина заморозка", []string{"File:Ribes nigrum fruits.jpg", "File:Black currants.jpg", "File:Blackcurrant.jpg"}, ""},
	{"p32", "Пирог с капустой", []string{"File:Coulibiac.jpg", "File:Kulebyaka with cabbage.JPG", "File:Russian coulibiac.jpg"}, ""},
	{"p33", "Яйца", []string{"File:Chicken eggs.jpg"}, ""},
}

func main() {
	root, _ := os.Getwd()
	out := filepath.Join(root, "web", "public", "products")
	_ = os.MkdirAll(out, 0o755)
	client := &http.Client{Timeout: 90 * time.Second}

	only := os.Getenv("ONLY")
	var onlySet map[string]bool
	if only != "" {
		onlySet = make(map[string]bool)
		for _, id := range strings.Split(only, ",") {
			onlySet[strings.TrimSpace(id)] = true
		}
	}

	ok := 0
	for _, p := range products {
		if onlySet != nil && !onlySet[p.ID] {
			continue
		}
		time.Sleep(5 * time.Second)
		path := filepath.Join(out, p.ID+".jpg")
		var err error
		for _, f := range p.Files {
			thumb, e := thumbByTitle(client, f)
			if e != nil || thumb == "" {
				err = e
				time.Sleep(2 * time.Second)
				continue
			}
			if e = downloadJPEG(client, thumb, path); e == nil {
				fmt.Println("OK", p.ID, p.Name, "←", f)
				ok++
				err = nil
				break
			}
			err = e
		}
		if err != nil && p.Direct != "" {
			if e := downloadJPEG(client, p.Direct, path); e == nil {
				fmt.Println("OK", p.ID, p.Name, "← direct")
				ok++
				err = nil
			}
		}
		if err != nil {
			fmt.Println("FAIL", p.ID, p.Name, err)
		}
	}
	fmt.Printf("Done %d/%d -> %s (catalog v%s)\n", ok, len(products), out, catalogVersion)
}

func wikiAPI(client *http.Client, params url.Values) (map[string]any, error) {
	params.Set("format", "json")
	u := "https://commons.wikimedia.org/w/api.php?" + params.Encode()
	req, _ := http.NewRequest(http.MethodGet, u, nil)
	req.Header.Set("User-Agent", "FarmMarketCourse/1.0 (edu; contact@example.com)")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var data map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}
	return data, nil
}

func thumbByTitle(client *http.Client, title string) (string, error) {
	if !strings.HasPrefix(title, "File:") {
		title = "File:" + title
	}
	data, err := wikiAPI(client, url.Values{
		"action":     {"query"},
		"titles":     {title},
		"prop":       {"imageinfo"},
		"iiprop":     {"url|mime"},
		"iiurlwidth": {"800"},
	})
	if err != nil {
		return "", err
	}
	q, _ := data["query"].(map[string]any)
	pages, _ := q["pages"].(map[string]any)
	for _, pg := range pages {
		page, _ := pg.(map[string]any)
		if _, missing := page["missing"]; missing {
			return "", fmt.Errorf("missing: %s", title)
		}
		ii, _ := page["imageinfo"].([]any)
		if len(ii) == 0 {
			continue
		}
		first, _ := ii[0].(map[string]any)
		if u, _ := first["thumburl"].(string); u != "" {
			return u, nil
		}
		if u, _ := first["url"].(string); u != "" {
			return u, nil
		}
	}
	return "", fmt.Errorf("no thumb for %s", title)
}

func downloadJPEG(client *http.Client, src, dest string) error {
	req, _ := http.NewRequest(http.MethodGet, src, nil)
	req.Header.Set("User-Agent", "FarmMarketCourse/1.0")
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("status %d", resp.StatusCode)
	}
	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()
	n, err := io.Copy(f, resp.Body)
	if err != nil {
		return err
	}
	if n < 5000 {
		return fmt.Errorf("file too small (%d bytes)", n)
	}
	buf := make([]byte, 2)
	if _, err := f.Seek(0, 0); err != nil {
		return err
	}
	if _, err := f.Read(buf); err != nil {
		return err
	}
	if buf[0] != 0xff || buf[1] != 0xd8 {
		return fmt.Errorf("not jpeg")
	}
	return nil
}
