import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, Loader2, MapPin, Share2, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { api, type Producer, type Product, type Review } from "../lib/api";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Button } from "../components/ProductCard";
import { ProductCard } from "../components/ProductCard";
import { ProductThumb } from "../components/ProductThumb";
import { categoryLabelRu } from "../types";
import { useCart } from "../store/cart";
import { useFavorites } from "../store/favorites";

export function ProductPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [p, setP] = useState<Product | null>(null);
  const [pr, setPr] = useState<Producer | null>(null);
  const [sim, setSim] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const { toggle, has } = useFavorites();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setP(null);
    setPr(null);
    setSim([]);
    setReviews([]);

    api
      .product(id)
      .then(async (prod) => {
        if (cancelled) return;
        setP(prod);
        setImg(0);
        setQty(Math.min(1, Math.max(1, prod.stock || 1)));

        const [producerRes, similarRes, revsRes] = await Promise.allSettled([
          api.producer(prod.producerId),
          api.similar(prod.id),
          api.reviews("product", prod.id),
        ]);
        if (cancelled) return;
        if (producerRes.status === "fulfilled") setPr(producerRes.value);
        else console.warn("producer", producerRes.reason);
        if (similarRes.status === "fulfilled") setSim(Array.isArray(similarRes.value) ? similarRes.value : []);
        else console.warn("similar", similarRes.reason);
        if (revsRes.status === "fulfilled") setReviews(Array.isArray(revsRes.value) ? revsRes.value : []);
        else console.warn("reviews", revsRes.reason);
      })
      .catch((e) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Не удалось загрузить товар";
          console.warn("product", e);
          setLoadError(msg);
          setP(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 py-24 text-soil/70">
        <Loader2 className="h-10 w-10 animate-spin text-moss" aria-hidden />
        <p>Загрузка товара…</p>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="font-medium text-soil">{loadError || "Товар не найден."}</p>
        <p className="mt-2 text-sm text-soil/60">
          Запустите <code className="rounded bg-cream px-1">dev.cmd</code> в папке проекта и откройте{" "}
          <a href="http://127.0.0.1:5173" className="text-moss underline">
            http://127.0.0.1:5173
          </a>
          .
        </p>
        <Link to="/catalog" className="mt-4 inline-block text-moss underline">
          В каталог
        </Link>
      </div>
    );
  }

  const mainSrc = p.images?.[img] ?? p.images?.[0];
  const thumbId = p.id;
  const rating = Number(p.rating) || 0;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, text: p.description, url });
        toast.success("Поделились");
      } catch {
        /* ignore */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: "Каталог", to: "/catalog" }, { label: p.name }]} />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-2xl border border-cream-dark/40 bg-white shadow-sm">
              <ProductThumb productId={thumbId} src={mainSrc} alt={p.name} className="aspect-square w-full object-cover" />
            </div>
            {(p.images?.length ?? 0) > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="Галерея">
                {p.images!.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    role="tab"
                    aria-selected={i === img}
                    className={
                      "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 " + (i === img ? "border-moss" : "border-transparent")
                    }
                    onClick={() => setImg(i)}
                  >
                    <ProductThumb productId={thumbId} src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-soil/60">{categoryLabelRu(p.category)}</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-moss-dark">{p.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-wheat text-wheat" aria-hidden />
                {rating.toFixed(1)} ({p.reviewCount ?? 0})
              </span>
              {p.organic && <span className="rounded-full bg-moss/10 px-2 py-0.5 text-xs text-moss">Органик</span>}
            </div>
            <p className="mt-4 text-soil/80">{p.description}</p>
            <div className="mt-4 rounded-xl bg-cream p-4 text-sm">
              <p className="font-semibold text-moss-dark">От фермы до стола</p>
              <p className="mt-1 text-soil/80">{p.originStory}</p>
            </div>
            {p.expiryDays != null && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-soil/70">
                <Truck className="h-4 w-4" aria-hidden />
                Рекомендуем съесть за {p.expiryDays} дн.
              </p>
            )}
            <p className="mt-6 text-3xl font-bold text-moss-dark">
              {Math.round(p.price)} ₽ <span className="text-base font-normal text-soil/60">/ упаковка</span>
            </p>
            <p className="text-sm text-soil/70">В наличии: {p.stock} шт.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor="qty">
                Количество
              </label>
              <input
                id="qty"
                type="number"
                min={1}
                max={Math.max(1, p.stock)}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(p.stock, Number(e.target.value) || 1)))}
                className="w-20 rounded-lg border px-2 py-2 text-center text-sm"
              />
              <Button
                type="button"
                onClick={() => {
                  add(p, qty);
                  toast.success("Добавлено в корзину");
                }}
              >
                В корзину
              </Button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-cream-dark/60 px-4 py-2 text-sm font-medium hover:border-moss"
                onClick={() => {
                  toggle(p.id);
                  toast.message(has(p.id) ? "Убрано из избранного" : "В избранном");
                }}
                aria-pressed={has(p.id)}
              >
                <Heart className={"h-4 w-4 " + (has(p.id) ? "fill-red-500 text-red-500" : "")} aria-hidden />
                Избранное
              </button>
              <button type="button" className="inline-flex items-center gap-2 text-sm text-moss hover:underline" onClick={share}>
                <Share2 className="h-4 w-4" aria-hidden />
                Поделиться
              </button>
            </div>
            {pr && (
              <div className="mt-8 rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <ProductThumb src={pr.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                  <div>
                    <Link to={"/producer/" + pr.id} className="font-semibold text-moss hover:underline">
                      {pr.name}
                    </Link>
                    <p className="text-xs text-soil/60">
                      {pr.specialty} ·{" "}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {pr.city}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-3 text-sm text-soil/75">{pr.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="mt-14" aria-labelledby="reviews-title">
          <h2 id="reviews-title" className="font-display text-2xl font-semibold text-moss-dark">
            Отзывы
          </h2>
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-cream-dark/40 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{r.authorName}</p>
                  <span className="text-sm text-wheat">{r.rating} ★</span>
                </div>
                <p className="mt-2 text-sm text-soil/80">{r.text}</p>
                {r.photoUrl && <ProductThumb src={r.photoUrl} alt="" className="mt-2 max-h-48 rounded-lg object-cover" />}
                <p className="mt-2 text-xs text-soil/50">Лайков: {r.likes}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14" aria-labelledby="sim-title">
          <h2 id="sim-title" className="font-display text-2xl font-semibold text-moss-dark">
            Похожие товары
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sim.map((x) => (
              <ProductCard key={x.id} p={x} producerName={pr?.name} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
