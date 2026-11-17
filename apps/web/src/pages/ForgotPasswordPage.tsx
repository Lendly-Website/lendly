import { useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetToken(null);
    try {
      const data = await request<{ data: { message: string; resetToken?: string } }>(
        "/api/auth/forgot-password",
        { method: "POST", body: JSON.stringify({ email: email.trim() }) },
      );
      setMessage(data.data.message);
      setResetToken(data.data.resetToken ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start password reset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Reset your password</h1>
        <p className="muted">Enter your registered email address.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? "Working…" : "Continue"}
          </button>
        </form>
        {message ? <div className="alert success">{message}</div> : null}
        {resetToken ? (
          <div className="alert warning">
            <strong>Development reset token</strong>
            <p className="mono">{resetToken}</p>
            <Link className="btn small outline" to={`/reset-password?token=${resetToken}`}>
              Continue to reset
            </Link>
          </div>
        ) : null}
        {error ? <div className="alert error">{error}</div> : null}
        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </main>
  );
}
