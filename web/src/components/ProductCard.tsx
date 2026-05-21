import { Link } from "react-router-dom";
import { Leaf, Star } from "lucide-react";
import type { Product } from "../lib/api";
import { categoryLabelRu } from "../types";
import { cn } from "../lib/utils";
import { ProductThumb } from "./ProductThumb";

export function ProductCard({
  p,
  producerName,
  onQuick,
}: {
  p: Product;
  producerName?: string;
  onQuick?: (p: Product) => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-cream-dark/40 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={"/product/" + p.id} className="relative block aspect-[4/3] overflow-hidden">
        <ProductThumb productId={p.id} src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {p.isNew && (
            <span className="rounded-full bg-wheat px-2 py-0.5 text-[10px] font-semibold uppercase text-soil">Новинка</span>
          )}
          {p.eco && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-moss/90 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Leaf className="h-3 w-3" aria-hidden />
              Эко
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-soil/60">{categoryLabelRu(p.category)}</p>
        <Link to={"/product/" + p.id} className="mt-1 font-medium text-soil hover:text-moss">
          {p.name}
        </Link>
        {producerName && (
          <Link to={"/producer/" + p.producerId} className="mt-0.5 text-xs text-moss hover:underline">
            {producerName}
          </Link>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-soil/70">
          <Star className="h-3.5 w-3.5 fill-wheat text-wheat" aria-hidden />
          <span>{(Number(p.rating) || 0).toFixed(1)}</span>
          <span className="text-soil/50">({p.reviewCount})</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="text-lg font-semibold text-moss-dark">
            {Math.round(p.price)} ₽
          </p>
          {onQuick && (
            <button
              type="button"
              className="rounded-full border border-cream-dark/60 px-3 py-1 text-xs font-medium text-soil transition hover:border-moss hover:text-moss"
              onClick={() => onQuick(p)}
            >
              Быстрый просмотр
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98]",
        variant === "primary" && "bg-moss text-white shadow hover:bg-moss-dark",
        variant === "ghost" && "bg-transparent text-moss hover:bg-cream-dark/50",
        variant === "outline" && "border border-moss/40 text-moss hover:bg-cream",
        className
      )}
      {...props}
    />
  );
}
