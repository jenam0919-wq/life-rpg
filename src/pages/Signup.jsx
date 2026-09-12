import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  UserPlus,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Password must be 72 UTF-8 bytes or fewer.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);

      setError(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Make sure the backend is running."
          : error.message || "Signup failed."
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

        <div className="auth-brand">

          <div className="brand-icon">
            <Swords size={30} />
          </div>

          <div>
            <h1>Life RPG</h1>
            <p>Turn your life into an adventure.</p>
          </div>

        </div>

        <div className="auth-card">

          <div className="auth-card-header">

            <div className="auth-small-icon">
              <UserPlus size={20} />
            </div>

            <h2>Create Your Character</h2>

            <p>
              Begin your journey and build your real-life hero.
            </p>

          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup}>

            <div className="form-group">

              <label htmlFor="signup-name">Character Name</label>

              <input
                id="signup-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
              />

            </div>

            <div className="form-group">

              <label htmlFor="signup-email">Email</label>

              <input
                id="signup-email"
                type="email"
                placeholder="hero@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />

            </div>

            <div className="form-group">

              <label htmlFor="signup-password">Password</label>

              <input
                id="signup-password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />

            </div>

            <div className="form-group">

              <label htmlFor="signup-confirm-password">Confirm Password</label>

              <input
                id="signup-confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                disabled={loading}
                autoComplete="new-password"
              />

            </div>

            <button
              type="submit"
              className="primary-button auth-button"
              disabled={loading}
            >
              {loading
                ? "Creating Character..."
                : "Begin Your Adventure"}
            </button>

          </form>

          <div className="auth-divider">
            <span>ALREADY A HERO?</span>
          </div>

          <Link
            to="/login"
            className="secondary-button"
          >
            Return to Login
          </Link>

          <div className="security-note">

            <ShieldCheck size={16} />

            <span>
              Your account and adventure data are securely saved.
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

export default Signup;