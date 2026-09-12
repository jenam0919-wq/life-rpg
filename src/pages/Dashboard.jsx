import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sword,
  Brain,
  Heart,
  Shield,
  Coins,
  Flame,
  Trophy,
  Target,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { apiUrl, authHeaders } from "../services/api";
import Navbar from "../components/Navbar";

function calculateLevelProgress(xp) {
  let remainingXP = xp;
  let level = 1;
  let requiredXP = 100;

  while (remainingXP >= requiredXP) {
    remainingXP -= requiredXP;
    level++;
    requiredXP = Math.floor(requiredXP * 1.25);
  }

  return {
    level,
    currentXP: remainingXP,
    requiredXP,
    percentage: Math.min(
      (remainingXP / requiredXP) * 100,
      100
    ),
  };
}

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [quests, setQuests] = useState([]);
  const [attributes, setAttributes] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          navigate("/login");
          return;
        }

        const questsResponse =
          await fetch(apiUrl("/api/quests"), {
            headers: authHeaders(token),
          });

        const questsData =
          await questsResponse.json();

        if (!questsResponse.ok) {
          throw new Error(
            questsData.message ||
              "Failed to load quests."
          );
        }

        setQuests(
          questsData.quests || []
        );

        const characterResponse =
          await fetch(
            apiUrl("/api/character"),
            {
              headers: authHeaders(token),
            }
          );

        const characterData =
          await characterResponse.json();

        if (characterResponse.ok) {
          setUser(
            characterData.character.user
          );

          setAttributes(
            characterData.character.attributes
          );

        }
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );

        setError(
          error.message ||
            "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="page-loading" role="status" aria-live="polite">
        <Sparkles size={32} />
        <p>Loading your adventure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error" role="alert">
        <h2>Dashboard Loading Failed</h2>

        <p>{error}</p>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            window.location.reload()
          }
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalXP = user?.xp || 0;

  const progression =
    calculateLevelProgress(totalXP);

  const activeQuests =
    quests.filter(
      (quest) =>
        quest.completed === 0
    );

  const completedQuests =
    quests.filter(
      (quest) =>
        quest.completed === 1
    );

  const statList = [
    {
      name: "Strength",
      value:
        attributes?.strength || 1,
      icon: Sword,
    },
    {
      name: "Intellect",
      value:
        attributes?.intellect || 1,
      icon: Brain,
    },
    {
      name: "Vitality",
      value:
        attributes?.vitality || 1,
      icon: Heart,
    },
    {
      name: "Discipline",
      value:
        attributes?.discipline || 1,
      icon: Shield,
    },
  ];

  return (
    <div className="dashboard-page">

      {/* NAVBAR */}

      <Navbar />


      {/* MAIN */}

      <main className="dashboard-container">

        {/* HERO */}

        <section className="dashboard-welcome">

          <div>

            <span className="dashboard-eyebrow">
              YOUR ADVENTURE
            </span>

            <h1>
              Welcome back,{" "}
              {user?.name || "Hero"}!
            </h1>

            <p>
              Complete quests, earn rewards
              and build your real-life character.
            </p>

          </div>

          <Link
            to="/quests"
            className="primary-button dashboard-create-button"
          >
            <Target size={18} />
            Create Quest
          </Link>

        </section>


        {/* LEVEL CARD */}

        <section className="dashboard-level-card">

          <div className="dashboard-level-top">

            <div className="dashboard-level-info">

              <div className="dashboard-level-badge">
                <Trophy size={25} />
              </div>

              <div>

                <span>
                  CURRENT LEVEL
                </span>

                <h2>
                  Level {progression.level}
                </h2>

              </div>

            </div>

            <div className="dashboard-xp-text">

              <strong>
                {progression.currentXP}
              </strong>

              <span>
                / {progression.requiredXP} XP
              </span>

            </div>

          </div>


          <div className="dashboard-xp-track">

            <div
              className="dashboard-xp-fill"
              style={{
                width: `${progression.percentage}%`,
              }}
            />

          </div>


          <div className="dashboard-xp-footer">

            <span>
              {Math.round(
                progression.percentage
              )}% to next level
            </span>

            <span>
              Total XP: {totalXP}
            </span>

          </div>

        </section>


        {/* STATS */}

        <section className="dashboard-stats-grid">

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon xp">
              <Sparkles size={22} />
            </div>

            <div>
              <span>Total XP</span>
              <strong>{totalXP}</strong>
            </div>

          </div>


          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon gold">
              <Coins size={22} />
            </div>

            <div>
              <span>Gold</span>
              <strong>
                {user?.gold || 0}
              </strong>
            </div>

          </div>


          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon streak">
              <Flame size={22} />
            </div>

            <div>
              <span>Streak</span>
              <strong>
                {user?.streak || 0}
              </strong>
              <small>days</small>
            </div>

          </div>


          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon quest">
              <Target size={22} />
            </div>

            <div>
              <span>Active Quests</span>
              <strong>
                {activeQuests.length}
              </strong>
            </div>

          </div>

        </section>


        {/* CONTENT GRID */}

        <div className="dashboard-content-grid">


          {/* ACTIVE QUESTS */}

          <section className="dashboard-section dashboard-quests-section">

            <div className="dashboard-section-header">

              <div>

                <span className="dashboard-section-label">
                  MISSIONS
                </span>

                <h2>
                  Active Quests
                </h2>

              </div>

              <Link to="/quests">
                View All
                <ArrowRight size={16} />
              </Link>

            </div>


            {activeQuests.length === 0 ? (

              <div className="dashboard-empty">

                <Sparkles size={32} />

                <h3>
                  No active quests
                </h3>

                <p>
                  Create your first mission
                  and start earning XP.
                </p>

                <Link
                  to="/quests"
                  className="secondary-button"
                >
                  Create Quest
                </Link>

              </div>

            ) : (

              <div className="dashboard-quest-list">

                {activeQuests
                  .slice(0, 5)
                  .map((quest) => {

                    const Icon =
                      quest.category ===
                      "Strength"
                        ? Sword
                        : quest.category ===
                          "Intellect"
                        ? Brain
                        : quest.category ===
                          "Vitality"
                        ? Heart
                        : Shield;

                    return (

                      <Link
                        to="/quests"
                        className="dashboard-quest-item"
                        key={quest.id}
                      >

                        <div className="dashboard-quest-icon">
                          <Icon size={19} />
                        </div>

                        <div className="dashboard-quest-info">

                          <strong>
                            {quest.title}
                          </strong>

                          <span>
                            {quest.category}
                          </span>

                        </div>

                        <div className="dashboard-quest-reward">

                          <Sparkles size={14} />

                          +{quest.xp_reward}

                        </div>

                      </Link>

                    );
                  })}

              </div>

            )}

          </section>


          {/* CHARACTER STATS */}

          <section className="dashboard-section">

            <div className="dashboard-section-header">

              <div>

                <span className="dashboard-section-label">
                  CHARACTER
                </span>

                <h2>
                  Attributes
                </h2>

              </div>

              <Link to="/character">
                View
                <ArrowRight size={16} />
              </Link>

            </div>


            <div className="dashboard-attributes">

              {statList.map((stat) => {

                const Icon = stat.icon;

                const percentage =
                  Math.min(
                    stat.value * 5,
                    100
                  );

                return (

                  <div
                    className="dashboard-attribute"
                    key={stat.name}
                  >

                    <div className="dashboard-attribute-top">

                      <div>

                        <Icon size={18} />

                        <span>
                          {stat.name}
                        </span>

                      </div>

                      <strong>
                        {stat.value}
                      </strong>

                    </div>

                    <div className="dashboard-attribute-bar">

                      <div
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>

                );

              })}

            </div>

          </section>

        </div>


        {/* COMPLETED */}

        <section className="dashboard-completed-card">

          <div>

            <div className="dashboard-completed-icon">
              <CheckCircle2 size={24} />
            </div>

            <div>

              <span>
                QUEST PROGRESS
              </span>

              <h2>
                {completedQuests.length}
                {" "}
                quests completed
              </h2>

              <p>
                Every completed quest makes
                your character stronger.
              </p>

            </div>

          </div>

          <Link
            to="/quests"
            className="secondary-button"
          >
            View Quest Board
          </Link>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;