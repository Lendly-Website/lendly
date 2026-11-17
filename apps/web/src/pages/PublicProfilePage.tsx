import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import type { Item, Review, UserPublic } from "@lendly/shared";
import { request } from "../utils/api";
import { formatRange, rupees } from "../utils/format";
import { VerificationBadge } from "../components/StatusBadge";
import { Avatar } from "../components/Avatar";

export default function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [profileData, itemData, reviewData] = await Promise.all([
          request<{ data: UserPublic }>(`/api/users/${id}`),
          request<{ data: Item[] }>(`/api/users/${id}/items`),
          request<{ data: Review[] }>(`/api/users/${id}/reviews`),
        ]);
        if (!active) return;
        setProfile(profileData.data);
        setItems(itemData.data);
        setReviews(reviewData.data);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Profile not found");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="page">
        <div className="loading-state">Loading profile…</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="page">
        <div className="empty-panel">
          <h2>Profile unavailable</h2>
          <p>{error ?? "This user may no longer be active."}</p>
          <Link className="btn primary" to="/explore">
            Explore listings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="profile-header">
        <Avatar name={profile.name} size="large" />
        <div>
          <h1>{profile.name}</h1>
          <p className="muted">
            <MapPin size={15} /> {profile.location?.locality ?? "Pune"}
          </p>
          <div className="header-meta">
            <VerificationBadge status={profile.verificationStatus} />
            <span className="rating">
              <Star size={15} fill="currentColor" /> {profile.averageRating.toFixed(1)} ({profile.reviewCount} reviews)
            </span>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Active listings</h2>
        {items.length === 0 ? (
          <p className="empty">No active listings.</p>
        ) : (
          <div className="mini-listing-grid">
            {items.map((item) => (
              <Link key={item.id} to={`/items/${item.id}`} className="mini-listing">
                <img src={item.images[0]} alt={item.itemName} />
                <div>
                  <strong>{item.itemName}</strong>
                  <p className="muted small">
                    {item.rentalPrice > 0 ? `${rupees(item.rentalPrice)}/day` : "Free"} ·{" "}
                    {item.availability[0] ? formatRange(item.availability[0].startDate, item.availability[0].endDate) : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Community reviews</h2>
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
                <span className="muted small">{formatRange(review.createdAt, review.createdAt)}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
