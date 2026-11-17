import { useCallback, useEffect, useState } from "react";
import { BarChart3, Flag, Package, ShieldCheck, Users } from "lucide-react";
import type { Report, UserPublic } from "@lendly/shared";
import type { VerificationStatus } from "@lendly/shared";
import { request } from "../utils/api";
import { formatDateTime } from "../utils/format";
import { VerificationBadge } from "../components/StatusBadge";

type AdminStats = {
  users: number;
  listings: number;
  activeListings: number;
  requests: number;
  bookings: number;
  completedReturns: number;
  openReports: number;
  reviews: number;
};

type AdminItem = {
  id: string;
  itemName: string;
  listingStatus: string;
  category: string;
  ownerId: { id?: string; name?: string };
  createdAt: string;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, listingsData, reportData] = await Promise.all([
        request<{ data: AdminStats }>("/api/admin/stats"),
        request<{ data: UserPublic[] }>("/api/admin/users?limit=50"),
        request<{ data: AdminItem[] }>("/api/admin/listings?limit=50"),
        request<{ data: Report[] }>("/api/admin/reports?limit=50"),
      ]);
      setStats(statsData.data);
      setUsers(usersData.data);
      setItems(listingsData.data);
      setReports(reportData.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateUser(id: string, updates: { isSuspended?: boolean; verificationStatus?: VerificationStatus }) {
    await request(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    await load();
  }

  async function moderateListing(id: string, listingStatus: string) {
    await request(`/api/admin/listings/${id}/moderate`, {
      method: "PATCH",
      body: JSON.stringify({ listingStatus }),
    });
    await load();
  }

  async function resolveReport(id: string, status: string) {
    await request(`/api/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, resolution: status === "resolved" ? "Reviewed by admin" : "" }),
    });
    await load();
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading-state">Loading admin dashboard…</div>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="page-heading">
        <div>
          <h1>Admin dashboard</h1>
          <p>Monitor platform activity and manage trust and safety.</p>
        </div>
        <ShieldCheck size={28} />
      </section>

      {error ? <div className="alert error">{error}</div> : null}

      {stats ? (
        <section className="stats-grid">
          {[
            { label: "Users", value: stats.users, icon: Users },
            { label: "Listings", value: stats.listings, icon: Package },
            { label: "Requests", value: stats.requests, icon: BarChart3 },
            { label: "Bookings", value: stats.bookings, icon: BarChart3 },
            { label: "Completed returns", value: stats.completedReturns, icon: BarChart3 },
            { label: "Open reports", value: stats.openReports, icon: Flag },
          ].map((stat) => (
            <article key={stat.label} className="stat-card">
              <stat.icon size={20} />
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <h2>User management</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td className="muted">{user.email}</td>
                  <td>
                    {user.isSuspended ? (
                      <span className="badge danger">Suspended</span>
                    ) : (
                      <VerificationBadge status={user.verificationStatus} />
                    )}
                  </td>
                  <td className="row-actions">
                    <button
                      className="btn small ghost"
                      type="button"
                      onClick={() =>
                        void updateUser(user.id, {
                          verificationStatus: user.verificationStatus === "verified" ? "unverified" : "verified",
                        })
                      }
                    >
                      {user.verificationStatus === "verified" ? "Unverify" : "Verify"}
                    </button>
                    <button
                      className="btn small danger"
                      type="button"
                      onClick={() => void updateUser(user.id, { isSuspended: !user.isSuspended })}
                    >
                      {user.isSuspended ? "Restore" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Listing moderation</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.itemName}</td>
                  <td className="muted">{item.ownerId?.name ?? "Unknown"}</td>
                  <td>{item.listingStatus}</td>
                  <td className="row-actions">
                    <button
                      className="btn small outline"
                      type="button"
                      onClick={() =>
                        void moderateListing(item.id, item.listingStatus === "active" ? "paused" : "active")
                      }
                    >
                      {item.listingStatus === "active" ? "Pause" : "Activate"}
                    </button>
                    <button
                      className="btn small danger"
                      type="button"
                      onClick={() => void moderateListing(item.id, "removed")}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Reports</h2>
        </div>
        {reports.length === 0 ? (
          <p className="empty">No reports yet.</p>
        ) : (
          <div className="report-list">
            {reports.map((report) => (
              <article key={report.id} className="report-card">
                <div>
                  <div className="report-head">
                    <strong>{report.targetType} reported</strong>
                    <span className={`badge ${report.status === "open" ? "warning" : "neutral"}`}>{report.status}</span>
                  </div>
                  <p>{report.details}</p>
                  <span className="muted small">
                    By {report.reporter?.name ?? "User"} · {formatDateTime(report.createdAt)}
                  </span>
                </div>
                <div className="report-actions">
                  <button className="btn small outline" type="button" onClick={() => void resolveReport(report.id, "reviewing")}>
                    Reviewing
                  </button>
                  <button className="btn small primary" type="button" onClick={() => void resolveReport(report.id, "resolved")}>
                    Resolve
                  </button>
                  <button className="btn small ghost" type="button" onClick={() => void resolveReport(report.id, "dismissed")}>
                    Dismiss
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
