import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../lib/api";

export type CartLine = {
  productId: string;
  producerId: string;
  name: string;
  image: string;
  unitPrice: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  add: (p: Product, qty: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (p, qty) => {
        const img = p.images?.[0] || "";
        set((s) => {
          const i = s.lines.findIndex((l) => l.productId === p.id);
          const next = [...s.lines];
          if (i >= 0) next[i] = { ...next[i], qty: Math.min(p.stock, next[i].qty + qty) };
          else next.push({ productId: p.id, producerId: p.producerId, name: p.name, image: img, unitPrice: p.price, qty });
          return { lines: next };
        });
      },
      setQty: (productId, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.productId === productId ? { ...l, qty: Math.max(1, qty) } : l))
            .filter((l) => l.qty > 0),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((a, l) => a + l.qty, 0),
    }),
    { name: "farmmarket-cart" }
  )
);
