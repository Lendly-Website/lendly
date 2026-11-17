import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { request } from "../utils/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await request("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: token.trim(), password }),
      });
      navigate("/login", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Set a new password</h1>
        <p className="muted">Use a strong password you have not used before.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="token">Reset token</label>
          <textarea
            id="token"
            required
            rows={3}
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <div className="alert error">{error}</div> : null}
          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </main>
  );
}
