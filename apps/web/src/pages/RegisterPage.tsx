import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    locality: "",
    city: "Pune",
    latitude: "",
    longitude: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function detectLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update("latitude", position.coords.latitude.toFixed(6));
        update("longitude", position.coords.longitude.toFixed(6));
      },
      () => setError("Location permission was denied. You can add it later."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const hasLocation = form.address && form.locality && form.latitude && form.longitude;
    if (hasLocation && (Number.isNaN(Number(form.latitude)) || Number.isNaN(Number(form.longitude)))) {
      setError("Enter valid numeric coordinates or remove the location fields.");
      setLoading(false);
      return;
    }

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        location: hasLocation
          ? {
              address: form.address.trim(),
              locality: form.locality.trim(),
              city: form.city.trim() || "Pune",
              latitude: Number(form.latitude),
              longitude: Number(form.longitude),
            }
          : undefined,
      });
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card wide">
        <h1>Create your LENDLY account</h1>
        <p className="muted">One account lets you borrow and lend within the local community.</p>

        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              required
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Your name"
            />
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="you@example.com"
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="8+ characters, A-Z, a-z and 0-9"
            />
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              placeholder="+91 90000 00000"
            />
          </div>

          <div className="divider">
            <span>General location (optional)</span>
          </div>
          <p className="muted small">
            This helps nearby discovery without sharing your exact home address in listings.
          </p>
          <button type="button" className="btn outline small" onClick={detectLocation}>
            Use my current location
          </button>

          <div className="form-grid">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
              placeholder="Hostel or building name"
            />
            <label htmlFor="locality">Locality</label>
            <input
              id="locality"
              value={form.locality}
              onChange={(event) => update("locality", event.target.value)}
              placeholder="MIT-ADT, Kothrud, Baner…"
            />
            <label htmlFor="city">City</label>
            <input id="city" value={form.city} onChange={(event) => update("city", event.target.value)} />
            <label htmlFor="latitude">Latitude</label>
            <input id="latitude" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} />
            <label htmlFor="longitude">Longitude</label>
            <input
              id="longitude"
              value={form.longitude}
              onChange={(event) => update("longitude", event.target.value)}
            />
          </div>

          {error ? <div className="alert error">{error}</div> : null}
          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Already registered? Log in</Link>
        </div>
      </div>
    </main>
  );
}
