import type { ProductCategory, ReviewTarget } from "../types";

const API = "/api";
const FETCH_MS = 12_000;

async function req(input: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(
        "Сервер не отвечает. Запустите dev.cmd в папке проекта (API :8080 и Vite :5173) и откройте http://127.0.0.1:5173"
      );
    }
    throw new Error(
      "Нет связи с API. Откройте сайт через http://127.0.0.1:5173 (не file://) и проверьте, что бэкенд запущен."
    );
  } finally {
    clearTimeout(timer);
  }
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json() as Promise<T>;
}

function asArray<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

export const api = {
  health: () => req(`${API}/health`).then((r) => r.ok),
  categories: () => req(`${API}/categories`).then((r) => j<{ id: string; label: string }[]>(r)),
  producers: () => req(`${API}/producers`).then((r) => j<Producer[]>(r).then(asArray)),
  producer: (id: string) => req(`${API}/producers/${encodeURIComponent(id)}`).then((r) => j<Producer>(r)),
  producerProducts: (id: string) =>
    req(`${API}/producers/${encodeURIComponent(id)}/products`).then((r) => j<Product[]>(r).then(asArray)),
  products: (params: Record<string, string | number | boolean | undefined>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === "") return;
      q.set(k, String(v));
    });
    return req(`${API}/products?` + q.toString()).then((r) =>
      j<{ items: Product[] | null; total: number }>(r).then((data) => ({
        items: asArray(data.items),
        total: data.total ?? 0,
      }))
    );
  },
  product: (id: string) => req(`${API}/products/${encodeURIComponent(id)}`).then((r) => j<Product>(r)),
  similar: (id: string) =>
    req(`${API}/products/${encodeURIComponent(id)}/similar`).then((r) => j<Product[]>(r).then(asArray)),
  reviews: (target: ReviewTarget, targetId: string) =>
    req(`${API}/reviews?target=${target}&targetId=${encodeURIComponent(targetId)}`).then((r) => j<Review[]>(r).then(asArray)),
  reviewComments: (id: string) =>
    req(`${API}/reviews/${encodeURIComponent(id)}/comments`).then((r) => j<ReviewComment[]>(r)),
  createOrder: (body: unknown, headers?: Record<string, string>) =>
    req(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }).then((r) => j<Order>(r)),
  orders: (userId?: string) => {
    const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return req(`${API}/orders` + q, { headers: { "X-User-Id": userId || "buyer-1" } }).then((r) => j<Order[]>(r));
  },
  validatePromo: (code: string) =>
    req(`${API}/promo/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).then((r) => j<{ discountPercent: number }>(r)),
  profile: () => req(`${API}/profile`).then((r) => j<BuyerProfile>(r)),
  saveProfile: (p: BuyerProfile) =>
    req(`${API}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).then((r) => j<{ ok: string }>(r)),
  sellerOrders: (producerId: string) =>
    req(`${API}/seller/orders`, { headers: { "X-Producer-Id": producerId } }).then((r) => j<ProducerOrderView[]>(r)),
  sellerStats: (producerId: string) =>
    req(`${API}/seller/stats`, { headers: { "X-Producer-Id": producerId } }).then((r) => j<SalesStats>(r)),
  sellerChat: (producerId: string) =>
    req(`${API}/seller/chat`, { headers: { "X-Producer-Id": producerId } }).then((r) => j<ChatMessage[]>(r)),
  upsertProduct: (producerId: string, p: Partial<Product> & { id?: string }, method: "POST" | "PUT", id?: string) =>
    req(id ? `${API}/seller/products/${encodeURIComponent(id)}` : `${API}/seller/products`, {
      method,
      headers: { "Content-Type": "application/json", "X-Producer-Id": producerId },
      body: JSON.stringify(p),
    }).then((r) => j<{ ok: string }>(r)),
};

export type Producer = {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  description: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  avatarUrl: string;
  coverUrl: string;
  rating: number;
  reviewCount: number;
  ecoCertified: boolean;
  organic: boolean;
  story: string;
  philosophy: string;
  certificates: string[];
  awards: string[];
  foundedYear: number;
  deliveryBase: number;
};

export type Product = {
  id: string;
  producerId: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  price: number;
  currency: string;
  images: string[];
  stock: number;
  expiryDays?: number;
  rating: number;
  reviewCount: number;
  eco: boolean;
  organic: boolean;
  featured: boolean;
  isNew: boolean;
  popularity: number;
  originStory: string;
  createdAt: string;
};

export type Review = {
  id: string;
  target: ReviewTarget;
  targetId: string;
  authorId: string;
  authorName: string;
  rating: number;
  text: string;
  photoUrl?: string;
  likes: number;
  createdAt: string;
};

export type ReviewComment = {
  id: string;
  reviewId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export type OrderLine = {
  productId: string;
  producerId: string;
  name: string;
  image: string;
  unitPrice: number;
  qty: number;
  deliveryFee: number;
};

export type Order = {
  id: string;
  userId: string;
  status: string;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  addressLine: string;
  city: string;
  postalCode: string;
  deliveryMethod: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
};

export type BuyerProfile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  favoriteProductIds: string[];
  subscribedProducerIds: string[];
  addresses: {
    id: string;
    label: string;
    line: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
  }[];
  notifications: {
    emailOrders: boolean;
    pushPromo: boolean;
    smsDelivery: boolean;
    newFromSubs: boolean;
  };
};

export type ProducerOrderView = {
  orderId: string;
  buyerName: string;
  status: string;
  lines: OrderLine[];
  total: number;
  createdAt: string;
};

export type SalesStats = {
  totalRevenue: number;
  ordersCount: number;
  topProducts: { productId: string; name: string; units: number; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
};

export type ChatMessage = {
  id: string;
  producerId: string;
  fromBuyer: boolean;
  author: string;
  text: string;
  createdAt: string;
};
