import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      await login({
        email: email.trim(),
        password,
      });

      // Go to dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("LOGIN CONNECTION ERROR:", error);

      setError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Make sure the backend is running."
          : error.message || "Login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-background">
        <div className="auth-glow glow-one"></div>
        <div className="auth-glow glow-two"></div>
      </div>

      <div className="auth-container">

        {/* Brand */}

        <div className="auth-brand">

          <div className="brand-icon">
            <Swords size={30} />
          </div>

          <div>
            <h1>Life RPG</h1>
            <p>
              Turn your life into an adventure.
            </p>
          </div>

        </div>

        {/* Login Card */}

        <div className="auth-card">

          <div className="auth-card-header">

            <div className="auth-small-icon">
              <Sparkles size={20} />
            </div>

            <h2>Welcome Back, Hero</h2>

            <p>
              Enter the world and continue your journey.
            </p>

          </div>

          {/* Error */}

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* Email */}

            <div className="form-group">

              <label htmlFor="login-email">Email</label>

              <input
                id="login-email"
                type="email"
                placeholder="hero@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
                autoComplete="email"
                aria-invalid={Boolean(error)}
              />

            </div>

            {/* Password */}

            <div className="form-group">

              <label htmlFor="login-password">Password</label>

              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={loading}
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
              />

            </div>

            {/* Login Button */}

            <button
              type="submit"
              className="primary-button auth-button"
              disabled={loading}
            >
              {loading
                ? "Entering the Realm..."
                : "Enter the Realm"}
            </button>

          </form>

          <div className="auth-divider">
            <span>NEW HERO?</span>
          </div>

          <Link
            to="/signup"
            className="secondary-button"
          >
            Create New Character
          </Link>

          <div className="security-note">

            <ShieldCheck size={16} />

            <span>
              Your adventure data will be securely saved.
            </span>

          </div>

        </div>

        <p className="auth-footer">
          Life RPG • Build your character. Complete quests. Level up.
        </p>

      </div>

    </div>
  );
}

export default Login;