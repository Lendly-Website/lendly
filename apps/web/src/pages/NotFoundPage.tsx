import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page">
      <section className="empty-panel">
        <h2>Page not found</h2>
        <p>The page you are looking for may have moved or no longer exists.</p>
        <div className="expand-options">
          <Link className="btn primary" to="/">
            Go home
          </Link>
          <Link className="btn outline" to="/explore">
            Explore items
          </Link>
        </div>
      </section>
    </main>
  );
}
