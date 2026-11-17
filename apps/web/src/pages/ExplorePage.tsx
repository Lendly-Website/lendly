import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Crosshair, Filter, Radius, Search } from "lucide-react";
import {
  CONDITION_LABELS,
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  type Item,
  type ItemCategory,
} from "@lendly/shared";
import { ItemCard } from "../components/ItemCard";
import { buildQuery, request } from "../utils/api";

const radiusOptions = [1000, 2000, 3000, 5000, 10000, 20000];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState(() => ({
    q: searchParams.get("q") ?? "",
    category: searchParams.get("category") ?? "",
    condition: searchParams.get("condition") ?? "",
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    sort: searchParams.get("sort") ?? "relevance",
    latitude: searchParams.get("latitude") ?? "",
    longitude: searchParams.get("longitude") ?? "",
    radius: searchParams.get("radius") ?? "1000",
  }));
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      q: searchParams.get("q") ?? "",
      category: searchParams.get("category") ?? "",
      condition: searchParams.get("condition") ?? "",
      startDate: searchParams.get("startDate") ?? "",
      endDate: searchParams.get("endDate") ?? "",
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      sort: searchParams.get("sort") ?? "relevance",
      latitude: searchParams.get("latitude") ?? "",
      longitude: searchParams.get("longitude") ?? "",
      radius: searchParams.get("radius") ?? "1000",
    });
    setPage(Number(searchParams.get("page") ?? 1));
  }, [searchParams]);

  const query = useMemo(() => {
    return {
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      condition: searchParams.get("condition") ?? undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      sort: searchParams.get("sort") || undefined,
      latitude: searchParams.get("latitude") || undefined,
      longitude: searchParams.get("longitude") || undefined,
      radius: searchParams.get("radius") || undefined,
      page,
      limit: 20,
    };
  }, [searchParams, page]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await request<{ data: Item[]; pagination: typeof pagination }>(
        `/api/items${buildQuery(query)}`,
      );
      setItems(response.data);
      setPagination(response.pagination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load listings");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const next = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value !== "") next.set(key, value);
    }
    setSearchParams(next);
  }

  function setCategory(category: ItemCategory | "") {
    const next = new URLSearchParams(searchParams);
    if (category) next.set("category", category);
    else next.delete("category");
    next.set("page", "1");
    setSearchParams(next);
  }

  function expandRadius(additionalMeters: number) {
    const nextRadius = Math.max(1000, Number(form.radius || "1000")) + additionalMeters;
    const next = new URLSearchParams(searchParams);
    next.set("radius", String(nextRadius));
    next.set("page", "1");
    setSearchParams(next);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = new URLSearchParams(searchParams);
        next.set("latitude", position.coords.latitude.toFixed(6));
        next.set("longitude", position.coords.longitude.toFixed(6));
        if (!next.get("radius")) next.set("radius", "1000");
        setSearchParams(next);
      },
      () => setError("Location permission was denied. Enter coordinates or browse without distance."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  }

  const noResults = !loading && items.length === 0;
  const hasLocation = Boolean(query.latitude && query.longitude);
  const currentRadius = Number(form.radius || "1000");
  const activeFilterCount =
    (form.q ? 1 : 0) +
    (form.category ? 1 : 0) +
    (form.condition ? 1 : 0) +
    (form.startDate ? 1 : 0) +
    (form.endDate ? 1 : 0) +
    (form.minPrice ? 1 : 0) +
    (form.maxPrice ? 1 : 0) +
    (form.latitude ? 1 : 0) +
    (form.longitude ? 1 : 0);

  return (
    <main className="page">
      <section className="page-heading explore-heading">
        <div>
          <h1>Explore nearby items</h1>
          <p>Search, filter, and choose your own search distance.</p>
        </div>
        {activeFilterCount > 0 && (
          <div className="filters-active">
            <span className="filter-count">{activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active</span>
            <button type="button" className="btn ghost small" onClick={() => setSearchParams(new URLSearchParams())}>
              Clear all
            </button>
          </div>
        )}
      </section>

      <section className="search-panel">
        <form onSubmit={submit}>
          <div className="search-bar">
            <Search size={19} />
            <input
              name="q"
              value={form.q}
              onChange={(event) => update("q", event.target.value)}
              placeholder="Search projector, drill, tent…"
              aria-label="Search item name"
            />
            <button type="submit" className="btn primary">
              Search
            </button>
          </div>

          <div className="filter-section">
            <div className="filter-section-title">What</div>
            <div className="chip-group">
              <button
                type="button"
                className={`filter-chip ${form.category === "" ? "active" : ""}`}
                onClick={() => setCategory("")}
              >
                All categories
              </button>
              {ITEM_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`filter-chip ${form.category === category ? "active" : ""}`}
                  onClick={() => setCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-grid">
            <label>
              Condition
              <select
                name="condition"
                value={form.condition}
                onChange={(event) => update("condition", event.target.value)}
              >
                <option value="">Any condition</option>
                {ITEM_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {CONDITION_LABELS[condition]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start date
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </label>
            <label>
              End date
              <input
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={(event) => update("endDate", event.target.value)}
              />
            </label>
            <label>
              Min price
              <input
                name="minPrice"
                type="number"
                min="0"
                value={form.minPrice}
                onChange={(event) => update("minPrice", event.target.value)}
              />
            </label>
            <label>
              Max price
              <input
                name="maxPrice"
                type="number"
                min="0"
                value={form.maxPrice}
                onChange={(event) => update("maxPrice", event.target.value)}
              />
            </label>
          </div>

          <div className="filter-section">
            <div className="filter-section-title">Where & how far</div>
            <div className="radius-bar">
              <div>
                <label htmlFor="latitude">Latitude</label>
                <input
                  name="latitude"
                  id="latitude"
                  value={form.latitude}
                  onChange={(event) => update("latitude", event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="longitude">Longitude</label>
                <input
                  name="longitude"
                  id="longitude"
                  value={form.longitude}
                  onChange={(event) => update("longitude", event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="radius">Search radius (m)</label>
                <select
                  name="radius"
                  id="radius"
                  value={form.radius}
                  onChange={(event) => update("radius", event.target.value)}
                >
                  {radiusOptions.map((radius) => (
                    <option key={radius} value={radius}>
                      {radius}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn outline" onClick={useMyLocation}>
                <Crosshair size={17} /> Use my location
              </button>
            </div>
          </div>
        </form>
      </section>

      <div className="results-toolbar">
        <span>
          <Filter size={16} /> {pagination.total} listing{pagination.total === 1 ? "" : "s"}
        </span>
        {hasLocation ? (
          <span>
            <Radius size={16} /> {currentRadius} m radius
          </span>
        ) : null}
        <label className="sort-label">
          Sort by
          <select
            name="sort"
            value={form.sort}
            onChange={(event) => update("sort", event.target.value)}
            className="sort-select"
          >
            <option value="relevance">Relevance</option>
            <option value="distance">Distance</option>
            <option value="price_low">Price: low to high</option>
            <option value="price_high">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? (
        <div className="item-grid">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="item-card skeleton" />)}
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <section className="item-grid">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </section>
      ) : null}

      {noResults ? (
        <section className="empty-panel">
          <h2>No matching available listings</h2>
          <p>
            {hasLocation
              ? "Nothing matched within your selected radius. LENDLY only expands it when you choose."
              : "Try another keyword, category, price range, or date."}
          </p>
          {hasLocation ? (
            <div className="expand-options">
              <h3>Expand search by:</h3>
              {[500, 1000, 2000, 5000].map((additional) => (
                <button
                  key={additional}
                  type="button"
                  className="btn outline"
                  onClick={() => expandRadius(additional)}
                >
                  +{additional} metres
                </button>
              ))}
            </div>
          ) : null}
          {!hasLocation && (
            <div className="expand-options">
              <h3>Try browsing by category:</h3>
              <div className="chip-group">
                {ITEM_CATEGORIES.slice(0, 6).map((category) => (
                  <button
                    key={category}
                    type="button"
                    className="filter-chip"
                    onClick={() => setCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {pagination.pages > 1 ? (
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="btn ghost">
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() => goToPage(page + 1)}
            className="btn ghost"
          >
            Next
          </button>
        </div>
      ) : null}
    </main>
  );
}
