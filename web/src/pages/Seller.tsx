import { useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Button } from "../components/ProductCard";
import { api, type ChatMessage, type ProducerOrderView, type SalesStats } from "../lib/api";
import { PRODUCT_IMAGES } from "../lib/productImages";

const demoProducer = "pr1";

export function SellerPage() {
  const [orders, setOrders] = useState<ProducerOrderView[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [tab, setTab] = useState<"orders" | "stats" | "chat" | "product">("orders");
  const [productJson, setProductJson] = useState(
    JSON.stringify(
      {
        name: "Новый товар",
        slug: "novyj-tovar",
        description: "Описание",
        category: "vegetables",
        price: 199,
        currency: "RUB",
        images: [PRODUCT_IMAGES.p1],
        stock: 10,
        rating: 5,
        reviewCount: 0,
        eco: true,
        organic: false,
        featured: false,
        isNew: true,
        popularity: 10,
        originStory: "Собрано на нашей ферме.",
      },
      null,
      2
    )
  );

  const refresh = () => {
    Promise.all([api.sellerOrders(demoProducer), api.sellerStats(demoProducer), api.sellerChat(demoProducer)]).then(([o, s, c]) => {
      setOrders(o);
      setStats(s);
      setChat(c);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const maxRev = useMemo(() => Math.max(1, ...(stats?.monthlyRevenue.map((m) => m.revenue) || [1])), [stats]);

  const updateStatus = async (orderId: string, status: string) => {
    await fetch("/api/orders/" + encodeURIComponent(orderId) + "/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: "Панель производителя" }]} />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <h1 className="font-display text-3xl font-bold text-moss-dark">Панель производителя</h1>
        <p className="mt-1 text-sm text-soil/70">Демо: заголовок X-Producer-Id по умолчанию — {demoProducer} (Зелёный луг)</p>
        <div className="mt-6 flex flex-wrap gap-2 border-b border-cream-dark/50 pb-3" role="tablist" aria-label="Разделы">
          {(
            [
              ["orders", "Заказы"],
              ["stats", "Статистика"],
              ["chat", "Чат"],
              ["product", "Товар"],
            ] as const
          ).map(([k, lab]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={
                "rounded-full px-4 py-2 text-sm font-medium " + (tab === k ? "bg-moss text-white" : "bg-cream-dark/40")
              }
              onClick={() => setTab(k)}
            >
              {lab}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">Заказы</caption>
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-2">Заказ</th>
                  <th className="py-2 pr-2">Покупатель</th>
                  <th className="py-2 pr-2">Статус</th>
                  <th className="py-2 pr-2">Сумма</th>
                  <th className="py-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderId} className="border-b border-cream-dark/40">
                    <td className="py-2 pr-2 font-mono text-xs">{o.orderId}</td>
                    <td className="py-2 pr-2">{o.buyerName}</td>
                    <td className="py-2 pr-2">{o.status}</td>
                    <td className="py-2 pr-2">{Math.round(o.total)} ₽</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button type="button" variant="outline" className="px-2 py-1 text-xs" onClick={() => updateStatus(o.orderId, "processing")}>
                          В работу
                        </Button>
                        <Button type="button" variant="outline" className="px-2 py-1 text-xs" onClick={() => updateStatus(o.orderId, "delivered")}>
                          Доставлено
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "stats" && stats && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm">
              <p className="text-sm text-soil/60">Выручка (все заказы с вашими позициями)</p>
              <p className="mt-1 text-3xl font-bold text-moss-dark">{Math.round(stats.totalRevenue)} ₽</p>
              <p className="mt-2 text-sm">Заказов: {stats.ordersCount}</p>
            </div>
            <div className="rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm">
              <p className="font-semibold">Топ товаров</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                {stats.topProducts.map((t) => (
                  <li key={t.productId}>
                    {t.name} — {t.units} шт., {Math.round(t.revenue)} ₽
                  </li>
                ))}
              </ol>
            </div>
            <div className="md:col-span-2 rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm">
              <p className="font-semibold">Выручка по месяцам</p>
              <div className="mt-4 flex h-40 items-end gap-2">
                {stats.monthlyRevenue.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-moss/80 transition-all hover:bg-moss"
                      style={{ height: `${(m.revenue / maxRev) * 100}%`, minHeight: m.revenue > 0 ? "8px" : "0" }}
                      title={m.month + ": " + Math.round(m.revenue)}
                    />
                    <span className="text-[10px] text-soil/60">{m.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "chat" && (
          <ul className="mt-6 space-y-2 rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm">
            {chat.map((m) => (
              <li key={m.id} className={"rounded-lg p-3 text-sm " + (m.fromBuyer ? "bg-cream" : "bg-moss/10")}>
                <span className="font-medium">{m.author}</span> — {m.text}
                <span className="ml-2 text-xs text-soil/50">{m.createdAt}</span>
              </li>
            ))}
          </ul>
        )}

        {tab === "product" && (
          <div className="mt-6 space-y-3">
            <label className="text-sm font-medium">JSON товара (поля как на бэкенде)</label>
            <textarea
              className="h-64 w-full rounded-xl border p-3 font-mono text-xs"
              value={productJson}
              onChange={(e) => setProductJson(e.target.value)}
            />
            <Button
              type="button"
              onClick={async () => {
                try {
                  const obj = JSON.parse(productJson);
                  await api.upsertProduct(demoProducer, obj, "POST");
                  alert("Сохранено");
                } catch {
                  alert("Ошибка JSON или сети");
                }
              }}
            >
              Добавить товар
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
