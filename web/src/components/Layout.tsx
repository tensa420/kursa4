import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, Search, ShoppingBasket, User, Sprout, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { api, type Product } from "../lib/api";
import { ProductThumb } from "./ProductThumb";
import { useCart } from "../store/cart";

const nav = [
  { to: "/catalog", label: "Каталог" },
  { to: "/account", label: "Кабинет" },
  { to: "/seller", label: "Производителю" },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sug, setSug] = useState<Product[]>([]);
  const navFn = useNavigate();
  const cartCount = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));

  useEffect(() => {
    if (q.length < 2) {
      setSug([]);
      return;
    }
    const t = setTimeout(() => {
      api.products({ search: q, pageSize: 6 }).then((r) => setSug(r.items));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navFn("/catalog?search=" + encodeURIComponent(q));
    setSug([]);
    setOpen(false);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-2 focus:rounded-md focus:bg-moss focus:px-3 focus:py-2 focus:text-white"
      >
        К содержимому
      </a>
      <header className="sticky top-0 z-50 border-b border-cream-dark/40 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-moss-dark md:text-xl">
            <Sprout className="h-7 w-7 shrink-0" aria-hidden />
            <span>Прямой рынок</span>
          </Link>
          <form
            role="search"
            aria-label="Поиск товаров и производителей"
            onSubmit={onSubmitSearch}
            className="relative mx-auto hidden max-w-xl flex-1 md:block"
          >
            <label className="sr-only" htmlFor="global-search">
              Поиск
            </label>
            <input
              id="global-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск: мед, сыр, ферма…"
              className="w-full rounded-full border border-cream-dark/50 bg-white py-2 pl-10 pr-4 text-sm shadow-sm outline-none ring-moss/30 focus:ring-2"
              autoComplete="off"
            />
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-soil/50" aria-hidden />
            {sug.length > 0 && (
              <ul
                className="absolute mt-1 max-h-72 w-full overflow-auto rounded-xl border border-cream-dark/40 bg-white py-1 shadow-lg"
                role="listbox"
              >
                {sug.map((p) => (
                  <li key={p.id} role="option">
                    <Link
                      to={"/product/" + p.id}
                      className="flex gap-3 px-3 py-2 text-sm hover:bg-cream"
                      onClick={() => setSug([])}
                    >
                      <ProductThumb productId={p.id} src={p.images?.[0]} alt="" className="h-10 w-10 rounded-md object-cover" />
                      <span className="flex-1">{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </form>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-moss text-white" : "text-soil hover:bg-cream-dark/60"
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/cart"
              className="relative inline-flex tap-target items-center justify-center rounded-full border border-cream-dark/50 bg-white p-2 shadow-sm transition hover:border-moss/40"
              aria-label={"Корзина, товаров: " + cartCount}
            >
              <ShoppingBasket className="h-5 w-5" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-wheat px-1 text-center text-[10px] font-bold text-soil">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <Link
              to="/account"
              className="hidden tap-target items-center justify-center rounded-full border border-cream-dark/50 bg-white p-2 shadow-sm transition hover:border-moss/40 sm:inline-flex"
              aria-label="Личный кабинет"
            >
              <User className="h-5 w-5" aria-hidden />
            </Link>
            <button
              type="button"
              className="inline-flex tap-target items-center justify-center rounded-full border border-cream-dark/50 bg-white p-2 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Меню</span>
            </button>
          </div>
        </div>
        {open && (
          <div id="mobile-menu" className="border-t border-cream-dark/40 bg-cream px-4 py-3 md:hidden">
            <form onSubmit={onSubmitSearch} className="mb-3 flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск…"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-lg bg-moss px-3 py-2 text-sm text-white">
                Найти
              </button>
            </form>
            <div className="flex flex-col gap-2">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn("rounded-lg px-3 py-2 text-sm font-medium", isActive ? "bg-moss text-white" : "bg-white")
                  }
                >
                  {n.label}
                </NavLink>
              ))}
              <Link to="/account" onClick={() => setOpen(false)} className="rounded-lg bg-white px-3 py-2 text-sm">
                Кабинет
              </Link>
            </div>
          </div>
        )}
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-cream-dark/40 bg-moss-dark text-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold">Прямой рынок</p>
            <p className="mt-2 text-sm text-cream/80">Прямые продажи от местных производителей без посредников.</p>
          </div>
          <div>
            <p className="font-medium">Категории</p>
            <ul className="mt-2 space-y-1 text-sm text-cream/85">
              <li>
                <Link className="hover:underline" to="/catalog?category=vegetables">
                  Овощи и зелень
                </Link>
              </li>
              <li>
                <Link className="hover:underline" to="/catalog?category=dairy">
                  Молочные
                </Link>
              </li>
              <li>
                <Link className="hover:underline" to="/catalog?category=bakery">
                  Выпечка
                </Link>
              </li>
              <li>
                <Link className="hover:underline" to="/catalog?category=honey">
                  Мёд
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Контакты</p>
            <p className="mt-2 text-sm text-cream/85">support@farmmarket.local</p>
            <p className="text-sm text-cream/85">+7 (800) 000-00-00</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-cream/70">Учебный проект · 2026</div>
      </footer>
    </div>
  );
}
