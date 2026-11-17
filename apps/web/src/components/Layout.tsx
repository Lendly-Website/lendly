import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  Search,
  ShieldCheck,
  Star,
  UserCircle,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { request } from "../utils/api";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    let active = true;
    async function loadCount() {
      try {
        const data = await request<{ unreadCount: number }>("/api/notifications");
        if (active) setUnreadCount(data.unreadCount);
      } catch {
        /* silent */
      }
    }
    void loadCount();
    return () => {
      active = false;
    };
  }, [user, location.pathname]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="LENDLY home">
            <span className="brand-mark">L</span>
            <span className="brand-text">
              LENDLY
              <small>Pune Sharing Network</small>
            </span>
          </Link>

          <nav className={`main-nav ${menuOpen ? "open" : ""}`}>
            {user ? (
              <>
                <NavLink to="/dashboard" end>
                  <LayoutDashboard size={17} /> Dashboard
                </NavLink>
                <NavLink to="/explore">
                  <Search size={17} /> Explore
                </NavLink>
                <NavLink to="/listings/new">
                  <PackagePlus size={17} /> List an item
                </NavLink>
                <NavLink to="/activity">My activity</NavLink>
                <NavLink to="/profile">
                  <UserCircle size={17} /> Profile
                </NavLink>
                {user.role === "admin" ? (
                  <NavLink to="/admin">
                    <ShieldCheck size={17} /> Admin
                  </NavLink>
                ) : null}
              </>
            ) : (
              <>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/explore">Explore</NavLink>
                <NavLink to="/register">Become a lender</NavLink>
              </>
            )}
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                <Link to="/notifications" className="icon-button" aria-label="Notifications">
                  <Bell size={19} />
                  {unreadCount > 0 ? <span>{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
                </Link>
                <button className="icon-button" onClick={() => logout("/login")} type="button" aria-label="Log out">
                  <LogOut size={19} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn ghost small">
                  Log in
                </Link>
                <Link to="/register" className="btn outline small">
                  Get started
                </Link>
              </>
            )}
            <button
              type="button"
              className="icon-button menu-toggle"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="content">{children}</div>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-mark">L</span>
            <div>
              <strong>LENDLY</strong>
              <p>Borrow more. Buy less. Share better.</p>
            </div>
            <span className="footer-badge">
              <Star size={14} fill="currentColor" /> 4.8 average community rating
            </span>
            <p className="footer-note">
              A peer-to-peer borrowing network for MIT-ADT University and nearby Pune communities.
            </p>
          </div>

          <nav className="footer-col" aria-label="Browse items">
            <h3>Browse</h3>
            <Link to="/explore">Explore nearby items</Link>
            <Link to="/explore?category=Books%20%26%20Stationery">Books & Stationery</Link>
            <Link to="/explore?category=Electronics">Electronics</Link>
            <Link to="/explore?category=Tools%20%26%20Equipment">Tools & Equipment</Link>
            <Link to="/explore?category=Sports%20%26%20Fitness">Sports & Fitness</Link>
          </nav>

          <nav className="footer-col" aria-label="Lend items">
            <h3>Lend</h3>
            <Link to="/listings/new">List an item</Link>
            <Link to="/register">Become a lender</Link>
            <a href="/#flow">How borrowing works</a>
            <Link to="/explore?category=Home%20%26%20Cleaning">Home & Cleaning</Link>
            <Link to="/explore?category=Travel%20%26%20Camping">Travel & Camping</Link>
          </nav>

          <nav className="footer-col" aria-label="Account">
            <h3>Account</h3>
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/activity">My activity</Link>
                <Link to="/notifications">Notifications</Link>
                <Link to="/profile">Profile</Link>
                {user.role === "admin" ? <Link to="/admin">Admin dashboard</Link> : null}
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link to="/register">Create an account</Link>
                <Link to="/explore">Browse listings</Link>
                <Link to="/forgot-password">Forgot password</Link>
              </>
            )}
          </nav>
        </div>

        <div className="footer-bottom">
          <span className="footer-trust">
            <ShieldCheck size={14} /> Lender approval first · Date-aware availability · Return tracking
          </span>
        </div>
      </footer>
    </div>
  );
}
