import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type BuyerProfile, type Order, type Product } from "../lib/api";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ProductCard } from "../components/ProductCard";
import { useFavorites } from "../store/favorites";

const statusLabel: Record<string, string> = {
  new: "Новый",
  processing: "В обработке",
  shipped: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export function AccountPage() {
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favProducts, setFavProducts] = useState<Product[]>([]);
  const { ids: localFav } = useFavorites();

  useEffect(() => {
    Promise.all([api.profile(), api.orders("buyer-1")]).then(([p, o]) => {
      setProfile(p);
      setOrders(o);
    });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const merged = Array.from(new Set([...profile.favoriteProductIds, ...localFav]));
    Promise.all(merged.map((id) => api.product(id).catch(() => null))).then((list) => {
      setFavProducts(list.filter(Boolean) as Product[]);
    });
  }, [profile, localFav]);

  const saveNotif = async (patch: Partial<BuyerProfile["notifications"]>) => {
    if (!profile) return;
    const next = { ...profile, notifications: { ...profile.notifications, ...patch } };
    await api.saveProfile(next);
    setProfile(next);
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: "Личный кабинет" }]} />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <h1 className="font-display text-3xl font-bold text-moss-dark">Кабинет покупателя</h1>
        {profile && (
          <p className="mt-2 text-sm text-soil/70">
            {profile.name} · {profile.email}
          </p>
        )}

        <section className="mt-10" aria-labelledby="orders-h">
          <h2 id="orders-h" className="font-display text-xl font-semibold">
            История заказов
          </h2>
          <ul className="mt-4 space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="rounded-xl border border-cream-dark/40 bg-white p-4 text-sm shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-soil/60">{o.id}</span>
                  <span className="rounded-full bg-moss/10 px-2 py-0.5 text-xs font-medium text-moss">
                    {statusLabel[o.status] || o.status}
                  </span>
                </div>
                <p className="mt-2 text-soil/80">
                  {o.lines.map((l) => l.name + " ×" + l.qty).join(", ")} — <strong>{Math.round(o.total)} ₽</strong>
                </p>
                <p className="mt-1 text-xs text-soil/50">{new Date(o.createdAt).toLocaleString("ru-RU")}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="fav-h">
          <h2 id="fav-h" className="font-display text-xl font-semibold">
            Избранное
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        {profile && (
          <section className="mt-10" aria-labelledby="subs-h">
            <h2 id="subs-h" className="font-display text-xl font-semibold">
              Подписки на производителей
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {profile.subscribedProducerIds.map((id) => (
                <li key={id}>
                  <Link className="rounded-full bg-white px-3 py-1 shadow ring-1 ring-cream-dark/50 hover:ring-moss/40" to={"/producer/" + id}>
                    {id}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile && (
          <section className="mt-10" aria-labelledby="addr-h">
            <h2 id="addr-h" className="font-display text-xl font-semibold">
              Сохранённые адреса
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {profile.addresses.map((a) => (
                <li key={a.id} className="rounded-lg border border-cream-dark/40 bg-white p-3">
                  <strong>{a.label}</strong> — {a.line}, {a.city}, {a.postalCode}
                  {a.isDefault && <span className="ml-2 text-xs text-moss">по умолчанию</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile && (
          <section className="mt-10" aria-labelledby="notif-h">
            <h2 id="notif-h" className="font-display text-xl font-semibold">
              Уведомления
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              {(
                [
                  ["emailOrders", "Email о заказах"],
                  ["pushPromo", "Пуш акции"],
                  ["smsDelivery", "SMS доставки"],
                  ["newFromSubs", "Новинки подписок"],
                ] as const
              ).map(([k, lab]) => (
                <label key={k} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.notifications[k]}
                    onChange={(e) => saveNotif({ [k]: e.target.checked })}
                  />
                  {lab}
                </label>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
