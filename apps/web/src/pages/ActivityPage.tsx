import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Booking, BorrowRequest } from "@lendly/shared";
import { request } from "../utils/api";
import { formatRange, rupees } from "../utils/format";
import { BookingStatusBadge, RequestStatusBadge } from "../components/StatusBadge";

type Tab = "incoming" | "borrowing" | "bookings";

export default function ActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "incoming");
  const [incoming, setIncoming] = useState<BorrowRequest[]>([]);
  const [borrowing, setBorrowing] = useState<BorrowRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incomingData, outgoingData, bookingData] = await Promise.all([
        request<{ data: BorrowRequest[] }>("/api/requests/incoming"),
        request<{ data: BorrowRequest[] }>("/api/requests/outgoing"),
        request<{ data: Booking[] }>("/api/bookings"),
      ]);
      setIncoming(incomingData.data);
      setBorrowing(outgoingData.data);
      setBookings(bookingData.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    setSearchParams({ tab: nextTab });
  }

  async function updateRequestStatus(requestId: string, action: "accept" | "reject" | "cancel") {
    await request(`/api/requests/${requestId}/${action}`, { method: "PATCH" });
    await load();
  }

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <h1>My activity</h1>
          <p>Track lending requests, borrowing requests, and bookings.</p>
        </div>
      </section>

      <div className="tab-row" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "incoming"} className={tab === "incoming" ? "active" : ""} onClick={() => changeTab("incoming")}>
          Incoming requests
        </button>
        <button type="button" role="tab" aria-selected={tab === "borrowing"} className={tab === "borrowing" ? "active" : ""} onClick={() => changeTab("borrowing")}>
          My borrow requests
        </button>
        <button type="button" role="tab" aria-selected={tab === "bookings"} className={tab === "bookings" ? "active" : ""} onClick={() => changeTab("bookings")}>
          Bookings
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="loading-state">Loading activity…</div> : null}

      {!loading && tab === "incoming" ? (
        <section className="panel">
          {incoming.length === 0 ? <p className="empty">No incoming requests yet.</p> : null}
          <div className="request-list">
            {incoming.map((borrowRequest) => (
              <article key={borrowRequest.id} className="request-card">
                <img src={borrowRequest.item?.images[0]} alt={borrowRequest.item?.itemName} />
                <div className="request-main">
                  <h3>{borrowRequest.item?.itemName}</h3>
                  <p>
                    From {borrowRequest.borrower?.name} · {formatRange(borrowRequest.startDate, borrowRequest.endDate)} ·{" "}
                    {borrowRequest.requestedQuantity} unit(s)
                  </p>
                  {borrowRequest.message ? <blockquote>{borrowRequest.message}</blockquote> : null}
                </div>
                <div className="request-actions">
                  <RequestStatusBadge status={borrowRequest.requestStatus} />
                  {borrowRequest.requestStatus === "pending" ? (
                    <>
                      <button type="button" className="btn petrol small" onClick={() => void updateRequestStatus(borrowRequest.id, "accept")}>
                        Accept
                      </button>
                      <button type="button" className="btn outline small" onClick={() => void updateRequestStatus(borrowRequest.id, "reject")}>
                        Reject
                      </button>
                    </>
                  ) : borrowRequest.bookingId ? (
                    <Link className="btn ghost small" to={`/bookings/${borrowRequest.bookingId}`}>
                      View booking
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && tab === "borrowing" ? (
        <section className="panel">
          {borrowing.length === 0 ? <p className="empty">You have not requested any items yet.</p> : null}
          <div className="request-list">
            {borrowing.map((borrowRequest) => (
              <article key={borrowRequest.id} className="request-card">
                <img src={borrowRequest.item?.images[0]} alt={borrowRequest.item?.itemName} />
                <div className="request-main">
                  <h3>{borrowRequest.item?.itemName}</h3>
                  <p>
                    To {borrowRequest.lender?.name} · {formatRange(borrowRequest.startDate, borrowRequest.endDate)} ·{" "}
                    {borrowRequest.requestedQuantity} unit(s)
                  </p>
                  {borrowRequest.message ? <blockquote>{borrowRequest.message}</blockquote> : null}
                </div>
                <div className="request-actions">
                  <RequestStatusBadge status={borrowRequest.requestStatus} />
                  {borrowRequest.requestStatus === "pending" ? (
                    <button type="button" className="btn outline small" onClick={() => void updateRequestStatus(borrowRequest.id, "cancel")}>
                      Cancel
                    </button>
                  ) : borrowRequest.bookingId ? (
                    <Link className="btn ghost small" to={`/bookings/${borrowRequest.bookingId}`}>
                      View booking
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && tab === "bookings" ? (
        <section className="panel">
          {bookings.length === 0 ? <p className="empty">No bookings yet.</p> : null}
          <div className="booking-list">
            {bookings.map((booking) => (
              <Link key={booking.id} to={`/bookings/${booking.id}`} className="booking-row">
                <img src={booking.item?.images[0]} alt={booking.item?.itemName} />
                <div>
                  <strong>{booking.item?.itemName}</strong>
                  <p>
                    {formatRange(booking.startDate, booking.endDate)} ·{" "}
                    {booking.rentalAmount > 0 ? rupees(booking.rentalAmount) : "Free"}
                  </p>
                </div>
                <BookingStatusBadge status={booking.bookingStatus} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
