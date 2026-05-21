import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, Quote, Star } from "lucide-react";
import { api, type Producer, type Product } from "../lib/api";
import { ProductCard } from "../components/ProductCard";
import { ProductModal } from "../components/ProductModal";

const testimonials = [
  { name: "Мария", text: "Наконец-то честные помидоры — как с дачи у бабушки.", rating: 5 },
  { name: "Игорь", text: "Заказываю мёд и хлеб одним маршрутом, экономлю на доставке.", rating: 5 },
  { name: "Алина", text: "Понятно, кто произвёл и где. Для семьи это важно.", rating: 4 },
];

export function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [qv, setQv] = useState<Product | null>(null);

  useEffect(() => {
    Promise.all([api.products({ pageSize: 24, sort: "newest" }), api.producers()])
      .then(([pr, prod]) => {
        setFeatured(pr.items.filter((x) => x.featured || x.isNew).slice(0, 8));
        setProducers(prod);
      })
      .catch(() => {
        setFeatured([]);
        setProducers([]);
      });
  }, []);

  const bySpec = useMemo(() => {
    const m = new Map<string, Producer[]>();
    producers.forEach((p) => {
      const k = p.specialty;
      m.set(k, [...(m.get(k) || []), p]);
    });
    return Array.from(m.entries()).slice(0, 6);
  }, [producers]);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-moss/15 via-cream to-wheat/25">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-moss-dark md:text-5xl">
              Прямые продажи от местных производителей
            </h1>
            <p className="mt-4 text-base text-soil/80 md:text-lg">
              Без посредников: фермеры, пекари, сыровары и ремесленники — на одной витрине. Эко-фильтры, рейтинги и
              прозрачное происхождение.
            </p>
            <form
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const q = String(fd.get("q") || "");
                window.location.href = "/catalog?search=" + encodeURIComponent(q);
              }}
            >
              <label className="sr-only" htmlFor="hero-q">
                Поиск по каталогу
              </label>
              <input
                id="hero-q"
                name="q"
                placeholder="Например: липовый мёд, сыр козий…"
                className="w-full flex-1 rounded-full border border-cream-dark/50 bg-white px-5 py-3 text-sm shadow-sm outline-none ring-moss/30 focus:ring-2"
              />
              <button type="submit" className="rounded-full bg-moss px-6 py-3 text-sm font-semibold text-white shadow hover:bg-moss-dark">
                Найти
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2" aria-label="Быстрые категории">
              {["vegetables", "dairy", "bakery", "honey", "cheese"].map((c) => (
                <Link
                  key={c}
                  to={"/catalog?category=" + c}
                  className="rounded-full border border-moss/25 bg-white/80 px-3 py-1 text-xs font-medium text-moss-dark hover:border-moss"
                >
                  {c === "vegetables" && "Овощи"}
                  {c === "dairy" && "Молочные"}
                  {c === "bakery" && "Выпечка"}
                  {c === "honey" && "Мёд"}
                  {c === "cheese" && "Сыры"}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-moss-dark">Избранное и новинки</h2>
            <p className="text-sm text-soil/70">Подборка сезонных позиций</p>
          </div>
          <Link to="/catalog" className="text-sm font-medium text-moss hover:underline">
            Весь каталог
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => {
            const pr = producers.find((x) => x.id === p.producerId);
            return <ProductCard key={p.id} p={p} producerName={pr?.name} onQuick={setQv} />;
          })}
        </div>
      </section>

      <section className="bg-cream-dark/30 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-semibold text-moss-dark">Категории производителей</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bySpec.map(([spec, list]) => (
              <div key={spec} className="rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-moss" aria-hidden />
                  <h3 className="font-semibold">{spec}</h3>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {list.slice(0, 4).map((p) => (
                    <li key={p.id}>
                      <Link className="text-moss hover:underline" to={"/producer/" + p.id}>
                        {p.name} · {p.city}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl font-semibold text-moss-dark">Почему прямые продажи</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            { t: "Честная цена", d: "Производитель получает больше, вы платите меньше посреднику." },
            { t: "Прозрачность", d: "Происхождение, сроки и сертификаты — на карточке товара." },
            { t: "Свежесть", d: "Короткая цепочка поставки — особенно для молока, выпечки и зелени." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-cream-dark/40 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-moss-dark">{x.t}</h3>
              <p className="mt-2 text-sm text-soil/75">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-cream-dark/40 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl font-semibold text-moss-dark">Отзывы покупателей</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl bg-cream p-5">
                <Quote className="h-6 w-6 text-wheat" aria-hidden />
                <p className="mt-3 text-sm text-soil/85">{t.text}</p>
                <figcaption className="mt-4 flex items-center gap-2 text-sm font-medium">
                  {t.name}
                  <span className="inline-flex items-center gap-0.5 text-wheat">
                    <Star className="h-4 w-4 fill-current" aria-hidden />
                    {t.rating}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {qv && <ProductModal p={qv} onClose={() => setQv(null)} />}
    </div>
  );
}
