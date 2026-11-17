import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Compass,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Star,
  Undo2,
} from "lucide-react";
import { ITEM_CATEGORIES } from "@lendly/shared";
import { CategoryIcon } from "../components/CategoryIcon";

export default function LandingPage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <MapPin size={16} /> MIT-ADT University &amp; nearby Pune
          </span>
          <h1>
            Borrow what you need.
            <br />
            Lend what you don&apos;t use.
          </h1>
          <p>
            LENDLY connects people with underused belongings to neighbours and students who need them for a few hours
            or days. Search locally, request the exact dates, and keep every handover organized.
          </p>
          <div className="hero-actions">
            <Link to="/explore" className="btn primary">
              <PackageSearch size={18} /> Explore nearby items
            </Link>
            <Link to="/register" className="btn outline">
              List an item <ArrowRight size={18} />
            </Link>
          </div>
          <div className="trust-row">
            <span>
              <ShieldCheck size={17} /> Lender approval first
            </span>
            <span>
              <CalendarCheck size={17} /> Date-aware availability
            </span>
            <span>
              <Undo2 size={17} /> Return tracking
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card main">
            <div className="hero-image">
              <img
                src="https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80"
                alt=""
              />
            </div>
            <div className="hero-card-body">
              <span className="category-chip">Projectors & Event Gear</span>
              <strong>HD Portable Projector</strong>
              <p>700 m away · ₹180/day · Like new</p>
            </div>
          </div>
          <div className="hero-card floating">
            <BadgeCheck />
            <div>
              <strong>Request accepted</strong>
              <p>Handover is scheduled for 11:00 AM</p>
            </div>
          </div>
          <div className="hero-card rating">
            <Star fill="currentColor" />
            <div>
              <strong>4.8 community rating</strong>
              <p>Borrowers and lenders both review.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Browse what your neighbourhood already owns</h2>
          <p>From calculators and projectors to tools, speakers, and camping gear.</p>
        </div>
        <div className="category-grid">
          {ITEM_CATEGORIES.map((category) => (
            <Link key={category} to={`/explore?category=${encodeURIComponent(category)}`} className="category-tile">
              <CategoryIcon category={category} size={24} />
              <span>{category}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section how" id="flow">
        <div className="section-heading">
          <h2>A transparent borrowing flow</h2>
          <p>No hidden assumptions. Both people know exactly what is happening.</p>
        </div>
        <div className="steps-grid">
          {[
            {
              title: "Search locally",
              body: "Set your location and start with a 1,000 m radius. Expand only when you choose to.",
            },
            {
              title: "Request exact dates",
              body: "The platform checks overlapping bookings before the lender can approve.",
            },
            {
              title: "Confirm handover",
              body: "Record the exchange and initial item condition in the booking.",
            },
            {
              title: "Return and review",
              body: "Confirm the return, then rate communication, reliability, and item handling.",
            },
          ].map((step, index) => (
            <article key={step.title} className="step-card">
              <span className="step-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-panel">
        <div>
          <h2>Ready to reduce unnecessary purchases?</h2>
          <p>Join the local sharing community and put useful items back to work.</p>
        </div>
        <div className="cta-actions">
          <Link to="/register" className="btn outline">
            Create an account
          </Link>
          <Link to="/explore" className="btn light">
            <Compass size={18} /> Browse listings
          </Link>
        </div>
      </section>
    </main>
  );
}
