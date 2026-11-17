import {
  Armchair,
  BookOpen,
  Dumbbell,
  Laptop,
  Package,
  Projector,
  Shirt,
  Sparkles,
  TentTree,
  Wrench,
} from "lucide-react";
import type { ItemCategory } from "@lendly/shared";

const icons = {
  "Books & Stationery": BookOpen,
  Electronics: Laptop,
  "Projectors & Event Gear": Projector,
  "Sports & Fitness": Dumbbell,
  "Tools & Equipment": Wrench,
  "Home & Cleaning": Sparkles,
  "Travel & Camping": TentTree,
  "Fashion & Accessories": Shirt,
  "Furniture & Decor": Armchair,
  Other: Package,
};

export function CategoryIcon({ category, size = 18 }: { category: ItemCategory; size?: number }) {
  const Icon = icons[category];
  return <Icon size={size} />;
}
