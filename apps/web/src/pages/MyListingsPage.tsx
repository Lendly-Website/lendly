import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, Pencil, Power, Trash2 } from "lucide-react";
import type { Item } from "@lendly/shared";
import { request } from "../utils/api";
import { formatRange, rupees } from "../utils/format";
import { ListingStatusBadge } from "../components/StatusBadge";

export default function MyListingsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<{ data: Item[] }>("/api/items/mine");
      setItems(data.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(item: Item, listingStatus: string) {
    await request(`/api/items/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ listingStatus }),
    });
    await load();
  }

  async function removeItem(item: Item) {
    if (!window.confirm(`Remove “${item.itemName}” from LENDLY?`)) return;
    await request(`/api/items/${item.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <h1>My listings</h1>
          <p>Publish, pause, or remove items you are willing to share.</p>
        </div>
        <Link className="btn primary" to="/listings/new">
          <PackagePlus size={18} /> New listing
        </Link>
      </section>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="loading-state">Loading listings…</div> : null}

      {!loading && items.length === 0 ? (
        <section className="empty-panel">
          <h2>No listings yet</h2>
          <p>Your first listing helps neighbours discover something useful.</p>
          <Link className="btn outline" to="/listings/new">
            List your first item
          </Link>
        </section>
      ) : null}

      <div className="listing-management">
        {items.map((item) => (
          <article key={item.id} className="manage-card">
            <img src={item.images[0]} alt={item.itemName} />
            <div className="manage-main">
              <div className="manage-top">
                <h3>{item.itemName}</h3>
                <ListingStatusBadge status={item.listingStatus} />
              </div>
              <p className="muted">
                {item.category} · {item.rentalPrice > 0 ? `${rupees(item.rentalPrice)}/day` : "Free"} ·{" "}
                {item.totalQuantity} {item.totalQuantity === 1 ? "unit" : "units"}
              </p>
              <p className="muted small">
                {item.availability.map((window) => formatRange(window.startDate, window.endDate)).join(", ")}
              </p>
            </div>
            <div className="manage-actions">
              <Link className="btn small outline" to={`/listings/${item.id}/edit`}>
                <Pencil size={15} /> Edit
              </Link>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => void setStatus(item, item.listingStatus === "active" ? "paused" : "active")}
              >
                <Power size={15} /> {item.listingStatus === "active" ? "Pause" : "Activate"}
              </button>
              <button type="button" className="btn small danger" onClick={() => void removeItem(item)}>
                <Trash2 size={15} /> Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
