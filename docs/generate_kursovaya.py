# -*- coding: utf-8 -*-
"""Пояснительная записка FarmMarket (~20+ стр.). Запуск: py -3 docs/generate_kursovaya.py"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = "docs/Kursovaya_FarmMarket.docx"

# --- Листинги из репозитория ---
L_MAIN = """package main

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
    ord := usecase.NewOrderService(store, store, store, promo)
    h := httpdelivery.NewRouter(httpdelivery.Deps{
        Catalog: cat, Orders: ord, /* Catalog, Producer, Reviews... */
    })
    log.Printf("farmmarket API :8080")
    http.ListenAndServe(":8080", h)
}"""

L_PRODUCT = """type Product struct {
    ID          string          `json:"id"`
    ProducerID  string          `json:"producerId"`
    Name        string          `json:"name"`
    Category    ProductCategory `json:"category"`
    Price       float64         `json:"price"`
    Images      []string        `json:"images"`
    Stock       int             `json:"stock"`
    Rating      float64         `json:"rating"`
    Eco         bool            `json:"eco"`
    Organic     bool            `json:"organic"`
    Popularity  int             `json:"popularity"`
}"""

L_JSON_NORM = """func jsonNormalize(v any) any {
    rv := reflect.ValueOf(v)
    switch rv.Kind() {
    case reflect.Slice:
        if rv.IsNil() {
            return reflect.MakeSlice(rv.Type(), 0, 0).Interface()
        }
    case reflect.Map:
        out := make(map[string]any, rv.Len())
        for _, key := range rv.MapKeys() {
            out[key.String()] = jsonNormalize(rv.MapIndex(key).Interface())
        }
        return out
    }
    return v
}

func writeJSON(w http.ResponseWriter, code int, v any) {
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    json.NewEncoder(w).Encode(jsonNormalize(v))
}"""

L_ORDER_UC = """func (s *OrderService) CreateOrder(ctx context.Context, in CreateOrderInput) (*domain.Order, error) {
    if in.ContactName == "" || in.ContactPhone == "" || in.ContactEmail == "" {
        return nil, domain.ErrValidation
    }
    for _, ln := range in.Lines {
        p, _ := s.products.ProductByID(ctx, ln.ProductID)
        if ln.Qty < 1 || ln.Qty > p.Stock {
            return nil, domain.ErrOutOfStock
        }
        subtotal += p.Price * float64(ln.Qty)
    }
    if in.PromoCode != "" {
        pct, err := s.promo.ValidatePromo(ctx, in.PromoCode)
        discount = subtotal * (pct / 100)
    }
    return &o, s.orders.AddOrder(ctx, o)
}"""

L_CATALOG_FILTER = """for _, p := range all {
    if q.Category != "" && p.Category != q.Category { continue }
    if q.MinPrice != nil && p.Price < *q.MinPrice { continue }
    if q.Eco != nil && *q.Eco && !p.Eco { continue }
    if q.MaxDistanceKm != nil {
        d := haversine(*q.UserLat, *q.UserLng, pr.Lat, pr.Lng)
        if d > *q.MaxDistanceKm { continue }
    }
    out = append(out, p)
}
sort.Slice(out, func(i, j int) bool {
    switch q.Sort {
    case "price_asc":  return out[i].Price < out[j].Price
    case "newest":     return out[i].CreatedAt.After(out[j].CreatedAt)
    default:           return out[i].Popularity > out[j].Popularity
    }
})"""

L_API_TS = """function asArray<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

