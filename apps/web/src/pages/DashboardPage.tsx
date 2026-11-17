import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, CalendarClock, PackagePlus, Search, ShieldCheck } from "lucide-react";
import type { Booking, BorrowRequest } from "@lendly/shared";
import { useAuth } from "../context/AuthContext";
import { request } from "../utils/api";
import { formatRange, rupees } from "../utils/format";
import { RequestStatusBadge, BookingStatusBadge } from "../components/StatusBadge";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incoming, setIncoming] = useState<BorrowRequest[]>([]);
  const [outgoing, setOutgoing] = useState<BorrowRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [incomingData, outgoingData, bookingData] = await Promise.all([
          request<{ data: BorrowRequest[] }>("/api/requests/incoming"),
          request<{ data: BorrowRequest[] }>("/api/requests/outgoing"),
          request<{ data: Booking[] }>("/api/bookings"),
        ]);
        if (!active) return;
        setIncoming(incomingData.data.slice(0, 4));
        setOutgoing(outgoingData.data.slice(0, 4));
        setBookings(bookingData.data.slice(0, 4));
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <h1>Hi {user?.name.split(" ")[0]}, welcome to LENDLY</h1>
          <p>Manage nearby discovery, lending requests, and item returns in one place.</p>
        </div>
        <div className="heading-actions">
          <Link className="btn primary" to="/explore">
            <Search size={18} /> Find items
          </Link>
          <Link className="btn outline" to="/listings/new">
            <PackagePlus size={18} /> Add listing
          </Link>
        </div>
      </section>

      {error ? <div className="alert error">{error}</div> : null}

      <section className="summary-grid">
        <article className="summary-card">
          <span className="summary-icon">
            <ShieldCheck size={20} />
          </span>
          <h3>{incoming.filter((item) => item.requestStatus === "pending").length}</h3>
          <p>Pending requests to review</p>
          <Link to="/activity?tab=incoming">Review requests <ArrowRight size={14} /></Link>
        </article>
        <article className="summary-card">
          <span className="summary-icon">
            <CalendarClock size={20} />
          </span>
          <h3>{outgoing.filter((item) => item.requestStatus === "pending").length}</h3>
          <p>Your pending borrow requests</p>
          <Link to="/activity?tab=borrowing">See requests <ArrowRight size={14} /></Link>
        </article>
        <article className="summary-card">
          <span className="summary-icon">
            <Bell size={20} />
          </span>
          <h3>{bookings.length}</h3>
          <p>Recent bookings</p>
          <Link to="/activity?tab=bookings">Manage bookings <ArrowRight size={14} /></Link>
        </article>
      </section>

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>Incoming lending requests</h2>
            <Link to="/activity?tab=incoming" className="link-button">
              View all
            </Link>
          </div>
          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && incoming.length === 0 ? <p className="empty">No incoming requests yet.</p> : null}
          <div className="activity-list">
            {incoming.map((borrowRequest) => (
              <article key={borrowRequest.id} className="activity-row">
                <div className="activity-main">
                  <strong>{borrowRequest.item?.itemName ?? "Item"}</strong>
                  <p>
                    {borrowRequest.borrower?.name} · {formatRange(borrowRequest.startDate, borrowRequest.endDate)}
                  </p>
                </div>
                <RequestStatusBadge status={borrowRequest.requestStatus} />
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Active bookings</h2>
            <Link to="/activity?tab=bookings" className="link-button">
              View all
            </Link>
          </div>
          {loading ? <p className="muted">Loading…</p> : null}
          {!loading && bookings.length === 0 ? <p className="empty">No bookings yet.</p> : null}
          <div className="activity-list">
            {bookings.map((booking) => (
              <Link key={booking.id} to={`/bookings/${booking.id}`} className="activity-row">
                <div className="activity-main">
                  <strong>{booking.item?.itemName ?? "Item"}</strong>
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
      </div>
    </main>
  );
}
