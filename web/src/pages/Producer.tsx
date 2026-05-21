import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Award, Leaf, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { api, type BuyerProfile, type Producer, type Product, type Review } from "../lib/api";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ProductCard } from "../components/ProductCard";
import { ProductThumb } from "../components/ProductThumb";
import { Button } from "../components/ProductCard";

export function ProducerPage() {
  const { id } = useParams();
  const [p, setP] = useState<Producer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profile, setProfile] = useState<BuyerProfile | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.producer(id), api.producerProducts(id), api.reviews("producer", id), api.profile().catch(() => null)]).then(
      ([prod, prods, revs, prof]) => {
        setP(prod);
        setProducts(prods);
        setReviews(revs);
        setProfile(prof);
      }
    );
  }, [id]);

  const subscribe = async () => {
    if (!p || !profile) {
      toast.message("Загрузите профиль с сервера (запустите API)");
      return;
    }
    const had = profile.subscribedProducerIds.includes(p.id);
    const nextIds = had ? profile.subscribedProducerIds.filter((x) => x !== p.id) : [...profile.subscribedProducerIds, p.id];
    const next = { ...profile, subscribedProducerIds: nextIds };
    await api.saveProfile(next);
    setProfile(next);
    toast.success(had ? "Вы отписались" : "Подписка на новинки оформлена");
  };

  if (!p) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        Производитель не найден.
      </div>
    );
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${p.lng - 0.02}%2C${p.lat - 0.02}%2C${p.lng + 0.02}%2C${p.lat + 0.02}&layer=mapnik&marker=${p.lat}%2C${p.lng}`;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Производители", to: "/catalog" }, { label: p.name }]} />
      <div className="relative h-48 w-full overflow-hidden md:h-64">
        <ProductThumb src={p.coverUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="-mt-16 flex flex-col gap-4 md:flex-row md:items-end">
          <ProductThumb
            src={p.avatarUrl}
            alt=""
            className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-lg md:h-32 md:w-32"
          />
          <div className="flex-1 text-white md:text-soil">
            <h1 className="font-display text-3xl font-bold md:text-moss-dark">{p.name}</h1>
            <p className="mt-1 text-sm md:text-soil/70">
              {p.specialty} · {p.city}, {p.region}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-wheat text-wheat" aria-hidden />
              {Number(p.rating).toFixed(1)} ({p.reviewCount} отзывов)
            </div>
          </div>
          <Button type="button" variant="outline" className="bg-white" onClick={subscribe}>
            Подписаться на новинки
          </Button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-cream-dark/40 bg-white p-5 shadow-sm">
              <h2 className="font-display text-xl font-semibold">О производителе</h2>
              <p className="mt-2 text-sm text-soil/80">{p.description}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-moss">История</h3>
                  <p className="mt-1 text-sm text-soil/75">{p.story}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-moss">Философия</h3>
                  <p className="mt-1 text-sm text-soil/75">{p.philosophy}</p>
                </div>
              </div>
            </section>
            <section>
              <h2 className="font-display text-xl font-semibold">Товары</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {products.map((x) => (
                  <ProductCard key={x.id} p={x} producerName={p.name} />
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-display text-xl font-semibold">Отзывы</h2>
              <ul className="mt-3 space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-cream-dark/40 bg-white p-3 text-sm">
                    <span className="font-medium">{r.authorName}</span> · {r.rating}★ — {r.text}
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-moss" aria-hidden />
                На карте
              </h3>
              <iframe title="Карта" src={mapUrl} className="mt-3 h-48 w-full rounded-xl border-0" loading="lazy" />
              <a
                className="mt-2 inline-block text-xs text-moss hover:underline"
                href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Открыть в Google Maps
              </a>
            </div>
            <div className="rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold">
                <Leaf className="h-4 w-4 text-moss" aria-hidden />
                Сертификаты
              </h3>
              <ul className="mt-2 list-inside list-disc text-sm text-soil/80">
                {p.certificates.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold">
                <Award className="h-4 w-4 text-moss" aria-hidden />
                Награды
              </h3>
              {p.awards.length === 0 ? (
                <p className="mt-2 text-sm text-soil/60">Пока без наград — но клиенты довольны.</p>
              ) : (
                <ul className="mt-2 list-inside list-disc text-sm">
                  {p.awards.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-soil/50">Основано в {p.foundedYear}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
