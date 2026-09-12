import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Dumbbell,
  Brain,
  Heart,
  Target,
  Shield,
  Sparkles,
  Coins,
} from "lucide-react";
import { apiUrl, authHeaders } from "../services/api";
import Navbar from "../components/Navbar";

function Character() {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(apiUrl("/api/character"), {
          headers: authHeaders(token),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load character."
          );
        }

        setCharacter(data.character);

      } catch (err) {
        console.error("Character loading error:", err);

        setError(
          err.message || "Unable to load character."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadCharacter();
    } else {
      setError("Please login first.");
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="page-loading" role="status" aria-live="polite">
        <Sparkles size={32} />
        <p>Loading your character...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error" role="alert">
        <h2>Character Loading Failed</h2>
        <p>{error}</p>

        <Link to="/login" className="primary-button">
          Return to Login
        </Link>
      </div>
    );
  }

  const user = character?.user;
  const attributes = character?.attributes;

  const stats = [
    {
      name: "Strength",
      value: attributes?.strength || 1,
      icon: Dumbbell,
      description: "Physical power and effort",
    },
    {
      name: "Intellect",
      value: attributes?.intellect || 1,
      icon: Brain,
      description: "Learning and mental growth",
    },
    {
      name: "Vitality",
      value: attributes?.vitality || 1,
      icon: Heart,
      description: "Health and energy",
    },
    {
      name: "Discipline",
      value: attributes?.discipline || 1,
      icon: Target,
      description: "Consistency and focus",
    },
  ];

  return (
    <div className="character-page">

      <Navbar />

      {/* MAIN */}

      <main className="character-container">

        <div className="character-header">

          <Link
            to="/dashboard"
            className="back-link"
          >
            <ArrowLeft size={18} />
            Dashboard
          </Link>

          <div>
            <h1>Character</h1>
            <p>
              View your hero's progression and attributes.
            </p>
          </div>

        </div>

        {/* CHARACTER CARD */}

        <section className="character-hero-card">

          <div className="character-avatar">
            <Shield size={58} />
          </div>

          <div className="character-info">

            <span className="character-label">
              YOUR HERO
            </span>

            <h2>{user?.name || "Hero"}</h2>

            <p>{user?.email}</p>

            <div className="character-level">
              <span>
                Level {user?.level || 1}
              </span>

              <span>
                {user?.xp || 0} XP
              </span>
            </div>

          </div>

          <div className="character-gold">

            <span>GOLD</span>

            <strong>
              <Coins size={18} aria-hidden="true" />
              {user?.gold || 0}
            </strong>

          </div>

        </section>

        {/* STATS */}

        <section>

          <div className="section-title">

            <div>
              <h2>Attributes</h2>
              <p>
                Your real-life actions shape these stats.
              </p>
            </div>

          </div>

          <div className="character-stats-grid">

            {stats.map((stat) => {

              const Icon = stat.icon;

              return (
                <div
                  className="character-stat-card"
                  key={stat.name}
                >

                  <div className="character-stat-icon">
                    <Icon size={26} />
                  </div>

                  <div className="character-stat-content">

                    <div className="character-stat-top">

                      <span>{stat.name}</span>

                      <strong>
                        {stat.value}
                      </strong>

                    </div>

                    <div className="character-stat-bar">
                      <div
                        style={{
                          width: `${Math.min(
                            stat.value * 5,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <p>
                      {stat.description}
                    </p>

                  </div>

                </div>
              );
            })}

          </div>

        </section>

        {/* JOURNEY */}

        <section className="character-journey-card">

          <div className="journey-icon">
            <Sparkles size={28} />
          </div>

          <div>
            <h3>Keep Building Your Hero</h3>

            <p>
              Complete quests to earn XP, Gold and
              attribute points. Every completed task
              moves your character forward.
            </p>
          </div>

        </section>

      </main>

    </div>
  );
}

export default Character;