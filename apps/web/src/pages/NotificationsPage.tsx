import { useCallback, useEffect, useState } from "react";
import { BellRing, CheckCheck } from "lucide-react";
import type { Notification } from "@lendly/shared";
import { request } from "../utils/api";
import { formatDateTime } from "../utils/format";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<{ data: Notification[] }>("/api/notifications");
      setNotifications(data.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    await request(`/api/notifications/${id}/read`, { method: "PATCH" });
    await load();
  }

  async function markAllRead() {
    await request("/api/notifications/read-all", { method: "PATCH" });
    await load();
  }

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <h1>Notifications</h1>
          <p>Requests, bookings, returns, reviews, and moderation updates.</p>
        </div>
        <button className="btn outline" type="button" onClick={() => void markAllRead()}>
          <CheckCheck size={18} /> Mark all read
        </button>
      </section>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="loading-state">Loading notifications…</div> : null}

      {!loading && notifications.length === 0 ? (
        <section className="empty-panel">
          <BellRing size={28} />
          <h2>No notifications yet</h2>
          <p>You will see activity updates here.</p>
        </section>
      ) : null}

      <div className="notification-list">
        {notifications.map((notification) => (
          <article key={notification.id} className={`notification ${notification.isRead ? "" : "unread"}`}>
            <div>
              <strong>{notification.message}</strong>
              <p className="muted small">{formatDateTime(notification.createdAt)}</p>
            </div>
            {notification.isRead ? (
              <span className="muted small">Read</span>
            ) : (
              <button className="btn small ghost" type="button" onClick={() => void markRead(notification.id)}>
                Mark read
              </button>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
