import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import type { Item } from "@lendly/shared";
import { CONDITION_LABELS } from "@lendly/shared";
import { Avatar } from "./Avatar";
import { CategoryChip } from "./CategoryChip";
import { formatDistance, rupees } from "../utils/format";

export function ItemCard({ item }: { item: Item }) {
  const cover = item.images[0] ?? "/placeholder.svg";

  return (
    <article className="item-card">
      <Link to={`/items/${item.id}`} className="item-card-link">
        <div className="item-cover">
          <img src={cover} alt={item.itemName} loading="lazy" />
          <span className="item-price">{item.rentalPrice > 0 ? `${rupees(item.rentalPrice)}/day` : "Free"}</span>
        </div>
        <div className="item-card-body">
          <div className="item-top">
            <CategoryChip category={item.category} />
            {item.distanceMeters !== undefined ? (
              <span className="distance">{formatDistance(item.distanceMeters)}</span>
            ) : null}
          </div>
          <h3>{item.itemName}</h3>
          <p className="muted">{item.description}</p>
          <div className="item-meta">
            <span>
              <MapPin size={15} /> {item.location.locality}
            </span>
            <span>{CONDITION_LABELS[item.condition]}</span>
            <span>
              {item.totalQuantity} {item.totalQuantity === 1 ? "unit" : "units"}
            </span>
          </div>
          {item.owner ? (
            <div className="item-owner">
              <Avatar id={item.owner.id} name={item.owner.name} />
              <span>{item.owner.name}</span>
              <span className="rating">
                <Star size={14} fill="currentColor" /> {item.owner.averageRating.toFixed(1)}
              </span>
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