export const api = {
  products: (params) =>
    req(`/api/products?` + q).then((r) =>
      j<{ items: Product[] | null; total: number }>(r).then((data) => ({
        items: asArray(data.items),
        total: data.total ?? 0,
      }))
    ),
  createOrder: (body, headers) =>
    req(`/api/orders`, { method: "POST", body: JSON.stringify(body), headers }),
};"""

L_ZOD = """const step1 = z.object({
  contactName: z.string().min(2, "Укажите имя"),
  contactPhone: z.string().min(10, "Телефон"),
  contactEmail: z.string().email("Email"),
});
const step2 = z.object({
  addressLine: z.string().min(3, "Адрес"),
  city: z.string().min(2, "Город"),
  postalCode: z.string().min(4, "Индекс"),
});"""

L_CART = """export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (p, qty) => { /* объединение позиций, лимит stock */ },
      clear: () => set({ lines: [] }),
    }),
    { name: "farmmarket-cart" }
  )
);"""

L_STORE = """func NewStore(dataFile string) *Store {
    if b, err := os.ReadFile(dataFile); err == nil {
        json.Unmarshal(b, &snap)
        applyImageCatalog(s)
        return s
    }
    buildSeed(s)
    applyImageCatalog(s)
    s.persist()
    return s
}"""

L_ROUTES = """r.Get("/api/products", d.handleListProducts)
r.Get("/api/products/{id}/similar", d.handleSimilar)
r.Get("/api/products/{id}", d.handleGetProduct)
r.Post("/api/orders", d.handleCreateOrder)
r.Get("/api/seller/orders", d.handleSellerOrders)
r.Post("/api/seller/products", d.handleSellerUpsertProduct)"""

L_APP_TSX = """export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/seller" element={<SellerPage />} />
      </Route>
    </Routes>
  );
}"""


def set_margins(doc):
    for s in doc.sections:
        s.top_margin = Cm(2)
        s.bottom_margin = Cm(2.5)
        s.left_margin = Cm(2.5)
        s.right_margin = Cm(1)


def set_run_font(run, bold=False, size=14):
    run.font.name = "Times New Roman"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor(0, 0, 0)


def style_normal(doc):
    st = doc.styles["Normal"]
    st.font.name = "Times New Roman"
    st._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    st.font.size = Pt(14)
    pf = st.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    pf.line_spacing = 1.5
    pf.first_line_indent = Cm(1.25)
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY


def add_page_number(section):
    p = section.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    run._r.append(fld)
    set_run_font(run)


def add_title(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    set_run_font(p.add_run(text), bold=True)


def add_subheading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(6)
    set_run_font(p.add_run(text), bold=True)


def add_para(doc, text):
    p = doc.add_paragraph(text)
    for r in p.runs:
        set_run_font(r)


def add_figure_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_before = Pt(6)
    set_run_font(p.add_run(text))


def add_table_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p.paragraph_format.first_line_indent = Cm(0)
    set_run_font(p.add_run(text), bold=True)


def add_table(doc, headers, rows):
    tbl = doc.add_table(rows=1 + len(rows), cols=len(headers))
    tbl.style = "Table Grid"
    for i, h in enumerate(headers):
        tbl.rows[0].cells[i].text = h
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            tbl.rows[ri + 1].cells[ci].text = val
    doc.add_paragraph()


def add_listing(doc, caption, code):
    add_table_caption(doc, caption)
    tbl = doc.add_table(rows=1, cols=1)
    tbl.style = "Table Grid"
    cp = tbl.rows[0].cells[0].paragraphs[0]
    cp.paragraph_format.first_line_indent = Cm(0)
    cp.paragraph_format.line_spacing = 1.0
    run = cp.add_run(code.strip())
    run.font.name = "Consolas"
    run.font.size = Pt(9)
    doc.add_paragraph()


def add_toc(doc):
    add_title(doc, "СОДЕРЖАНИЕ")
    entries = [
        "ВВЕДЕНИЕ",
        "ГЛАВА 1. АНАЛИТИЧЕСКАЯ ЧАСТЬ",
        "1.1. Предметная область и актуальность",
        "1.2. Роли пользователей и сценарии использования",
        "1.3. Функциональные и нефункциональные требования",
        "1.4. Сравнительный анализ аналогов",
        "1.5. Информационные сущности и связи",
        "1.6. Постановка задачи разработки",
        "ГЛАВА 2. ТЕХНОЛОГИЧЕСКАЯ ЧАСТЬ",
        "2.1. Архитектура и структура проекта",
        "2.2. Доменный слой и модель данных",
        "2.3. Слой бизнес-логики (use case)",
        "2.4. Слой доступа к данным",
        "2.5. REST API и сериализация JSON",
        "2.6. Клиентское приложение React",
        "2.7. Каталог, корзина и оформление заказа",
        "2.7.1. Описание экранных форм",
        "2.8. Панель продавца и отзывы",
        "2.9. Работа с изображениями товаров",
        "2.10. Развёртывание и тестирование",
        "ЗАКЛЮЧЕНИЕ",
        "СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ",
        "ПРИЛОЖЕНИЕ А",
        "ПРИЛОЖЕНИЕ Б",
    ]
    for e in entries:
        p = doc.add_paragraph(e)
        p.paragraph_format.first_line_indent = Cm(0)
        if e.isupper() and not e.startswith("1") and not e.startswith("2"):
            set_run_font(p.runs[0] if p.runs else p.add_run(e), bold=True)
        else:
            set_run_font(p.runs[0] if p.runs else p.add_run(e))
    doc.add_page_break()


def build():
    doc = Document()
    set_margins(doc)
    style_normal(doc)

    # Титульный лист
    for _ in range(2):
        doc.add_paragraph()
    for line in [
        "ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ",
        "МОСКОВСКИЙ ПОЛИТЕХНИЧЕСКИЙ УНИВЕРСИТЕТ",
        "ВЫСШАЯ ШКОЛА ПЕЧАТИ И МЕДИАИНДУСТРИИ",
        "Институт Принтмедиа и информационных технологий",
        "Кафедра Информатики и информационных технологий",
        "",
        "направление подготовки 09.03.02 «Информационные системы и технологии»",
        "",
        "КУРСОВОЙ ПРОЕКТ",
        "Дисциплина: Проектирование информационных систем",
        "",
        "Тема: Разработка веб-приложения интернет-магазина",
        "фермерской продукции «FarmMarket»",
        "",
        "Выполнил: студент группы _________  _________________________",
        "Проверил: _________________________  _________________________",
        "",
        "Москва, 2026",
    ]:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.first_line_indent = Cm(0)
        if line:
            set_run_font(p.add_run(line), bold=("КУРСОВОЙ" in line or "Тема:" in line))

    doc.add_page_break()
    add_toc(doc)

    # ========== ВВЕДЕНИЕ ==========
    add_title(doc, "ВВЕДЕНИЕ")
    for t in [
        "Цифровизация агропромышленного комплекса и розничной торговли продуктами питания "
        "привела к появлению специализированных онлайн-витрин, связывающих мелких производителей "
        "с городским потребителем. Покупатель ожидает удобный каталог с фильтрами, прозрачные "
        "сведения о происхождении товара, отзывы, расчёт доставки и оформление заказа без "
        "посредников. Для производителя важны учёт остатков, обработка заказов и коммуникация "
        "с клиентами в едином интерфейсе [1].",
        "Актуальность темы курсового проекта обусловлена необходимостью освоить полный цикл "
        "разработки информационной системы: от анализа предметной области до реализации "
        "клиент-серверного приложения с REST API, валидацией данных и разделением ответственности "
        "между слоями программы. Типовые ошибки учебных проектов — монолитный код в одном файле, "
        "отсутствие доменной модели, некорректная работа с JSON (поля null вместо пустых массивов), "
        "что приводит к сбоям интерфейса. Разработка «FarmMarket» направлена на демонстрацию "
        "инженерных практик, применимых в промышленной разработке [2].",
        "Цель работы — спроектировать и реализовать прототип веб-приложения интернет-магазина "
        "фермерской продукции с каталогом из 33 товаров и 10 производителей, поддержкой корзины, "
        "многошагового оформления заказа, промокодов, отзывов и панели продавца.",
        "Задачи курсового проекта:",
        "1) выполнить анализ предметной области и сформулировать требования к системе;",
        "2) разработать архитектуру по принципам Clean Architecture (domain, use case, repository, delivery);",
        "3) реализовать серверную часть на Go с REST API и персистентностью в JSON;",
        "4) реализовать клиентскую SPA на React с TypeScript, маршрутизацией и валидацией форм;",
        "5) обеспечить согласованность изображений товаров с наименованиями и сценарии локального запуска;",
        "6) провести функциональное тестирование основных пользовательских сценариев.",
        "Объект исследования — бизнес-процессы дистанционной торговли фермерской продукцией.",
        "Предмет исследования — методы проектирования и реализации веб-ориентированных информационных систем.",
        "Практическая значимость — готовый программный комплекс (исходный код, скрипты dev.cmd и "
        "run-local.ps1), пригодный для демонстрации на защите и дальнейшего расширения (СУБД, OAuth, платежи).",
        "Структура пояснительной записки: в первой главе приведён анализ предметной области и требований; "
        "во второй — описание реализации серверной и клиентской частей с листингами программного кода; "
        "в заключении — выводы; в приложениях — расширенные фрагменты кода.",
    ]:
        add_para(doc, t)

    doc.add_page_break()

    # ========== ГЛАВА 1 ==========
    add_title(doc, "ГЛАВА 1. АНАЛИТИЧЕСКАЯ ЧАСТЬ")

    add_subheading(doc, "1.1. Предметная область и актуальность")
    for t in [
        "Предметная область охватывает розничную продажу продуктов с фермерских хозяйств, "
        "пекарен, сыроварен, пасек и ремесленных мастерских. В отличие от универсального маркетплейса, "
        "здесь значимы сезонность, ограниченные партии, срок годности, экологические сертификаты (eco, organic), "
        "географическая близость производителя и история хозяйства (поле originStory в карточке товара).",
        "Типовой процесс покупки включает: просмотр витрины и фильтрацию; изучение карточки товара и отзывов; "
        "добавление позиций в корзину; применение промокода; ввод контактов и адреса; выбор доставки (курьер, "
        "самовывоз, ПВЗ) и оплаты; подтверждение заказа; отслеживание статуса в личном кабинете. "
        "Производитель параллельно обрабатывает заказы, меняет статусы (new → processing → shipped → delivered), "
        "ведёт каталог и переписку в чате (демо-реализация).",
        "На рисунке 1.1 схематично показаны участники: покупатель, продавец (производитель), "
        "веб-клиент (браузер), сервер API и файл хранения store.json. Стрелки обозначают потоки данных "
        "при запросе каталога и создании заказа. Диаграмму рекомендуется выполнить в draw.io или Visio "
        "и вставить под данной подписью при верстке итогового PDF.",
    ]:
        add_para(doc, t)
    add_figure_caption(doc, "Рисунок 1.1. Контекстная диаграмма системы FarmMarket")

    add_subheading(doc, "1.2. Роли пользователей и сценарии использования")
    for t in [
        "Выделены роли: гость (просмотр без оформления), покупатель (корзина, заказ, профиль buyer-1), "
        "продавец (панель /seller, заголовок X-Producer-Id). Сценарий UC-1 «Поиск товара»: пользователь "
        "открывает /catalog, задаёт строку search, категорию, диапазон цен, флаги eco/organic, сортировку "
        "popularity | price_asc | price_desc | newest; клиент формирует GET /api/products с query-параметрами.",
        "Сценарий UC-2 «Оформление заказа»: корзина в localStorage (Zustand persist); на /checkout пять шагов — "
        "контакты, адрес, доставка, оплата, подтверждение; POST /api/orders с телом JSON; сервер проверяет "
        "остатки, считает доставку по каждому уникальному producerId, применяет промокод FARM10 (−10%).",
        "Сценарий UC-3 «Управление заказом продавцом»: GET /api/seller/orders, PATCH статуса; UC-4 «Отзыв» — "
        "POST /api/reviews с оценкой 1–5 и текстом. Ошибки валидации возвращаются как domain.ErrValidation, "
        "отсутствие товара — ErrNotFound, превышение stock — ErrOutOfStock [3].",
    ]:
        add_para(doc, t)

    add_subheading(doc, "1.3. Функциональные и нефункциональные требования")
    add_para(doc, "Функциональные требования сведены в таблицу 1.1.")
    add_table_caption(doc, "Таблица 1.1. Матрица функций по ролям")
    add_table(doc, ["Код", "Роль", "Функция", "Реализация"], [
        ("F-01", "Все", "Каталог с пагинацией", "GET /api/products"),
        ("F-02", "Все", "Карточка и похожие товары", "GET /api/products/{id}, /similar"),
        ("F-03", "Покупатель", "Корзина", "Zustand + localStorage"),
        ("F-04", "Покупатель", "Оформление заказа", "POST /api/orders"),
        ("F-05", "Покупатель", "Промокод", "POST /api/promo/validate"),
        ("F-06", "Покупатель", "Профиль и заказы", "GET /api/profile, /api/orders"),
        ("F-07", "Покупатель", "Отзывы", "GET/POST /api/reviews"),
        ("F-08", "Продавец", "Список заказов", "GET /api/seller/orders"),
        ("F-09", "Продавец", "CRUD товаров", "POST/PUT /api/seller/products"),
        ("F-10", "Продавец", "Статистика и чат", "GET /api/seller/stats, /chat"),
    ])
    add_para(doc, "Категории товаров в системе приведены в таблице 1.2.")
    add_table_caption(doc, "Таблица 1.2. Категории каталога")
    add_table(doc, ["Код", "Наименование", "Примеры товаров"], [
        ("vegetables", "Овощи", "Помидоры, огурцы, капуста"),
        ("fruits", "Фрукты и ягоды", "Яблоки, клубника"),
        ("meat", "Мясо и яйца", "Курица, утка, яйца"),
        ("dairy", "Молочные", "Молоко, творог, ряженка"),
        ("bakery", "Выпечка", "Хлеб, круассаны, пирог"),
        ("honey", "Мёд", "Липовый, прополис"),
        ("jam", "Варенье", "Малина, смородина"),
        ("cheese", "Сыры", "Козий, брынза"),
        ("craft", "Рукоделие", "Корзина, горшок"),
    ])
    add_para(
        doc,
        "Нефункциональные требования: разделение клиента и сервера; время ответа API при демо-объёме "
        "до 2 с; кросс-браузерность; кодировка UTF-8; CORS для dev-режима; возможность замены memory-репозитория "
        "на PostgreSQL без изменения use case [4].",
    )

    add_subheading(doc, "1.4. Сравнительный анализ аналогов")
    for t in [
        "Крупные маркетплейсы (Ozon, Wildberries) обеспечивают масштаб и логистику, но не фокусируются "
        "на истории конкретного фермера. Узкие фермерские агрегаторы предлагают подписки и доставку «день в день». "
        "Учебный прототип FarmMarket сознательно ограничен по инфраструктуре (JSON вместо СУБД, заголовки вместо JWT), "
        "но воспроизводит полный UX: каталог → корзина → checkout → кабинет продавца. Преимущество для обучения — "
        "прозрачная архитектура и локальный запуск одной командой dev.cmd [5].",
    ]:
        add_para(doc, t)

    add_subheading(doc, "1.5. Информационные сущности и связи")
    add_para(
        doc,
        "Логическая модель данных включает сущности «Производитель», «Товар», «Заказ», «Строка заказа», "
        "«Отзыв», «Комментарий к отзыву», «Профиль покупателя», «Сообщение чата». Связи: один производитель — "
        "много товаров (1:N); один заказ — много строк (1:N); отзыв ссылается на product или producer. "
        "Денормализация в OrderLine (Name, Image) сохраняет снимок товара на момент покупки [8].",
    )
    add_table_caption(doc, "Таблица 1.3. Примеры записей демонстрационного каталога")
    add_table(doc, ["ID", "Наименование", "Категория", "Цена, ₽"], [
        ("p11", "Молоко 3.4% 1л", "dairy", "110"),
        ("p15", "Хлеб ржаной на закваске", "bakery", "180"),
        ("p18", "Мёд липовый 500г", "honey", "650"),
        ("p27", "Корзина плетёная S", "craft", "1850"),
        ("p32", "Пирог с капустой", "bakery", "340"),
    ])

    add_subheading(doc, "1.6. Постановка задачи разработки")
    for t in [
        "Требуется разработать двухкомпонентную систему: бинарный сервер farmmarket.exe (Go) и статический "
        "клиент (Vite dev server / build). Минимальный объём данных: 10 производителей (pr1–pr10), 33 товара "
        "(p1–p33), отзывы, два демо-заказа, профиль покупателя. Изображения — локальные JPEG в web/public/products. "
        "Интерфейс на русском языке, валюта RUB. Допускается демонстрация на http://127.0.0.1:5173 с проксированием /api на :8080.",
    ]:
        add_para(doc, t)

    doc.add_page_break()

    # ========== ГЛАВА 2 ==========
    add_title(doc, "ГЛАВА 2. ТЕХНОЛОГИЧЕСКАЯ ЧАСТЬ")

    add_subheading(doc, "2.1. Архитектура и структура проекта")
    for t in [
        "Проект организован в каталогах cmd (точки входа), internal (domain, usecase, repository, delivery), "
        "web (фронтенд), data (store.json), docs (документация). Зависимости сервера: go 1.22, github.com/go-chi/chi/v5. "
        "Клиент: react 18, typescript, vite 5, tailwindcss, zustand, zod, react-hook-form [6].",
        "Архитектура сервера — четыре слоя. Domain содержит чистые структуры и константы без импорта инфраструктуры. "
        "Usecase инкапсулирует правила: фильтрация каталога, создание заказа, валидация промо. Repository реализует "
        "интерфейсы ProductRepository, OrderRepository. Delivery/http преобразует HTTP в вызовы сервисов. "
        "Такое разделение соответствует рекомендациям «чистой архитектуры» Р. Мартина [7]. На рисунке 2.1 "
        "показана зависимость слоёв: HTTP → usecase → domain ← repository.",
    ]:
        add_para(doc, t)
    add_figure_caption(doc, "Рисунок 2.1. Слои серверного приложения FarmMarket")
    add_table_caption(doc, "Таблица 2.1. Структура каталогов проекта")
    add_table(doc, ["Путь", "Назначение"], [
        ("cmd/server", "main.go, запуск HTTP :8080"),
        ("cmd/fetchimages", "загрузка фото с Wikimedia"),
        ("internal/domain", "Product, Order, Producer, Review"),
        ("internal/usecase", "CatalogService, OrderService, …"),
        ("internal/repository/memory", "Store, seed, JSON persist"),
        ("internal/delivery/http", "router.go, handlers"),
        ("web/src/pages", "Home, Catalog, Product, Checkout, Seller"),
        ("web/public/products", "p1.jpg … p33.jpg"),
    ])
    add_listing(doc, "Листинг 2.1. Точка входа сервера (cmd/server/main.go)", L_MAIN)

    add_subheading(doc, "2.2. Доменный слой и модель данных")
    for t in [
        "Сущность Product описывает товар витрины: идентификатор, связь с ProducerID, категория, цена, остаток, "
        "срок годности (ExpiryDays), рейтинг, флаги eco/organic/featured/isNew, популярность для сортировки. "
        "Producer хранит координаты (Lat, Lng) для расчёта расстояния haversine при фильтре maxDistanceKm. "
        "Order агрегирует строки OrderLine, статус, контакты, адрес, способы доставки и оплаты, итоговую сумму.",
        "Фрагмент структуры Product приведён в листинге 2.2. Полный перечень полей — в файле internal/domain/product.go.",
    ]:
        add_para(doc, t)
    add_listing(doc, "Листинг 2.2. Фрагмент доменной модели Product", L_PRODUCT)
    add_table_caption(doc, "Таблица 2.2. Статусы заказа")
    add_table(doc, ["Статус", "Значение", "Описание"], [
        ("new", "OrderNew", "Создан покупателем"),
        ("processing", "OrderProcessing", "Принят продавцом"),
        ("shipped", "OrderShipped", "Передан в доставку"),
        ("delivered", "OrderDelivered", "Выполнен"),
        ("cancelled", "OrderCancelled", "Отменён"),
    ])

    add_subheading(doc, "2.3. Слой бизнес-логики (use case)")
    for t in [
        "CatalogService.ListProducts загружает все товары и производителей, применяет фильтры (поиск, категория, "
        "цена, город, рейтинг, eco, organic, расстояние), сортирует и разбивает на страницы (page, pageSize до 48). "
        "Листинг 2.3 демонстрирует фрагмент фильтрации и сортировки — ключевая логика каталога.",
        "OrderService.CreateOrder выполняет серверную валидацию: обязательные контакты, непустые строки заказа, "
        "проверка stock, расчёт subtotal, суммирование доставки по уникальным производителям, скидка по промокоду. "
        "Листинг 2.4 — упрощённый фрагмент CreateOrder.",
    ]:
        add_para(doc, t)
    add_listing(doc, "Листинг 2.3. Фильтрация и сортировка каталога (usecase/services.go)", L_CATALOG_FILTER)
    add_listing(doc, "Листинг 2.4. Создание заказа (usecase/services.go)", L_ORDER_UC)

    add_subheading(doc, "2.4. Слой доступа к данным")
    for t in [
        "Реализация memory.Store при старте читает data/store.json; при отсутствии файла вызывается buildSeed — "
        "заполнение 10 производителями и 33 товарами, отзывами, заказами. Мьютекс sync.RWMutex защищает конкурентный "
        "доступ. Метод persist сериализует snapshot с полем catalogVersion для миграции URL изображений. "
        "Листинг 2.5 показывает логику инициализации хранилища.",
    ]:
        add_para(doc, t)
    add_listing(doc, "Листинг 2.5. Инициализация Store (repository/memory/store.go)", L_STORE)

    add_subheading(doc, "2.5. REST API и сериализация JSON")
    for t in [
        "Маршрутизатор chi регистрирует endpoints (листинг 2.6). Middleware: RequestID, Logger, Recoverer, CORS. "
        "Функция jsonNormalize (листинг 2.7) решает проблему null в JSON для пустых срезов — на клиенте "
        "вызов .map() на null приводил к «белому экрану» каталога и карточки товара. После нормализации "
        "клиент дополнительно использует asArray в api.ts.",
    ]:
        add_para(doc, t)
    add_listing(doc, "Листинг 2.6. Основные маршруты API (router.go)", L_ROUTES)
    add_listing(doc, "Листинг 2.7. Нормализация JSON-ответов (router.go)", L_JSON_NORM)
    add_para(doc, "Полный перечень REST endpoints системы приведён в таблице 2.3.")
    add_table_caption(doc, "Таблица 2.3. REST API интернет-магазина FarmMarket")
    add_table(doc, ["Метод", "URL", "Назначение"], [
        ("GET", "/api/health", "Проверка доступности"),
        ("GET", "/api/categories", "Список категорий"),
        ("GET", "/api/products", "Каталог с фильтрами"),
        ("GET", "/api/products/{id}", "Карточка товара"),
        ("GET", "/api/products/{id}/similar", "Похожие товары"),
        ("GET", "/api/producers", "Производители"),
        ("POST", "/api/orders", "Создать заказ"),
        ("POST", "/api/promo/validate", "Проверить промокод"),
        ("GET", "/api/seller/orders", "Заказы продавца"),
        ("POST", "/api/seller/products", "Добавить товар"),
    ])

    add_subheading(doc, "2.6. Клиентское приложение React")
    add_para(
        doc,
        "Сборка выполняется Vite: hot module replacement ускоряет разработку интерфейса. "
        "TypeScript обеспечивает типизацию сущностей Product, Order, Producer в api.ts, "
        "согласованных с JSON-схемой сервера. Компоненты разбиты по принципу единственной ответственности: "
        "ProductCard (карточка в сетке), ProductModal (быстрый просмотр), Breadcrumbs (навигационная цепочка), "
        "Layout (общий каркас). Такое разделение упрощает сопровождение и повторное использование [14].",
    )
    for t in [
        "SPA построено на React Router 6. Корневой компонент App задаёт маршруты (листинг 2.8). Layout содержит "
        "шапку с навигацией, счётчик корзины, подвал. Стилизация — utility-классы Tailwind (цветовая схема «фермерская» "
        "кремовый фон, зелёные акценты).",
        "Модуль api.ts инкапсулирует fetch с таймаутом 12 с и понятными сообщениями об ошибке при недоступном API "
        "(листинг 2.9). Это критично для защиты проекта: проверяющий видит подсказку запустить dev.cmd.",
    ]:
        add_para(doc, t)
    add_listing(doc, "Листинг 2.8. Маршрутизация (web/src/App.tsx)", L_APP_TSX)
    add_listing(doc, "Листинг 2.9. Клиент API и защита от null (web/src/lib/api.ts)", L_API_TS)

    add_subheading(doc, "2.7. Каталог, корзина и оформление заказа")
    for t in [
        "Страница CatalogPage синхронизирует фильтры с URL (useSearchParams): search, category, sort, minPrice, "
        "maxPrice, eco, organic, геофильтр lat/lng/maxKm. При изменении фильтров вызывается api.products с pageSize=12, "
        "реализована подгрузка «Показать ещё». Компонент ProductCard отображает цену, рейтинг, бейджи Эко/Новинка; "
        "ProductThumb загружает /products/{id}.jpg?v=7 — локальные фото, игнорируя устаревшие URL из API.",
        "Корзина (листинг 2.10) сохраняется в localStorage под ключом farmmarket-cart. Метод add объединяет "
        "одинаковые productId и не превышает stock.",
        "CheckoutPage — пять шагов с отдельными схемами Zod (листинг 2.11). react-hook-form выводит ошибки под полями "
        "до отправки на сервер. После успешного POST /api/orders корзина очищается, показывается toast и редирект.",
        "На рисунке 2.2 рекомендуется разместить скриншот каталога с открытыми фильтрами; на рисунке 2.3 — "
        "форму оформления заказа (шаг «Контакты»). В тексте далее описан внешний вид без пустых заглушек: "
        "сетка карточек 3–4 в ряд, слева панель фильтров, в шапке — логотип FarmMarket и иконка корзины с числом позиций.",
    ]:
        add_para(doc, t)
    add_figure_caption(doc, "Рисунок 2.2. Страница каталога с фильтрами и карточками товаров")
    add_listing(doc, "Листинг 2.10. Хранилище корзины (web/src/store/cart.ts)", L_CART)
    add_figure_caption(doc, "Рисунок 2.3. Многошаговое оформление заказа")
    add_listing(doc, "Листинг 2.11. Валидация полей (web/src/pages/Checkout.tsx)", L_ZOD)

    add_subheading(doc, "2.7.1. Описание основных экранных форм")
    screens = [
        (
            "Главная страница (/)",
            "Содержит промо-блок с УТП «С фермы на стол», кнопку перехода в каталог, сетку избранных товаров "
            "(featured) и блок производителей с рейтингом и городом. Данные загружаются параллельными запросами "
            "api.products и api.producers. При недоступности API выводится предупреждение с текстом ошибки.",
        ),
        (
            "Карточка товара (/product/:id)",
            "Отображает название, цену в рублях, остаток, срок годности, происхождение (originStory), "
            "производителя со ссылкой на /producer/:id, кнопки «В корзину» и изменения количества. "
            "Блок «Похожие товары» заполняется endpoint /similar. Вкладка отзывов — список с рейтингом звёздами "
            "и форма отправки нового отзыва (POST).",
        ),
        (
            "Страница производителя (/producer/:id)",
            "Показывает обложку, аватар, описание, сертификаты, награды, координаты на карте (текстом), "
            "список всех товаров данного pr*. Позволяет подписаться на обновления (в профиле buyer).",
        ),
        (
            "Корзина (/cart)",
            "Таблица позиций: миниатюра, название, цена за единицу, счётчик qty, сумма строки, удаление. "
            "Внизу — промокод, итог, кнопка «Оформить». Пустая корзина показывает заглушку с ссылкой в каталог.",
        ),
        (
            "Личный кабинет (/account)",
            "Профиль Марии Ивановой: контакты, адреса доставки, избранные товары, подписки на производителей, "
            "настройки уведомлений, история заказов со статусами и суммами.",
        ),
    ]
    for name, desc in screens:
        add_para(doc, f"Экран «{name}». {desc}")

    add_subheading(doc, "2.8. Панель продавца и отзывы")
    for t in [
        "Страница SellerPage отображает заказы текущего производителя (фильтрация по X-Producer-Id: pr1), "
        "кнопки смены статуса, форму добавления товара (название, цена, категория, stock), блок статистики "
        "(выручка, количество заказов) и демо-чат. ProductPage показывает галерею, описание, originStory, "
        "блок похожих товаров (/similar), список отзывов и форму добавления отзыва.",
        "Отзывы связаны с target=product|producer; комментарии к отзыву — GET /api/reviews/{id}/comments. "
        "На рисунке 2.4 — скриншот панели продавца с таблицей заказов.",
    ]:
        add_para(doc, t)
    add_figure_caption(doc, "Рисунок 2.4. Панель продавца: заказы и смена статуса")

    add_subheading(doc, "2.9. Работа с изображениями товаров")
    for t in [
        "Каждому товару p1–p33 соответствует файл web/public/products/pN.jpg. catalogVersion=7 в URL "
        "сбрасывает кэш браузера. Утилита cmd/fetchimages загружает изображения с Wikimedia Commons по "
        "точным именам файлов File:… с резервными вариантами. ProductThumb использует только productId — "
        "исключает показ «чужих» картинок с Pexels. При ошибке загрузки — fallback на p1 (помидоры), не на битый файл.",
    ]:
        add_para(doc, t)

    add_subheading(doc, "2.10. Развёртывание и тестирование")
    for t in [
        "Локальный запуск: dev.cmd собирает farmmarket.exe, освобождает порты 8080/5173, стартует API и Vite. "
        "Переменные: DATA_DIR, PORT. Прокси Vite перенаправляет /api на localhost:8080.",
        "Сценарии тестирования (таблица 2.4): ручная проверка по чек-листу перед защитой.",
    ]:
        add_para(doc, t)
    add_table_caption(doc, "Таблица 2.4. Сценарии функционального тестирования")
    add_table(doc, ["№", "Действие", "Ожидаемый результат"], [
        ("1", "Открыть /catalog", "Отображается ≥12 карточек"),
        ("2", "Фильтр «Молочные»", "Только dairy"),
        ("3", "Добавить в корзину, /cart", "Сумма пересчитана"),
        ("4", "Checkout + промо FARM10", "Скидка 10%"),
        ("5", "POST заказ при qty>stock", "Ошибка остатка"),
        ("6", "/seller смена статуса", "Статус обновлён"),
        ("7", "Ctrl+F5 после смены фото", "Актуальные JPEG"),
    ])
    add_para(
        doc,
        "На рисунке 2.5 показан рекомендуемый вид главной страницы: блок героя, подборки «Популярное» и "
        "«Новинки», карточки производителей с рейтингом. Скриншот вставляется при финальной вёрстке PDF.",
    )
    add_figure_caption(doc, "Рисунок 2.5. Главная страница интернет-магазина FarmMarket")

    doc.add_page_break()

    # ========== ЗАКЛЮЧЕНИЕ ==========
    add_title(doc, "ЗАКЛЮЧЕНИЕ")
    for t in [
        "В курсовом проекте разработан прототип веб-приложения «FarmMarket» — интернет-магазина фермерской "
        "продукции. Выполнен анализ предметной области, определены роли и функциональные требования, "
        "реализована многослойная серверная архитектура на Go и клиентское SPA на React.",
        "Ключевые результаты: REST API с 20+ endpoints; каталог с фильтрами и геопоиском; корзина с персистентностью; "
        "многошаговое оформление с валидацией Zod; панель продавца; нормализация JSON; локальные изображения 33 товаров.",
        "Поставленная цель достигнута, задачи выполнены. Направления развития: PostgreSQL, JWT, платёжный шлюз, "
        "Docker, автотесты (go test, Playwright), CI/CD.",
    ]:
        add_para(doc, t)

    doc.add_page_break()

    # ========== ЛИТЕРАТУРА ==========
    add_title(doc, "СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ")
    refs = [
        "ГОСТ 7.0.100–2018. Библиографическая запись. Библиографическое описание. Общие требования и правила составления.",
        "Фаулер, М. Архитектура корпоративных программных приложений / М. Фаулер. — М.: Вильямс, 2019. — 544 с.",
        "Мартин, Р. Чистая архитектура. Искусство структуры и дизайна / Р. Мартин. — СПб.: Питер, 2018. — 352 с.",
        "Гниденко, И. Г. Технология разработки программного обеспечения / И. Г. Гниденко и др. — М.: Юрайт, 2017. — 235 с.",
        "Гордеев, С. И. Организация баз данных. Ч. 2 / С. И. Гордеев, В. Н. Волошина. — М.: Юрайт, 2019. — 501 с.",
        "Таненбаум, Э. Компьютерные сети / Э. Таненбаум, Д. Уэзеролл. — 5-е изд. — СПб.: Питер, 2012. — 960 с.",
        "Документация Go [Электронный ресурс]. — URL: https://go.dev/doc/ (дата обращения: 21.05.2026).",
        "Документация React [Электронный ресурс]. — URL: https://react.dev/ (дата обращения: 21.05.2026).",
        "Документация go-chi/chi v5 [Электронный ресурс]. — URL: https://github.com/go-chi/chi (дата обращения: 21.05.2026).",
        "Документация Vite [Электронный ресурс]. — URL: https://vite.dev/ (дата обращения: 21.05.2026).",
        "Документация Zod [Электронный ресурс]. — URL: https://zod.dev/ (дата обращения: 21.05.2026).",
        "Розен, К. RESTful Web API / К. Розен и др. — СПб.: Питер, 2020. — 400 с.",
        "Мегрезин, А. В. Web-программирование / А. В. Мегрезин. — М.: ИУИТ, 2018.",
        "Бэнкер, К. React и TypeScript. Сборник рецептов / К. Бэнкер. — СПб.: Питер, 2023. — 416 с.",
        "Документация Tailwind CSS [Электронный ресурс]. — URL: https://tailwindcss.com/docs (дата обращения: 21.05.2026).",
    ]
    for i, ref in enumerate(refs, 1):
        p = doc.add_paragraph(f"{i}. {ref}")
        p.paragraph_format.first_line_indent = Cm(0)
        for r in p.runs:
            set_run_font(r)

    doc.add_page_break()

    # ========== ПРИЛОЖЕНИЯ ==========
    add_title(doc, "ПРИЛОЖЕНИЕ А")
    add_subheading(doc, "Полный листинг точки входа сервера")
    with open("cmd/server/main.go", encoding="utf-8") as f:
        add_listing(doc, "Листинг А.1. cmd/server/main.go", f.read())

    add_title(doc, "ПРИЛОЖЕНИЕ Б")
    add_subheading(doc, "Фрагмент internal/delivery/http/router.go")
    try:
        with open("internal/delivery/http/router.go", encoding="utf-8") as f:
            router_src = f.read()
        # первые ~80 строк — маршруты и jsonNormalize
        lines = router_src.splitlines()[:95]
        add_listing(doc, "Листинг Б.1. router.go (фрагмент)", "\n".join(lines))
    except OSError:
        add_listing(doc, "Листинг Б.1", L_ROUTES)

    add_title(doc, "ПРИЛОЖЕНИЕ В")
    add_subheading(doc, "Скриншоты пользовательского интерфейса")
    for t in [
        "Рисунок В.1 — каталог /catalog с фильтрами.",
        "Рисунок В.2 — карточка товара /product/p11 (молоко).",
        "Рисунок В.3 — корзина /cart.",
        "Рисунок В.4 — панель продавца /seller.",
        "Скриншоты размещаются по одному на страницу с подписью; при объёме >50% страницы основного текста "
        "выносятся в приложение согласно методическим указаниям.",
    ]:
        add_para(doc, t)

    for section in doc.sections:
        add_page_number(section)

    doc.save(OUT)
    print("Saved:", OUT)


if __name__ == "__main__":
    import os
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    build()
