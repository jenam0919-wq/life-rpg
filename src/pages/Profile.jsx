import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  User,
  Mail,
  Trophy,
  Coins,
  Flame,
  LogOut,
  Sparkles,
} from "lucide-react";
import { apiUrl, authHeaders } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(apiUrl("/api/character"), {
          headers: authHeaders(token),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile.");
        }

        setUser(data.character.user);
      } catch (error) {
        console.error("Profile loading error:", error);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate, token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="page-loading" role="status" aria-live="polite">
        <Sparkles size={32} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">

      <Navbar />

      {/* MAIN */}

      <main className="profile-container">

        <div className="profile-header">

          <div>

            <Link
              to="/dashboard"
              className="back-link"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <h1>My Profile</h1>

            <p>
              Manage your hero account and view your progress.
            </p>

          </div>

        </div>

        <div className="profile-top-grid">
          {/* PROFILE CARD */}

          <section className="profile-card">

          <div className="profile-avatar">
            <User size={52} />
          </div>

          <div className="profile-main-info">

            <span className="profile-label">
              HERO PROFILE
            </span>

            <h2>
              {user.name}
            </h2>

            <p>
              <Mail size={16} />
              {user.email}
            </p>

          </div>

          <div className="profile-level">

            <span>
              LEVEL
            </span>

            <strong>
              {user.level || 1}
            </strong>

          </div>

          </section>

          {/* ACCOUNT STATS */}

          <section className="profile-section">

          <div className="section-title">

            <div>
              <h2>Adventure Statistics</h2>

              <p>
                Your current Life RPG progress.
              </p>
            </div>

          </div>

          <div className="profile-stats-grid">

            <div className="profile-stat-card">

              <div className="profile-stat-icon">
                <Trophy size={24} />
              </div>

              <div>
                <span>Total XP</span>

                <strong>
                  {user.xp || 0}
                </strong>
              </div>

            </div>

            <div className="profile-stat-card">

              <div className="profile-stat-icon">
                <Coins size={24} />
              </div>

              <div>
                <span>Gold</span>

                <strong>
                  {user.gold || 0}
                </strong>
              </div>

            </div>

            <div className="profile-stat-card">

              <div className="profile-stat-icon">
                <Flame size={24} />
              </div>

              <div>
                <span>Current Streak</span>

                <strong>
                  {user.streak || 0} days
                </strong>
              </div>

            </div>

            <div className="profile-stat-card">

              <div className="profile-stat-icon">
                <Shield size={24} />
              </div>

              <div>
                <span>Character Level</span>

                <strong>
                  Level {user.level || 1}
                </strong>
              </div>

            </div>

          </div>

          </section>
        </div>

        {/* ACCOUNT INFORMATION */}

        <section className="profile-section">

          <div className="profile-information-card">

            <div className="information-header">

              <User size={22} />

              <h2>Account Information</h2>

            </div>

            <div className="information-row">

              <span>Character Name</span>

              <strong>
                {user.name}
              </strong>

            </div>

            <div className="information-row">

              <span>Email Address</span>

              <strong>
                {user.email}
              </strong>

            </div>

            <div className="information-row">

              <span>Account ID</span>

              <strong>
                #{user.id}
              </strong>

            </div>

          </div>

        </section>

        {/* LOGOUT */}

        <section className="profile-danger-zone">

          <div>

            <h3>Leave the Adventure</h3>

            <p>
              Logging out will end your current session.
              Your progress remains safely stored in the database.
            </p>

          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
          >
            <LogOut size={18} />
            Logout
          </button>

        </section>

      </main>

    </div>
  );
}

export default Profile;