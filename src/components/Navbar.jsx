import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, Sword, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/dashboard", "Dashboard"],
  ["/quests", "Quests"],
  ["/history", "History"],
  ["/character", "Character"],
  ["/rewards", "Rewards"],
  ["/profile", "Profile"],
];

function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="dashboard-navbar" aria-label="Main navigation">
      <NavLink to="/dashboard" className="dashboard-logo" aria-label="Life RPG dashboard">
        <span className="dashboard-logo-icon"><Sword size={22} aria-hidden="true" /></span>
        <span>Life RPG</span>
      </NavLink>
      <button
        type="button"
        className="dashboard-mobile-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-controls="main-navigation-links"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>
      <div
        id="main-navigation-links"
        className={`dashboard-nav-links${menuOpen ? " is-open" : ""}`}
      >
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => isActive ? "active" : undefined}
          >
            {label}
          </NavLink>
        ))}
      </div>
      <button type="button" className="dashboard-logout" onClick={handleLogout}>
        <LogOut size={16} aria-hidden="true" />
        <span>Logout</span>
      </button>
    </nav>
  );
}

export default Navbar;
