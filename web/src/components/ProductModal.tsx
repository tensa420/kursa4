import { X } from "lucide-react";
import type { Product } from "../lib/api";
import { Button } from "./ProductCard";
import { ProductThumb } from "./ProductThumb";
import { Link } from "react-router-dom";
import { useCart } from "../store/cart";
import { toast } from "sonner";

export function ProductModal({ p, onClose }: { p: Product | null; onClose: () => void }) {
  const add = useCart((s) => s.add);
  if (!p) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qv-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
          <h2 id="qv-title" className="font-display text-lg font-semibold">
            {p.name}
          </h2>
          <button type="button" className="tap-target rounded-full p-2 hover:bg-cream" onClick={onClose} aria-label="Закрыть">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <ProductThumb productId={p.id} src={p.images?.[0]} alt="" className="max-h-56 w-full rounded-xl object-cover" />
          <p className="mt-3 text-sm text-soil/80">{p.description}</p>
          <p className="mt-2 text-xl font-bold text-moss-dark">{Math.round(p.price)} ₽</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                add(p, 1);
                toast.success("Добавлено в корзину");
                onClose();
              }}
            >
              В корзину
            </Button>
            <Link
              to={"/product/" + p.id}
              className="inline-flex items-center rounded-full border border-moss/40 px-4 py-2 text-sm font-semibold text-moss hover:bg-cream"
              onClick={onClose}
            >
              Страница товара
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
