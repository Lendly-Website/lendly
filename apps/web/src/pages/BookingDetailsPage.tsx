import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarCheck, PackageCheck, Star } from "lucide-react";
import type { Booking, Review } from "@lendly/shared";
import { Avatar } from "../components/Avatar";
import { request } from "../utils/api";
import { formatDateTime, formatRange, rupees } from "../utils/format";
import { BookingStatusBadge } from "../components/StatusBadge";

export default function BookingDetailsPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialCondition, setInitialCondition] = useState("");
  const [finalCondition, setFinalCondition] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [bookingData, reviewData] = await Promise.all([
        request<{ data: Booking }>(`/api/bookings/${id}`),
        request<{ data: Review | null }>(`/api/reviews/booking/${id}`),
      ]);
      setBooking(bookingData.data);
      setReview(reviewData.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load booking");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmHandover(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);
    try {
      const data = await request<{ data: Booking }>(`/api/bookings/${id}/handover`, {
        method: "PATCH",
        body: JSON.stringify({ initialCondition }),
      });
      setBooking(data.data);
      setActionMessage("Handover confirmed. The borrowing is now active.");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Unable to confirm handover");
    }
  }

  async function confirmReturn(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);
    try {
      const data = await request<{ data: Booking }>(`/api/bookings/${id}/return`, {
        method: "PATCH",
        body: JSON.stringify({ finalCondition }),
      });
      setBooking(data.data);
      setActionMessage("Return confirmed. You can now submit a review.");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Unable to confirm return");
    }
  }

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);
    try {
      const data = await request<{ data: Review }>("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          bookingId: id,
          rating,
          communicationRating: rating,
          reliabilityRating: rating,
          itemHandlingRating: rating,
          comment,
        }),
      });
      setReview(data.data);
      setActionMessage("Review submitted. Thank you for building community trust.");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Unable to submit review");
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading-state">Loading booking…</div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="page">
        <div className="empty-panel">
          <h2>Booking unavailable</h2>
          <p>{error ?? "This booking may not belong to your account."}</p>
          <Link className="btn primary" to="/activity?tab=bookings">
            Back to activity
          </Link>
        </div>
      </main>
    );
  }

  const canHandover = booking.handoverStatus === "pending" && booking.bookingStatus === "confirmed";
  const canReturn = booking.handoverStatus === "confirmed" && booking.returnStatus === "pending";
  const canReview = ["returned", "completed"].includes(booking.bookingStatus) && !review;

  return (
    <main className="page">
      <nav className="breadcrumbs">
        <Link to="/activity?tab=bookings">My activity</Link>
        <span>/</span>
        <span>Booking</span>
      </nav>

      <section className="page-heading">
        <div>
          <h1>{booking.item?.itemName}</h1>
          <p>
            {formatRange(booking.startDate, booking.endDate)} · {booking.quantity} unit(s) ·{" "}
            {booking.rentalAmount > 0 ? rupees(booking.rentalAmount) : "Free"}
          </p>
        </div>
        <BookingStatusBadge status={booking.bookingStatus} />
      </section>

      <div className="handover-meet" aria-hidden="true">
        <span className="half lender">Lender</span>
        <span className="meet-dot">Meet</span>
        <span className="half borrower">Borrower</span>
      </div>


      {actionMessage ? <div className="alert success">{actionMessage}</div> : null}
      {actionError ? <div className="alert error">{actionError}</div> : null}

      <div className="booking-grid">
        <section className="panel">
          <h2>
            <CalendarCheck size={18} /> Handover and return
          </h2>

          <div className="timeline">
            <div className="timeline-step done">
              <span />
              <div>
                <strong>Booking confirmed</strong>
                <p>{formatDateTime(booking.createdAt)}</p>
              </div>
            </div>
            <div className={`timeline-step ${booking.handoverStatus === "confirmed" ? "done" : ""}`}>
              <span />
              <div>
                <strong>Item handover</strong>
                <p>{booking.handoverAt ? formatDateTime(booking.handoverAt) : "Waiting for handover"}</p>
                {booking.initialCondition ? <p className="muted">{booking.initialCondition}</p> : null}
              </div>
            </div>
            <div className={`timeline-step ${booking.returnStatus === "confirmed" ? "done" : ""}`}>
              <span />
              <div>
                <strong>Item return</strong>
                <p>{booking.returnedAt ? formatDateTime(booking.returnedAt) : "Expected by the end date"}</p>
                {booking.finalCondition ? <p className="muted">{booking.finalCondition}</p> : null}
              </div>
            </div>
          </div>

          {canHandover ? (
            <form className="action-form" onSubmit={confirmHandover}>
              <label htmlFor="initialCondition">Initial condition</label>
              <textarea
                id="initialCondition"
                rows={3}
                required
                minLength={3}
                value={initialCondition}
                onChange={(event) => setInitialCondition(event.target.value)}
                placeholder="Record scratches, accessories, or packaging."
              />
              <button className="btn primary" type="submit">
                <PackageCheck size={17} /> Confirm handover
              </button>
            </form>
          ) : null}

          {canReturn ? (
            <form className="action-form" onSubmit={confirmReturn}>
              <label htmlFor="finalCondition">Final condition</label>
              <textarea
                id="finalCondition"
                rows={3}
                required
                minLength={3}
                value={finalCondition}
                onChange={(event) => setFinalCondition(event.target.value)}
                placeholder="Confirm the item is returned in the expected condition."
              />
              <button className="btn primary" type="submit">
                <PackageCheck size={17} /> Confirm return
              </button>
            </form>
          ) : null}
        </section>

        <section className="panel">
          <h2>People</h2>
          <div className="participant-list">
            <Link to={`/users/${booking.borrowerId}`} className="participant">
              <Avatar id={booking.borrowerId} name={booking.borrower?.name ?? "Borrower"} />
              <div>
                <strong>{booking.borrower?.name}</strong>
                <span className="muted small">Borrower</span>
              </div>
            </Link>
            <Link to={`/users/${booking.lenderId}`} className="participant">
              <Avatar id={booking.lenderId} name={booking.lender?.name ?? "Lender"} />
              <div>
                <strong>{booking.lender?.name}</strong>
                <span className="muted small">Lender</span>
              </div>
            </Link>
          </div>
        </section>

        <section className="panel">
          <h2>
            <Star size={18} /> Transaction review
          </h2>
          {review ? (
            <article className="review">
              <div className="review-head">
                <strong>Your review</strong>
                <span className="rating">
                  <Star size={14} fill="currentColor" /> {review.rating}
                </span>
              </div>
              <p>{review.comment}</p>
            </article>
          ) : canReview ? (
            <form className="review-form" onSubmit={submitReview}>
              <label>Overall rating</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value <= rating ? "active" : ""}
                    onClick={() => setRating(value)}
                    aria-label={`${value} star`}
                  >
                    <Star size={20} fill="currentColor" />
                  </button>
                ))}
              </div>
              <label htmlFor="comment">Comment</label>
              <textarea
                id="comment"
                rows={4}
                required
                minLength={10}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="How was communication, reliability, and item handling?"
              />
              <button className="btn primary" type="submit">
                Submit review
              </button>
            </form>
          ) : (
            <p className="muted">Reviews unlock after the item is confirmed returned.</p>
          )}
        </section>
      </div>
    </main>
  );
}
