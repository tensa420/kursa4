import { useCallback, useEffect, useState } from "react";
import { imageForProduct, PRODUCT_IMAGES } from "../lib/productImages";
import { PRODUCT_IMG_FALLBACK } from "../lib/productImage";

const BLANK =
  "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#e8dfd0" width="100%" height="100%"/></svg>');

export function ProductThumb({
  src,
  productId,
  alt,
  className,
}: {
  src?: string | null;
  productId?: string;
  alt: string;
  className?: string;
}) {
  // Только локальный файл по id — URL из API игнорируем (там бывают чужие картинки).
  const primary = productId ? imageForProduct(productId) ?? PRODUCT_IMAGES[productId] : src || PRODUCT_IMG_FALLBACK;
  const [tier, setTier] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTier(0);
    setLoaded(false);
  }, [primary, productId]);

  const resolved = tier === 0 ? primary : tier === 1 ? PRODUCT_IMG_FALLBACK : BLANK;

  const onError = useCallback(() => {
    setLoaded(false);
    setTier((t) => (t >= 2 ? 2 : t + 1));
  }, []);

  const onLoad = useCallback(() => setLoaded(true), []);

  return (
    <span className={"relative block overflow-hidden bg-cream-dark/40 " + (className ?? "")}>
      {!loaded && <span className="absolute inset-0 z-[1] animate-pulse bg-cream-dark/60" aria-hidden />}
      <img
        src={resolved}
        alt={alt}
        className={className ?? "h-full w-full object-cover"}
        loading="lazy"
        decoding="async"
        onError={onError}
        onLoad={onLoad}
      />
    </span>
  );
}
