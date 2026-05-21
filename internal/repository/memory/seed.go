package memory

import (
	"time"

	"farmmarket/internal/domain"
)

// buildSeed fills store with demo data (10+ producers, 30+ products).
func buildSeed(s *Store) {
	base := time.Date(2025, 1, 10, 12, 0, 0, 0, time.UTC)
	s.producers = []domain.Producer{
		{ID: "pr1", Name: "Зелёный луг", Slug: "zelenyj-lug", Specialty: "Фермер", Description: "Овощи и зелень без пестицидов.", City: "Серпухов", Region: "МО", Lat: 54.92, Lng: 37.41, Rating: 4.8, ReviewCount: 56, EcoCertified: true, Organic: true, Story: "Семейная ферма с 1998 года.", Philosophy: "Честная земля — честный урожай.", Certificates: []string{"ЭкоСтандарт", "ГОСТ Р 56508"}, Awards: []string{"Лучший фермер Подмосковья 2024"}, FoundedYear: 1998, DeliveryBase: 290},
		{ID: "pr2", Name: "Ржаная пекарня", Slug: "rzhana-pekarnya", Specialty: "Пекарь", Description: "Хлеб на закваске и выпечка каждое утро.", City: "Обнинск", Region: "Калужская", Lat: 55.10, Lng: 36.61, Rating: 4.9, ReviewCount: 120, EcoCertified: false, Organic: false, Story: "Печём в печи на дровах.", Philosophy: "Медленное брожение — глубокий вкус.", Certificates: []string{"HACCP"}, Awards: []string{}, FoundedYear: 2012, DeliveryBase: 180},
		{ID: "pr3", Name: "Горный козёл", Slug: "gornyj-kozel", Specialty: "Сыровар", Description: "Козьи и овечьи сыры с выдержкой.", City: "Кисловодск", Region: "Ставропольский", Lat: 43.91, Lng: 42.72, Rating: 4.7, ReviewCount: 44, EcoCertified: true, Organic: true, Story: "Сыры с горных пастбищ.", Philosophy: "Молоко того дня — сыр завтра.", Certificates: []string{"Органик EU"}, Awards: []string{"Золотая медаль ProdExpo"}, FoundedYear: 2008, DeliveryBase: 420},
		{ID: "pr4", Name: "Липовый мед", Slug: "lipovyj-med", Specialty: "Пасечник", Description: "Мёд, прополис, восковые свечи.", City: "Тула", Region: "Тульская", Lat: 54.19, Lng: 37.62, Rating: 4.95, ReviewCount: 210, EcoCertified: true, Organic: true, Story: "Пасека в липовом бору.", Philosophy: "Пчёлы важнее прибыли.", Certificates: []string{"Медовый сертификат"}, Awards: []string{}, FoundedYear: 2005, DeliveryBase: 250},
		{ID: "pr5", Name: "Дичь и дом", Slug: "dich-i-dom", Specialty: "Мясник", Description: "Домашняя птица, кролик, дичь.", City: "Звенигород", Region: "МО", Lat: 55.73, Lng: 36.34, Rating: 4.6, ReviewCount: 33, EcoCertified: false, Organic: false, Story: "Мясные изделия без антибиотиков.", Philosophy: "Уважение к животному.", Certificates: []string{"Ветконтроль"}, Awards: []string{}, FoundedYear: 2015, DeliveryBase: 350},
		{ID: "pr6", Name: "Дары земли", Slug: "dary-zemli", Specialty: "Овощевод", Description: "Сезонные овощи, картофель, корнеплоды.", City: "Коломна", Region: "МО", Lat: 55.08, Lng: 38.78, Rating: 4.5, ReviewCount: 28, EcoCertified: true, Organic: false, Story: "Полив капельный, грунт родной.", Philosophy: "Сезон — закон.", Certificates: []string{}, Awards: []string{}, FoundedYear: 2010, DeliveryBase: 220},
		{ID: "pr7", Name: "Варенье Нины", Slug: "varene-niny", Specialty: "Заготовки", Description: "Варенье, джемы, соленья.", City: "Суздаль", Region: "Владимирская", Lat: 56.42, Lng: 40.45, Rating: 4.85, ReviewCount: 91, EcoCertified: false, Organic: true, Story: "Рецепты из семейной тетради.", Philosophy: "Меньше сахара — больше ягод.", Certificates: []string{}, Awards: []string{"Народный бренд"}, FoundedYear: 2000, DeliveryBase: 300},
		{ID: "pr8", Name: "Плетёное", Slug: "pletenoe", Specialty: "Ремесленник", Description: "Лоза, глиняная посуда, текстиль.", City: "Ростов Великий", Region: "Ярославская", Lat: 57.19, Lng: 39.41, Rating: 4.4, ReviewCount: 17, EcoCertified: false, Organic: false, Story: "Мастерская у Кремля.", Philosophy: "Руки помнят традицию.", Certificates: []string{"Народный промысел"}, Awards: []string{}, FoundedYear: 2018, DeliveryBase: 400},
		{ID: "pr9", Name: "Молочная долина", Slug: "molochnaya-dolina", Specialty: "Молочник", Description: "Молоко, ряженка, сметана, творог.", City: "Владимир", Region: "Владимирская", Lat: 56.13, Lng: 40.41, Rating: 4.75, ReviewCount: 64, EcoCertified: true, Organic: true, Story: "Коровы на выпасе 180 дней.", Philosophy: "Свежее до полки — 24 часа.", Certificates: []string{"Молочный знак"}, Awards: []string{}, FoundedYear: 2003, DeliveryBase: 260},
		{ID: "pr10", Name: "Яблоневый край", Slug: "yablonevyj-kraj", Specialty: "Садовод", Description: "Яблоки, груши, ягоды.", City: "Мичуринск", Region: "Тамбовская", Lat: 52.89, Lng: 40.49, Rating: 4.55, ReviewCount: 39, EcoCertified: true, Organic: false, Story: "Интенсивный сад на юге.", Philosophy: "Сорт — вкус.", Certificates: []string{}, Awards: []string{}, FoundedYear: 2011, DeliveryBase: 380},
	}
	for i := range s.producers {
		if v, ok := producerImages[s.producers[i].ID]; ok {
			s.producers[i].AvatarURL = v.Avatar
			s.producers[i].CoverURL = v.Cover
		}
	}

	exp := func(d int) *int { return &d }
	p := func(id, pr, name, slug string, cat domain.ProductCategory, price float64, stock int, ex *int, rating float64, rc int, eco, org, feat, isnew bool, pop int, origin string, created time.Time) domain.Product {
		return domain.Product{
			ID: id, ProducerID: pr, Name: name, Slug: slug, Description: name + " — прямо с производителя.", Category: cat, Price: price, Currency: "RUB",
			Images: productImg(id), Stock: stock, ExpiryDays: ex, Rating: rating, ReviewCount: rc, Eco: eco, Organic: org, Featured: feat, IsNew: isnew, Popularity: pop,
			OriginStory: origin, CreatedAt: created,
		}
	}

	s.products = []domain.Product{
		p("p1", "pr1", "Помидоры черри", "pomidory-cherry", domain.CatVegetables, 320, 40, exp(4), 4.8, 12, true, true, true, false, 98, "Собраны на 5-м листе, без химии.", base),
		p("p2", "pr1", "Огурцы тепличные", "ogurcy-teplichnye", domain.CatVegetables, 210, 60, exp(5), 4.6, 8, true, true, false, true, 76, "Тёплая грядка, ручной сбор.", base.AddDate(0, 0, -5)),
		p("p3", "pr6", "Морковь мытая", "morkov-myta", domain.CatVegetables, 95, 100, exp(14), 4.4, 5, false, false, false, false, 42, "Сорт Нантская.", base.AddDate(0, 0, -20)),
		p("p4", "pr6", "Свёкла столовая", "svekla", domain.CatVegetables, 70, 80, exp(30), 4.5, 4, true, false, false, false, 35, "Песчаная почва.", base),
		p("p5", "pr10", "Яблоки Антоновка", "yabloki-antonovka", domain.CatFruits, 150, 200, exp(21), 4.7, 22, true, false, true, false, 110, "Падалица для выпечки и сока.", base.AddDate(0, 0, -2)),
		p("p6", "pr10", "Груша Конференция", "grusha-konferenciya", domain.CatFruits, 280, 55, exp(10), 4.8, 9, false, false, false, true, 67, "Созревание на ветке.", base),
		p("p7", "pr10", "Клубника лоток", "klubnika-lotok", domain.CatFruits, 420, 30, exp(2), 4.9, 31, true, true, true, false, 130, "Утренний сбор, холодная цепь.", base.AddDate(0, 0, -1)),
		p("p8", "pr5", "Куриные грудки охл.", "kurinye-grudki", domain.CatMeat, 380, 25, exp(3), 4.5, 15, false, false, true, false, 88, "Порода Редбро, корм собственный.", base),
		p("p9", "pr5", "Филе кролика", "file-krolika", domain.CatMeat, 690, 15, exp(4), 4.7, 7, true, false, false, false, 52, "Разделка в день забоя.", base),
		p("p10", "pr5", "Утка потрошёная", "utka", domain.CatMeat, 520, 12, exp(2), 4.6, 6, false, false, false, true, 41, "Пекинская утка.", base.AddDate(0, 0, -3)),
		p("p11", "pr9", "Молоко 3.4% 1л", "moloko-1l", domain.CatDairy, 110, 200, exp(5), 4.8, 40, true, true, true, false, 150, "Пастеризация щадящая.", base),
		p("p12", "pr9", "Сметана 20%", "smetana-20", domain.CatDairy, 145, 80, exp(10), 4.7, 18, false, true, false, false, 72, "Густая, без загустителей.", base),
		p("p13", "pr9", "Творог 5%", "tvorog-5", domain.CatDairy, 160, 60, exp(7), 4.6, 11, true, true, false, true, 63, "Мягкий пресс.", base.AddDate(0, 0, -4)),
		p("p14", "pr9", "Ряженка 1л", "ryazhenka", domain.CatDairy, 125, 90, exp(8), 4.9, 14, false, true, false, false, 58, "Томление 6 часов.", base),
		p("p15", "pr2", "Хлеб ржаной на закваске", "hleb-rzhanoj", domain.CatBakery, 180, 35, exp(3), 4.95, 45, false, false, true, false, 140, "Закваска 12 лет.", base),
		p("p16", "pr2", "Круассаны с маслом", "kruassany", domain.CatBakery, 220, 24, exp(2), 4.8, 20, false, false, false, true, 95, "Слоёное AOP.", base),
		p("p17", "pr2", "Багет классический", "baget", domain.CatBakery, 95, 50, exp(1), 4.5, 10, false, false, false, false, 70, "Каменная печь.", base),
		p("p18", "pr4", "Мёд липовый 500г", "med-lipovyj-500", domain.CatHoney, 650, 40, exp(730), 4.9, 60, true, true, true, false, 200, "Откачка лето 2025.", base),
		p("p19", "pr4", "Мёд гречишный 250г", "med-grechishnyj", domain.CatHoney, 380, 55, exp(730), 4.85, 25, true, true, false, false, 90, "Тёмный, насыщенный.", base),
		p("p20", "pr4", "Прополис настойка", "propolis", domain.CatHoney, 290, 30, exp(365), 4.4, 8, true, false, false, true, 33, "Настоян на спирту пищевом.", base),
		p("p21", "pr7", "Варенье малина", "varene-malina", domain.CatJam, 340, 45, exp(365), 4.9, 19, false, true, true, false, 102, "60% ягоды.", base),
		p("p22", "pr7", "Джем смородина", "dzhem-smorodina", domain.CatJam, 310, 40, exp(365), 4.7, 12, true, true, false, false, 61, "Чёрная смородина.", base),
		p("p23", "pr7", "Соленье огурцы бочка", "sol-ogurcy", domain.CatVegetables, 280, 30, exp(180), 4.8, 14, false, false, false, true, 48, "Бочковые, хруст.", base.AddDate(0, 0, -6)),
		p("p24", "pr3", "Сыр козий молодой", "syr-kozij", domain.CatCheese, 890, 20, exp(21), 4.8, 16, true, true, true, false, 77, "Выдержка 14 дней.", base),
		p("p25", "pr3", "Сыр овечий выдержанный", "syr-ovechij", domain.CatCheese, 1200, 12, exp(45), 4.9, 9, true, true, false, false, 55, "Горные пастбища.", base),
		p("p26", "pr3", "Брынза домашняя", "brynza", domain.CatCheese, 420, 25, exp(14), 4.5, 7, false, false, false, false, 44, "Рассол традиционный.", base),
		p("p27", "pr8", "Корзина плетёная S", "korzina-s", domain.CatCraft, 1850, 8, nil, 4.5, 5, true, false, false, true, 28, "Лоза ручного забора.", base),
		p("p28", "pr8", "Горшок глиняный 2л", "gorshok-glinyanyj", domain.CatCraft, 950, 15, nil, 4.3, 4, false, false, false, false, 22, "Обжиг в яме.", base),
		p("p29", "pr1", "Базилик горшок", "bazilik-gorshok", domain.CatVegetables, 250, 35, exp(7), 4.6, 6, true, true, false, false, 36, "Живое растение.", base),
		p("p30", "pr6", "Капуста белокочанная", "kapusta", domain.CatVegetables, 45, 120, exp(21), 4.2, 3, false, false, false, false, 25, "Поздний сорт.", base),
		p("p31", "pr10", "Смородина заморозка", "smorodina-zamorozka", domain.CatFruits, 260, 40, exp(180), 4.6, 8, true, true, false, false, 47, "Шоковая заморозка.", base.AddDate(0, 0, -10)),
		p("p32", "pr2", "Пирог с капустой", "pirog-kapusta", domain.CatBakery, 340, 18, exp(2), 4.7, 11, false, false, true, false, 84, "Домашнее тесто.", base),
		p("p33", "pr5", "Яйца куриные С0", "yajca-c0", domain.CatMeat, 140, 90, exp(25), 4.8, 19, true, false, false, true, 92, "Наседка и вольер.", base),
	}

	s.reviews = []domain.Review{
		{ID: "r1", Target: domain.ReviewProduct, TargetID: "p1", AuthorID: "buyer-1", AuthorName: "Мария", Rating: 5, Text: "Сочные, как из детства.", PhotoURL: productImg("p1")[0], Likes: 12, CreatedAt: base.AddDate(0, 0, -3)},
		{ID: "r2", Target: domain.ReviewProduct, TargetID: "p1", AuthorID: "u2", AuthorName: "Игорь", Rating: 4, Text: "Хороший вкус, чуть кисловаты — норм для черри.", Likes: 3, CreatedAt: base.AddDate(0, 0, -8)},
		{ID: "r3", Target: domain.ReviewProducer, TargetID: "pr4", AuthorID: "buyer-1", AuthorName: "Мария", Rating: 5, Text: "Лучший мёд в регионе.", Likes: 40, CreatedAt: base.AddDate(0, 0, -1)},
		{ID: "r4", Target: domain.ReviewProduct, TargetID: "p18", AuthorID: "u3", AuthorName: "Алексей", Rating: 5, Text: "Аромат невероятный.", Likes: 8, CreatedAt: base.AddDate(0, 0, -12)},
		{ID: "r5", Target: domain.ReviewProduct, TargetID: "p15", AuthorID: "buyer-1", AuthorName: "Мария", Rating: 5, Text: "Корка хрустящая, мякиш влажный.", Likes: 15, CreatedAt: base.AddDate(0, 0, -4)},
	}
	s.comments = []domain.ReviewComment{
		{ID: "cm1", ReviewID: "r1", AuthorName: "Елена", Text: "Согласна, заказываю каждую неделю.", CreatedAt: base.AddDate(0, 0, -2)},
		{ID: "cm2", ReviewID: "r3", AuthorName: "Пасечник фан", Text: "+1 к качеству!", CreatedAt: base.AddDate(0, 0, -1)},
	}

	s.buyer = domain.BuyerProfile{
		ID: "buyer-1", Email: "maria@example.com", Name: "Мария Иванова", Phone: "+79001234567",
		FavoriteProductIDs:    []string{"p1", "p18", "p15"},
		SubscribedProducerIDs: []string{"pr1", "pr4", "pr2"},
		Addresses: []domain.Address{
			{ID: "a1", Label: "Дом", Line: "ул. Лесная, 7", City: "Москва", PostalCode: "125000", IsDefault: true},
		},
		Notifications: domain.NotificationSettings{EmailOrders: true, PushPromo: true, SmsDelivery: false, NewFromSubs: true},
	}

	s.orders = []domain.Order{
		{
			ID: "ord-seed-1", UserID: "buyer-1", Status: domain.OrderDelivered,
			Lines: []domain.OrderLine{
				{ProductID: "p1", ProducerID: "pr1", Name: "Помидоры черри", Image: productImg("p1")[0], UnitPrice: 320, Qty: 2, DeliveryFee: 290},
			},
			Subtotal: 640, Discount: 0, ContactName: "Мария", ContactPhone: "+79001234567", ContactEmail: "maria@example.com",
			AddressLine: "ул. Лесная, 7", City: "Москва", PostalCode: "125000", DeliveryMethod: domain.DeliveryCourier, PaymentMethod: domain.PaymentOnline,
			Total: 930, CreatedAt: base.AddDate(0, -2, 0), UpdatedAt: base.AddDate(0, -1, 0),
		},
		{
			ID: "ord-seed-2", UserID: "buyer-1", Status: domain.OrderProcessing,
			Lines: []domain.OrderLine{
				{ProductID: "p18", ProducerID: "pr4", Name: "Мёд липовый 500г", Image: productImg("p18")[0], UnitPrice: 650, Qty: 1, DeliveryFee: 250},
				{ProductID: "p19", ProducerID: "pr4", Name: "Мёд гречишный 250г", Image: productImg("p19")[0], UnitPrice: 380, Qty: 1, DeliveryFee: 0},
			},
			Subtotal: 1030, Discount: 103, PromoCode: "FARM10", ContactName: "Мария", ContactPhone: "+79001234567", ContactEmail: "maria@example.com",
			AddressLine: "ул. Лесная, 7", City: "Москва", PostalCode: "125000", DeliveryMethod: domain.DeliveryPVZ, PaymentMethod: domain.PaymentCard,
			Total: 1177, CreatedAt: base.AddDate(0, 0, -2), UpdatedAt: base.AddDate(0, 0, -2),
		},
	}

	s.chat = []domain.ChatMessage{
		{ID: "ch1", ProducerID: "pr1", FromBuyer: true, Author: "Мария", Text: "Здравствуйте, есть опт на помидоры?", CreatedAt: base.AddDate(0, 0, -1).Format(time.RFC3339)},
		{ID: "ch2", ProducerID: "pr1", FromBuyer: false, Author: "Зелёный луг", Text: "Добрый день! От 20 кг — скидка 8%.", CreatedAt: base.AddDate(0, 0, -1).Add(time.Hour).Format(time.RFC3339)},
	}

	for _, o := range s.orders {
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
	}
}
