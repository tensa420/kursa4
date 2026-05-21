import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, type Producer, type Product } from "../lib/api";
import type { ProductCategory } from "../types";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { ProductCard } from "../components/ProductCard";
import { ProductModal } from "../components/ProductModal";
import { Button } from "../components/ProductCard";

export function CatalogPage() {
  const [sp, setSp] = useSearchParams();
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [qv, setQv] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const filters = useMemo(() => {
    const city = sp.get("city") || "";
    const search = sp.get("search") || "";
    const category = (sp.get("category") || "") as ProductCategory | "";
    const sort = sp.get("sort") || "popularity";
    const minPrice = sp.get("minPrice");
    const maxPrice = sp.get("maxPrice");
    const minRating = sp.get("minRating");
    const eco = sp.get("eco");
    const organic = sp.get("organic");
    const userLat = sp.get("lat");
    const userLng = sp.get("lng");
    const maxDistanceKm = sp.get("maxKm");
    return {
      city,
      search,
      category,
      sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      eco: eco === "1" ? true : undefined,
      organic: organic === "1" ? true : undefined,
      userLat: userLat ? Number(userLat) : undefined,
      userLng: userLng ? Number(userLng) : undefined,
      maxDistanceKm: maxDistanceKm ? Number(maxDistanceKm) : undefined,
    };
  }, [sp]);

  const load = useCallback(
    async (p: number, append: boolean) => {
      setLoading(true);
      setLoadError(null);
      try {
        const r = await api.products({
          page: p,
          pageSize: 12,
          search: filters.search || undefined,
          category: filters.category || undefined,
          city: filters.city || undefined,
          sort: filters.sort,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          minRating: filters.minRating,
          eco: filters.eco,
          organic: filters.organic,
          userLat: filters.userLat,
          userLng: filters.userLng,
          maxDistanceKm: filters.maxDistanceKm,
        });
        const list = Array.isArray(r.items) ? r.items : [];
        setTotal(r.total ?? 0);
        setItems((prev) => (append ? [...prev, ...list] : list));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Не удалось загрузить каталог";
        setLoadError(msg);
        if (!append) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    setPage(1);
    load(1, false);
  }, [load]);

  useEffect(() => {
    api.producers().then(setProducers);
  }, []);

  const cities = useMemo(() => Array.from(new Set(producers.map((p) => p.city))).sort(), [producers]);

  const setFilter = (key: string, value: string | null) => {
    const n = new URLSearchParams(sp);
    if (value == null || value === "") n.delete(key);
    else n.set(key, value);
    setSp(n);
  };

  const nameById = useMemo(() => Object.fromEntries(producers.map((p) => [p.id, p.name])), [producers]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Каталог" }]} />
      <div className="mx-auto max-w-6xl px-4 pb-14">
        <h1 className="font-display text-3xl font-bold text-moss-dark">Каталог</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit space-y-4 rounded-2xl border border-cream-dark/40 bg-white p-4 shadow-sm" aria-label="Фильтры">
            <div>
              <label className="text-xs font-semibold uppercase text-soil/60">Категория</label>
              <select
                className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                value={filters.category}
                onChange={(e) => setFilter("category", e.target.value || null)}
              >
                <option value="">Все</option>
                {["vegetables", "fruits", "meat", "dairy", "bakery", "honey", "jam", "cheese", "craft"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-soil/60">Город производителя</label>
              <select
                className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                value={filters.city}
                onChange={(e) => setFilter("city", e.target.value || null)}
              >
                <option value="">Все</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold uppercase text-soil/60">Цена от</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                  defaultValue={sp.get("minPrice") || ""}
                  onBlur={(e) => setFilter("minPrice", e.target.value || null)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-soil/60">до</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                  defaultValue={sp.get("maxPrice") || ""}
                  onBlur={(e) => setFilter("maxPrice", e.target.value || null)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-soil/60">Мин. рейтинг</label>
              <select
                className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                value={sp.get("minRating") || ""}
                onChange={(e) => setFilter("minRating", e.target.value || null)}
              >
                <option value="">Любой</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sp.get("eco") === "1"} onChange={(e) => setFilter("eco", e.target.checked ? "1" : null)} />
              Эко-товары
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sp.get("organic") === "1"}
                onChange={(e) => setFilter("organic", e.target.checked ? "1" : null)}
              />
              Органические
            </label>
            <details className="rounded-lg border border-cream-dark/40 p-2 text-sm">
              <summary className="cursor-pointer font-medium">Дистанция от меня</summary>
              <p className="mt-2 text-xs text-soil/60">Укажите координаты (например 55.75, 37.62 для Москвы) и радиус.</p>
              <input
                className="mt-2 w-full rounded border px-2 py-1"
                placeholder="Широта"
                defaultValue={sp.get("lat") || ""}
                onBlur={(e) => setFilter("lat", e.target.value || null)}
              />
              <input
                className="mt-2 w-full rounded border px-2 py-1"
                placeholder="Долгота"
                defaultValue={sp.get("lng") || ""}
                onBlur={(e) => setFilter("lng", e.target.value || null)}
              />
              <input
                className="mt-2 w-full rounded border px-2 py-1"
                placeholder="Макс. км"
                defaultValue={sp.get("maxKm") || ""}
                onBlur={(e) => setFilter("maxKm", e.target.value || null)}
              />
            </details>
          </aside>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-soil/70">
                Найдено: <span className="font-semibold text-soil">{total}</span>
              </p>
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="sort">Сортировка</label>
                <select
                  id="sort"
                  className="rounded-lg border px-2 py-1"
                  value={filters.sort}
                  onChange={(e) => setFilter("sort", e.target.value)}
                >
                  <option value="popularity">По популярности</option>
                  <option value="price_asc">Цена ↑</option>
                  <option value="price_desc">Цена ↓</option>
                  <option value="newest">Новизна</option>
                </select>
              </div>
            </div>
            {loadError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.id} p={p} producerName={nameById[p.producerId]} onQuick={setQv} />
              ))}
            </div>
            {!loading && items.length === 0 && !loadError && (
              <p className="mt-8 text-center text-sm text-soil/60">Товары не найдены. Сбросьте фильтры или перезапустите dev.cmd.</p>
            )}
            {items.length < total && (
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    const np = page + 1;
                    setPage(np);
                    load(np, true);
                  }}
                >
                  {loading ? "Загрузка…" : "Показать ещё"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {qv && <ProductModal p={qv} onClose={() => setQv(null)} />}
    </div>
  );
}
