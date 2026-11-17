import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, CalendarDays, Flag, MapPin, Package, Star } from "lucide-react";
import { CONDITION_LABELS, type Item, type Review, type UserPublic } from "@lendly/shared";
import { LocationMap } from "../components/LocationMap";
import { Avatar } from "../components/Avatar";
import { CategoryChip } from "../components/CategoryChip";
import { VerificationBadge } from "../components/StatusBadge";
import { request } from "../utils/api";
import { formatDate, formatRange, rupees } from "../utils/format";

export default function ItemDetailsPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDetails, setReportDetails] = useState("");
  const [reportMessage, setReportMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [itemData, reviewData] = await Promise.all([
        request<{ data: Item }>(`/api/items/${id}`),
        request<{ data: Review[] }>(`/api/items/${id}/reviews`).catch(() => ({ data: [] as Review[] })),
      ]);
      setItem(itemData.data);
      setReviews(reviewData.data as Review[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Listing not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const estimatedCost = useMemo(() => {
    if (!item || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1);
    return days * item.rentalPrice * quantity;
  }, [item, startDate, endDate, quantity]);

  async function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      await request("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          itemId: item!.id,
          requestedQuantity: quantity,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          message,
        }),
      });
      setSuccess("Request sent. The lender will accept or reject it.");
      setMessage("");
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Unable to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    setReportMessage(null);
    try {
      await request("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType: "item",
          targetId: item!.id,
          reason: "misleading",
          details: reportDetails,
        }),
      });
      setReportMessage("Report submitted for moderation.");
      setReportDetails("");
      setReportOpen(false);
    } catch (caught) {
      setReportMessage(caught instanceof Error ? caught.message : "Unable to submit report");
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading-state">Loading item details…</div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="page">
        <div className="empty-panel">
          <h2>Listing unavailable</h2>
          <p>{error ?? "This item may have been removed."}</p>
          <Link className="btn primary" to="/explore">
            Explore other items
          </Link>
        </div>
      </main>
    );
  }

  const owner = item.owner as Pick<UserPublic, "id" | "name" | "profileImage" | "verificationStatus" | "averageRating" | "reviewCount"> | undefined;

  return (
    <main className="page item-details">
      <nav className="breadcrumbs">
        <Link to="/explore">Explore</Link>
        <span>/</span>
        <span>{item.category}</span>
      </nav>

      <section className="details-grid">
        <div className="gallery">
          <img src={item.images[activeImage] ?? item.images[0]} alt={item.itemName} />
          {item.images.length > 1 ? (
            <div className="thumbnails">
              {item.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={index === activeImage ? "active" : ""}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt={`${item.itemName} view ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="details-main">
          <div className="role-strip lender">
            <span>Lender side</span>
            <span>{owner?.name ?? "Item owner"}</span>
          </div>
          <div className="details-top">
            <CategoryChip category={item.category} />
            <VerificationBadge status={owner?.verificationStatus ?? "unverified"} />
          </div>
          <h1>{item.itemName}</h1>
          <div className="price-row">
            <strong>{item.rentalPrice > 0 ? `${rupees(item.rentalPrice)}/day` : "Free to borrow"}</strong>
            <span>{CONDITION_LABELS[item.condition]}</span>
            <span>
              <Package size={15} /> {item.totalQuantity} {item.totalQuantity === 1 ? "unit" : "units"}
            </span>
          </div>
          <p className="description">{item.description}</p>

          <div className="terms">
            <h2>Borrowing terms</h2>
            <p>{item.borrowingTerms}</p>
          </div>

          <div className="availability">
            <h2>
              <CalendarDays size={18} /> Available dates
            </h2>
            <div className="availability-list">
              {item.availability.map((window, index) => (
                <span key={index}>{formatRange(window.startDate, window.endDate)}</span>
              ))}
            </div>
          </div>

          <div className="location-box">
            <h2>
              <MapPin size={18} /> Approximate location
            </h2>
            <LocationMap
              latitude={item.location.latitude}
              longitude={item.location.longitude}
              address={`${item.location.locality}, ${item.location.city}`}
            />
            <p className="muted small">
              {item.location.locality}, {item.location.city}. Exact address is shared after approval.
            </p>
          </div>
        </div>

        <aside className="request-panel">
          <div className="role-strip borrower">
            <span>Borrower side</span>
            <span>Your request</span>
          </div>
          <div className="owner-card">
            <Avatar id={owner?.id} name={owner?.name ?? "Lender"} size="large" />
            <div>
              <strong>{owner?.name ?? "Lender"}</strong>
              <p className="muted small">
                <Star size={13} fill="currentColor" /> {owner?.averageRating.toFixed(1) ?? "New"} ·{" "}
                {owner?.reviewCount ?? 0} reviews
              </p>
              {owner ? (
                <Link className="link-button" to={`/users/${owner.id}`}>
                  View profile
                </Link>
              ) : null}
            </div>
          </div>

          {success ? <div className="alert success">{success}</div> : null}
          {formError ? <div className="alert error">{formError}</div> : null}

          <form onSubmit={submitRequest}>
            <h3>Request this item</h3>
            <label htmlFor="start">Start date</label>
            <input
              id="start"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <label htmlFor="end">End date</label>
            <input
              id="end"
              type="date"
              required
              min={startDate || undefined}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={item.totalQuantity}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
            />
            <label htmlFor="message">Message to lender</label>
            <textarea
              id="message"
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="When do you need it and why?"
            />

            <div className="estimate">
              <span>Estimated rental</span>
              <strong>{rupees(estimatedCost)}</strong>
            </div>
            <button className="btn primary full" type="submit" disabled={submitting}>
              {submitting ? "Sending request…" : "Send borrowing request"}
            </button>
          </form>

          <button type="button" className="ghost-report" onClick={() => setReportOpen((open) => !open)}>
            <Flag size={15} /> Report this listing
          </button>
          {reportOpen ? (
            <form className="report-form" onSubmit={submitReport}>
              <textarea
                rows={4}
                required
                minLength={10}
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                placeholder="Explain what is wrong with this listing."
              />
              <button className="btn small outline" type="submit">
                Submit report
              </button>
            </form>
          ) : null}
          {reportMessage ? <div className="alert warning">{reportMessage}</div> : null}
        </aside>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Lender reviews</h2>
          <span className="muted">
            <BadgeCheck size={16} /> Only completed transactions can be reviewed
          </span>
        </div>
        {reviews.length === 0 ? (
          <p className="empty">No reviews for this lender yet.</p>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review.id} className="review">
                <div className="review-head">
                  <strong>{review.reviewer?.name ?? "Community member"}</strong>
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
