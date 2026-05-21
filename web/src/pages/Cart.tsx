import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, type Producer } from "../lib/api";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Button } from "../components/ProductCard";
import { ProductThumb } from "../components/ProductThumb";
import { useCart } from "../store/cart";

export function CartPage() {
  const { lines, setQty, remove, clear } = useCart();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [promo, setPromo] = useState("");
  const [discountPct, setDiscountPct] = useState(0);

  useEffect(() => {
    api.producers().then(setProducers);
  }, []);

  const prodMap = useMemo(() => Object.fromEntries(producers.map((p) => [p.id, p])), [producers]);

  const byProducer = useMemo(() => {
    const m = new Map<string, typeof lines>();
    lines.forEach((l) => {
      m.set(l.producerId, [...(m.get(l.producerId) || []), l]);
    });
    return Array.from(m.entries());
  }, [lines]);

  const subtotal = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const delivery = byProducer.reduce((a, [pid]) => a + (prodMap[pid]?.deliveryBase ?? 0), 0);
  const discount = subtotal * (discountPct / 100);
  const total = subtotal + delivery - discount;

  const applyPromo = async () => {
    try {
      const r = await api.validatePromo(promo);
      setDiscountPct(r.discountPercent);
      toast.success("Промокод применён: −" + r.discountPercent + "%");
    } catch {
      toast.error("Промокод не найден");
      setDiscountPct(0);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: "Корзина" }]} />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <h1 className="font-display text-3xl font-bold text-moss-dark">Корзина</h1>
        {lines.length === 0 ? (
          <p className="mt-6 text-soil/70">
            Пока пусто.{" "}
            <Link to="/catalog" className="text-moss underline">
              Перейти в каталог
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {byProducer.map(([pid, ls]) => (
                <section key={pid} className="rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm" aria-labelledby={"prod-" + pid}>
                  <h2 id={"prod-" + pid} className="font-semibold text-moss-dark">
                    {prodMap[pid]?.name || "Производитель"} · доставка от {Math.round(prodMap[pid]?.deliveryBase ?? 0)} ₽
                  </h2>
                  <ul className="mt-3 divide-y divide-cream-dark/50">
                    {ls.map((l) => (
                      <li key={l.productId} className="flex flex-wrap gap-3 py-3">
                        <ProductThumb src={l.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <Link to={"/product/" + l.productId} className="font-medium hover:text-moss">
                            {l.name}
                          </Link>
                          <p className="text-sm text-soil/60">{Math.round(l.unitPrice)} ₽ / шт.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="sr-only" htmlFor={"q-" + l.productId}>
                            Количество
                          </label>
                          <input
                            id={"q-" + l.productId}
                            type="number"
                            min={1}
                            className="w-16 rounded border px-2 py-1 text-sm"
                            value={l.qty}
                            onChange={(e) => setQty(l.productId, Number(e.target.value) || 1)}
                          />
                          <button
                            type="button"
                            className="tap-target rounded-full p-2 text-red-600 hover:bg-red-50"
                            aria-label="Удалить"
                            onClick={() => remove(l.productId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="w-full text-right text-sm font-semibold sm:w-auto">{Math.round(l.unitPrice * l.qty)} ₽</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              <button type="button" className="text-sm text-red-700 underline" onClick={() => clear()}>
                Очистить корзину
              </button>
            </div>
            <aside className="h-fit space-y-4 rounded-2xl border border-cream-dark/40 bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold">Итого</h2>
              <div className="flex gap-2">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Промокод"
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                />
                <Button type="button" variant="outline" onClick={applyPromo}>
                  ОК
                </Button>
              </div>
              <p className="text-sm">
                Товары: <span className="float-right font-medium">{Math.round(subtotal)} ₽</span>
              </p>
              <p className="text-sm">
                Доставка (по производителям): <span className="float-right font-medium">{Math.round(delivery)} ₽</span>
              </p>
              {discountPct > 0 && (
                <p className="text-sm text-moss">
                  Скидка {discountPct}%: <span className="float-right font-medium">−{Math.round(discount)} ₽</span>
                </p>
              )}
              <p className="border-t pt-2 text-lg font-bold">
                Всего: <span className="float-right text-moss-dark">{Math.round(total)} ₽</span>
              </p>
              <Link to="/checkout" state={{ promo, discountPct }} className="block">
                <Button type="button" className="w-full">
                  Оформить заказ
                </Button>
              </Link>
              <p className="text-xs text-soil/60">Промокоды для теста: FARM10, ECO15, DIRECT5</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
