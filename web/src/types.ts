export type ProductCategory =
  | "vegetables"
  | "fruits"
  | "meat"
  | "dairy"
  | "bakery"
  | "honey"
  | "jam"
  | "cheese"
  | "craft";

export type ReviewTarget = "product" | "producer";

export const categoryLabel: Record<ProductCategory, string> = {
  vegetables: "Овощи",
  fruits: "Фрукты",
  meat: "Мясо",
  dairy: "Молочные",
  bakery: "Выпечка",
  honey: "Мёд",
  jam: "Варенье",
  cheese: "Сыры",
  craft: "Рукоделие",
};

/** Подпись категории; если с бэка пришло неизвестное значение — показываем как есть. */
export function categoryLabelRu(cat: string): string {
  return categoryLabel[cat as ProductCategory] ?? cat;
}
