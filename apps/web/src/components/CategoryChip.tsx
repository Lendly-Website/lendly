import type { ItemCategory } from "@lendly/shared";
import { CategoryIcon } from "./CategoryIcon";

export function CategoryChip({ category }: { category: ItemCategory }) {
  return (
    <span className="category-chip chip-rain">
      <CategoryIcon category={category} size={14} />
      {category}
    </span>
  );
}
