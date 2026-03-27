import type { Product } from "./types";

export type ProductFilterCategory = string;

export function getProductFilterCategories(products: Product[]): ProductFilterCategory[] {
  const durations = Array.from(
    new Set(products.flatMap((product) => product.subscriptions.map((subscription) => subscription.durationMonths)))
  ).sort((a, b) => a - b);

  return ["All", ...durations.map((duration) => `${duration} Months`)];
}

export function matchesProductCategory(product: Product, category: ProductFilterCategory): boolean {
  if (category === "All") return true;

  const duration = Number.parseInt(category, 10);
  if (Number.isNaN(duration)) return true;

  return product.subscriptions.some((subscription) => subscription.durationMonths === duration);
}
