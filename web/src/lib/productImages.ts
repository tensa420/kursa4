/** Локальные фото: web/public/products/{id}.jpg — v=7 сбрасывает кэш браузера */
const IMG_VER = "7";

const ids = [
  "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10",
  "p11", "p12", "p13", "p14", "p15", "p16", "p17", "p18", "p19", "p20",
  "p21", "p22", "p23", "p24", "p25", "p26", "p27", "p28", "p29", "p30",
  "p31", "p32", "p33",
] as const;

export const PRODUCT_IMAGES: Record<string, string> = Object.fromEntries(
  ids.map((id) => [id, `/products/${id}.jpg?v=${IMG_VER}`])
);

export function imageForProduct(productId?: string, _apiUrl?: string | null): string | undefined {
  if (productId && PRODUCT_IMAGES[productId]) return PRODUCT_IMAGES[productId];
  return undefined;
}
