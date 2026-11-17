import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Save, Star } from "lucide-react";
import type { Item, Review } from "@lendly/shared";
import { useAuth } from "../context/AuthContext";
import { request } from "../utils/api";
import { formatDate } from "../utils/format";
import { VerificationBadge } from "../components/StatusBadge";
import { Avatar } from "../components/Avatar";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    locality: "",
    city: "",
    latitude: "",
    longitude: "",
  });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "" });
  const [items, setItems] = useState<Item[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadActivity = useCallback(async () => {
    if (!user) return;
    try {
      const [itemsData, reviewsData] = await Promise.all([
        request<{ data: Item[] }>(`/api/users/${user.id}/items`),
        request<{ data: Review[] }>(`/api/users/${user.id}/reviews`),
      ]);
      setItems(itemsData.data);
      setReviews(reviewsData.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load profile activity");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      phone: user.phone ?? "",
      address: user.location?.address ?? "",
      locality: user.location?.locality ?? "",
      city: user.location?.city ?? "Pune",
      latitude: user.location?.latitude ? String(user.location.latitude) : "",
      longitude: user.location?.longitude ? String(user.location.longitude) : "",
    });
    void loadActivity();
  }, [user, loadActivity]);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await request("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          location:
            form.address && form.locality && form.latitude && form.longitude
              ? {
                  address: form.address.trim(),
                  locality: form.locality.trim(),
                  city: form.city.trim() || "Pune",
                  latitude: Number(form.latitude),
                  longitude: Number(form.longitude),
                }
              : undefined,
        }),
      });
      await refreshUser();
      setMessage("Profile updated successfully.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await request("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(password),
      });
      setPassword({ currentPassword: "", newPassword: "" });
      setMessage("Password updated successfully.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update password");
    }
  }

  if (!user) {
    return (
      <main className="page">
        <div className="loading-state">Loading profile…</div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="profile-header">
        <Avatar name={user.name} size="large" />
        <div>
          <h1>{user.name}</h1>
          <p className="muted">{user.email}</p>
          <div className="header-meta">
            <VerificationBadge status={user.verificationStatus} />
            <span className="rating">
              <Star size={15} fill="currentColor" /> {user.averageRating.toFixed(1)} ({user.reviewCount} reviews)
            </span>
          </div>
        </div>
      </section>

      {message ? <div className="alert success">{message}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="profile-grid">
        <section className="panel">
          <h2>Personal details</h2>
          <form onSubmit={saveProfile}>
            <label htmlFor="name">Name</label>
            <input id="name" required value={form.name} onChange={(event) => update("name", event.target.value)} />
            <label htmlFor="phone">Phone</label>
            <input id="phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
            <label htmlFor="address">Address</label>
            <input id="address" value={form.address} onChange={(event) => update("address", event.target.value)} />
            <label htmlFor="locality">Locality</label>
            <input id="locality" value={form.locality} onChange={(event) => update("locality", event.target.value)} />
            <label htmlFor="city">City</label>
            <input id="city" value={form.city} onChange={(event) => update("city", event.target.value)} />
            <label htmlFor="latitude">Latitude</label>
            <input id="latitude" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} />
            <label htmlFor="longitude">Longitude</label>
            <input id="longitude" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} />
            <button className="btn primary" type="submit" disabled={saving}>
              <Save size={17} /> {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>
            <KeyRound size={18} /> Password
          </h2>
          <form onSubmit={changePassword}>
            <label htmlFor="currentPassword">Current password</label>
            <input
              id="currentPassword"
              type="password"
              required
              value={password.currentPassword}
              onChange={(event) => setPassword((current) => ({ ...current, currentPassword: event.target.value }))}
            />
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              required
              autoComplete="new-password"
              value={password.newPassword}
              onChange={(event) => setPassword((current) => ({ ...current, newPassword: event.target.value }))}
            />
            <button className="btn outline" type="submit">
              Update password
            </button>
          </form>
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>Public listings</h2>
          <Link className="btn small outline" to="/my-listings">
            Manage listings
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="empty">No active public listings.</p>
        ) : (
          <div className="mini-listing-grid">
            {items.map((item) => (
              <Link key={item.id} to={`/items/${item.id}`} className="mini-listing">
                <img src={item.images[0]} alt={item.itemName} />
                <div>
                  <strong>{item.itemName}</strong>
                  <p className="muted small">{item.location.locality}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Reviews about you</h2>
        {reviews.length === 0 ? (
          <p className="empty">No reviews yet.</p>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review.id} className="review">
                <div className="review-head">
                  <strong>{review.reviewer?.name}</strong>
                  <span className="rating">
                    <Star size={14} fill="currentColor" /> {review.rating}
                  </span>
                </div>
                <p>{review.comment}</p>
                <span className="muted small">{formatDate(review.createdAt)}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
