import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  LISTING_STATUSES,
  type Item,
} from "@lendly/shared";
import { request } from "../utils/api";
import { toIsoDateInput } from "../utils/format";

interface AvailabilityRow {
  startDate: string;
  endDate: string;
}

const emptyForm = {
  itemName: "",
  category: "",
  description: "",
  condition: "good",
  totalQuantity: "1",
  rentalPrice: "0",
  borrowingTerms: "",
  address: "",
  locality: "",
  city: "Pune",
  latitude: "",
  longitude: "",
  listingStatus: "active",
};

export default function ListingFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([
    {
      startDate: toIsoDateInput(new Date()),
      endDate: toIsoDateInput(new Date(Date.now() + 30 * 86_400_000)),
    },
  ]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) return;
    async function loadProfile() {
      try {
        const data = await request<{ data: { location?: { address: string; locality: string; city: string; latitude: number; longitude: number } } }>(
          "/api/auth/me",
        );
        if (data.data.location) {
          setForm((current) => ({
            ...current,
            address: data.data.location!.address,
            locality: data.data.location!.locality,
            city: data.data.location!.city,
            latitude: String(data.data.location!.latitude),
            longitude: String(data.data.location!.longitude),
          }));
        }
      } catch {
        /* user can fill manually */
      }
    }
    void loadProfile();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    async function loadItem() {
      try {
        const data = await request<{ data: Item }>(`/api/items/${id}`);
        if (!active) return;
        const item = data.data;
        setForm({
          itemName: item.itemName,
          category: item.category,
          description: item.description,
          condition: item.condition,
          totalQuantity: String(item.totalQuantity),
          rentalPrice: String(item.rentalPrice),
          borrowingTerms: item.borrowingTerms,
          address: item.location.address,
          locality: item.location.locality,
          city: item.location.city,
          latitude: String(item.location.latitude),
          longitude: String(item.location.longitude),
          listingStatus: item.listingStatus,
        });
        setImages(item.images);
        setAvailability(
          item.availability.map((window) => ({
            startDate: toIsoDateInput(window.startDate),
            endDate: toIsoDateInput(window.endDate),
          })),
        );
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to load listing");
      } finally {
        setLoading(false);
      }
    }
    void loadItem();
    return () => {
      active = false;
    };
  }, [id]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update("latitude", position.coords.latitude.toFixed(6));
        update("longitude", position.coords.longitude.toFixed(6));
      },
      () => setError("Location permission was denied. Enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function uploadImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files).slice(0, 8 - images.length)) {
        const data = await request<{ data: { url: string } }>("/api/uploads", {
          method: "POST",
          body: (() => {
            const formData = new FormData();
            formData.append("image", file);
            return formData;
          })(),
        });
        setImages((current) => [...current, data.data.url]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        itemName: form.itemName.trim(),
        category: form.category,
        description: form.description.trim(),
        images,
        condition: form.condition,
        totalQuantity: Number(form.totalQuantity),
        rentalPrice: Number(form.rentalPrice),
        borrowingTerms: form.borrowingTerms.trim(),
        location: {
          address: form.address.trim(),
          locality: form.locality.trim(),
          city: form.city.trim() || "Pune",
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        },
        availability: availability.map((window) => ({
          startDate: new Date(window.startDate).toISOString(),
          endDate: new Date(window.endDate).toISOString(),
        })),
        listingStatus: form.listingStatus,
      };

      if (id) {
        await request(`/api/items/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await request("/api/items", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      navigate("/my-listings");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save listing");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = useMemo(
    () => images.length > 0 && form.itemName && form.category && form.description && form.locality,
    [images.length, form.itemName, form.category, form.description, form.locality],
  );

  if (loading) {
    return (
      <main className="page">
        <div className="loading-state">Loading listing…</div>
      </main>
    );
  }

  return (
    <main className="page form-page">
      <section className="page-heading">
        <div>
          <h1>{id ? "Edit listing" : "List an item"}</h1>
          <p>Give borrowers clear photos, availability, and terms.</p>
        </div>
        <Link className="btn ghost" to="/my-listings">
          Back to listings
        </Link>
      </section>

      <form className="listing-form panel" onSubmit={submit}>
        <section>
          <h2>Photos</h2>
          <div className="upload-row">
            {images.map((image, index) => (
              <div key={`${image}-${index}`} className="image-preview">
                <img src={image} alt={`Preview ${index + 1}`} />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label="Remove image"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <label className={`upload-box ${uploading ? "disabled" : ""}`}>
              <ImagePlus size={24} />
              <span>{uploading ? "Uploading…" : "Add photos"}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={uploading}
                onChange={(event) => void uploadImages(event.target.files)}
              />
            </label>
          </div>
          <p className="muted small">Up to 8 real item photos. The first photo becomes the cover.</p>
        </section>

        <section className="form-grid">
          <label htmlFor="itemName">Item name</label>
          <input
            id="itemName"
            required
            value={form.itemName}
            onChange={(event) => update("itemName", event.target.value)}
          />
          <label htmlFor="category">Category</label>
          <select
            id="category"
            required
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
          >
            <option value="">Select a category</option>
            {ITEM_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <label htmlFor="condition">Condition</label>
          <select id="condition" value={form.condition} onChange={(event) => update("condition", event.target.value)}>
            {ITEM_CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            required
            min="1"
            max="100"
            value={form.totalQuantity}
            onChange={(event) => update("totalQuantity", event.target.value)}
          />
          <label htmlFor="price">Rental price per day (₹)</label>
          <input
            id="price"
            type="number"
            required
            min="0"
            value={form.rentalPrice}
            onChange={(event) => update("rentalPrice", event.target.value)}
          />
          <label htmlFor="status">Listing status</label>
          <select id="status" value={form.listingStatus} onChange={(event) => update("listingStatus", event.target.value)}>
            {LISTING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </section>

        <section>
          <h2>Description and terms</h2>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            required
            rows={5}
            minLength={20}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Describe the item, accessories, and best uses."
          />
          <label htmlFor="terms">Borrowing terms</label>
          <textarea
            id="terms"
            required
            rows={4}
            minLength={10}
            value={form.borrowingTerms}
            onChange={(event) => update("borrowingTerms", event.target.value)}
            placeholder="Return condition, accessories, safety instructions, late-return expectations."
          />
        </section>

        <section>
          <div className="section-row">
            <h2>General location</h2>
            <button type="button" className="btn small outline" onClick={detectLocation}>
              Use my location
            </button>
          </div>
          <div className="form-grid">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              required
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
            />
            <label htmlFor="locality">Locality</label>
            <input
              id="locality"
              required
              value={form.locality}
              onChange={(event) => update("locality", event.target.value)}
            />
            <label htmlFor="city">City</label>
            <input id="city" required value={form.city} onChange={(event) => update("city", event.target.value)} />
            <label htmlFor="latitude">Latitude</label>
            <input
              id="latitude"
              required
              value={form.latitude}
              onChange={(event) => update("latitude", event.target.value)}
            />
            <label htmlFor="longitude">Longitude</label>
            <input
              id="longitude"
              required
              value={form.longitude}
              onChange={(event) => update("longitude", event.target.value)}
            />
          </div>
        </section>

        <section>
          <h2>Availability</h2>
          {availability.map((window, index) => (
            <div key={index} className="availability-row">
              <label>
                Start
                <input
                  type="date"
                  required
                  value={window.startDate}
                  onChange={(event) =>
                    setAvailability((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, startDate: event.target.value } : row,
                      ),
                    )
                  }
                />
              </label>
              <label>
                End
                <input
                  type="date"
                  required
                  value={window.endDate}
                  onChange={(event) =>
                    setAvailability((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, endDate: event.target.value } : row,
                      ),
                    )
                  }
                />
              </label>
              {availability.length > 1 ? (
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setAvailability((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                  aria-label="Remove availability window"
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="btn small outline"
            onClick={() =>
              setAvailability((current) => [
                ...current,
                { startDate: toIsoDateInput(new Date()), endDate: toIsoDateInput(new Date()) },
              ])
            }
          >
            Add date range
          </button>
        </section>

        {error ? <div className="alert error">{error}</div> : null}
        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={saving || !canSubmit}>
            {saving ? "Saving…" : id ? "Update listing" : "Publish listing"}
          </button>
        </div>
      </form>
    </main>
  );
}
