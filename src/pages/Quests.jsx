import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Trash2,
  Sword,
  Brain,
  Heart,
  Shield,
  Coins,
  Sparkles,
  Repeat,
} from "lucide-react";

import QuestForm from "../components/QuestForm";
import LevelUpModal from "../components/LevelUpModal";
import { apiUrl, authHeaders } from "../services/api";
import Navbar from "../components/Navbar";

const categories = {
  Strength: {
    icon: Sword,
  },
  Intellect: {
    icon: Brain,
  },
  Vitality: {
    icon: Heart,
  },
  Discipline: {
    icon: Shield,
  },
};

function Quests() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [levelUp, setLevelUp] = useState(null);

  const token = localStorage.getItem("token");

  // ==========================================
  // LOAD QUESTS
  // ==========================================

  const loadQuests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(apiUrl("/api/quests"), {
        headers: authHeaders(token),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load quests."
        );
      }

      setQuests(data.quests || []);
    } catch (error) {
      console.error("Load quests error:", error);

      setError(
        error.message || "Unable to load quests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    loadQuests();
  }, [token]);

  // ==========================================
  // QUEST CREATED
  // ==========================================

  const handleQuestCreated = (newQuest) => {
    setQuests((previous) => [
      newQuest,
      ...previous,
    ]);

    setError("");
  };

  // ==========================================
  // COMPLETE QUEST
  // ==========================================

  const handleCompleteQuest = async (questId) => {
    try {
      setActionLoading(questId);
      setError("");
      setNotice("");

      const response = await fetch(
        apiUrl(`/api/quests/${questId}/complete`),
        {
          method: "PATCH",
          headers: authHeaders(token),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to complete quest."
        );
      }

      setQuests((previous) =>
        previous.map((quest) =>
          quest.id === questId
            ? {
                ...quest,
                completed: 1,
                completed_at:
                  new Date().toISOString(),
              }
            : quest
        )
      );

      // ==========================================
      // LEVEL UP
      // ==========================================

      if (data.progression.levelUp) {
        setLevelUp(
          data.progression.newLevel
        );
      } else {
        setNotice(
          `Quest complete — +${data.rewards.xp} XP and +${data.rewards.gold} Gold earned.`
        );
      }

      // Reload database data
      await loadQuests();

    } catch (error) {
      console.error(
        "Complete quest error:",
        error
      );

      setError(
        error.message ||
        "Unable to complete quest."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // DELETE QUEST
  // ==========================================

  const handleDeleteQuest = async (questId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quest?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(
        `delete-${questId}`
      );

      setError("");

      const response = await fetch(
        apiUrl(`/api/quests/${questId}`),
        {
          method: "DELETE",
          headers: authHeaders(token),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to delete quest."
        );
      }

      setQuests((previous) =>
        previous.filter(
          (quest) =>
            quest.id !== questId
        )
      );

    } catch (error) {
      console.error(
        "Delete quest error:",
        error
      );

      setError(
        error.message ||
        "Unable to delete quest."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // FILTER QUESTS
  // ==========================================

  const activeQuests = quests.filter(
    (quest) => quest.completed === 0
  );

  const completedQuests = quests.filter(
    (quest) => quest.completed === 1
  );

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="quests-page">

      {/* NAVBAR */}

      <Navbar />

      {/* MAIN */}

      <main className="quests-container">

        {/* HEADER */}

        <div className="quests-header">

          <div>

            <Link
              to="/dashboard"
              className="back-link"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h1>Quest Board</h1>

            <p>
              Complete real-life missions and
              grow your hero.
            </p>

          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setShowForm(!showForm)
            }
            aria-expanded={showForm}
            aria-controls="quest-form"
          >
            <Plus size={18} />

            {showForm
              ? "Close"
              : "Create Quest"}
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="success-message" role="status" aria-live="polite">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}

        {/* QUEST FORM */}

        {showForm && (
          <QuestForm
            id="quest-form"
            onQuestCreated={
              handleQuestCreated
            }
            onClose={() =>
              setShowForm(false)
            }
          />
        )}

        {/* SUMMARY */}

        <div className="quest-summary">

          <div className="quest-summary-card">
            <span>Active Quests</span>
            <strong>
              {activeQuests.length}
            </strong>
          </div>

          <div className="quest-summary-card">
            <span>Completed</span>
            <strong>
              {completedQuests.length}
            </strong>
          </div>

          <div className="quest-summary-card">
            <span>Total Quests</span>
            <strong>
              {quests.length}
            </strong>
          </div>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="quests-loading" role="status" aria-live="polite">

            <Sparkles size={24} />

            Loading your quests...

          </div>

        ) : (

          <>

            {/* ACTIVE QUESTS */}

            <section className="quest-section">

              <div className="section-title-row">

                <h2>Active Quests</h2>

                <span>
                  {activeQuests.length}
                </span>

              </div>

              {activeQuests.length === 0 ? (

                <div className="empty-quests">

                  <Sparkles size={36} />

                  <h3>
                    No active quests
                  </h3>

                  <p>
                    Create your first quest
                    and begin your adventure.
                  </p>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setShowForm(true)
                    }
                  >
                    Create First Quest
                  </button>

                </div>

              ) : (

                <div className="quest-list">

                  {activeQuests.map(
                    (quest) => {

                      const categoryInfo =
                        categories[
                          quest.category
                        ] ||
                        categories.Discipline;

                      const CategoryIcon =
                        categoryInfo.icon;

                      const isCompleting =
                        actionLoading ===
                        quest.id;

                      const isDeleting =
                        actionLoading ===
                        `delete-${quest.id}`;

                      return (

                        <div
                          className="quest-item"
                          key={quest.id}
                        >

                          {/* ICON */}

                          <div className="quest-item-icon">
                            <CategoryIcon
                              size={24}
                            />
                          </div>

                          {/* CONTENT */}

                          <div className="quest-item-content">

                            <div className="quest-item-top">

                              <span className="quest-category">
                                {quest.category}
                              </span>

                              {quest.recurring === 1 && (
                                <span className="quest-category">
                                  <Repeat size={13} />
                                  Daily
                                </span>
                              )}

                              <span className="quest-rewards">

                                <Sparkles
                                  size={14}
                                />

                                +{quest.xp_reward} XP

                                <Coins
                                  size={14}
                                />

                                +{quest.gold_reward}

                              </span>

                            </div>

                            <h3>
                              {quest.title}
                            </h3>

                            {quest.description && (
                              <p>
                                {quest.description}
                              </p>
                            )}

                          </div>

                          {/* ACTIONS */}

                          <div className="quest-actions">

                            <button
                              type="button"
                              className="complete-quest-button"
                              onClick={() =>
                                handleCompleteQuest(
                                  quest.id
                                )
                              }
                              disabled={
                                isCompleting ||
                                isDeleting
                              }
                            >

                              <CheckCircle2
                                size={18}
                              />

                              {isCompleting
                                ? "Completing..."
                                : "Complete"}

                            </button>

                            <button
                              type="button"
                              className="delete-quest-button"
                              onClick={() =>
                                handleDeleteQuest(
                                  quest.id
                                )
                              }
                              disabled={
                                isCompleting ||
                                isDeleting
                              }
                              title="Delete quest"
                              aria-label={`Delete ${quest.title}`}
                            >

                              <Trash2
                                size={18}
                              />

                            </button>

                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

              )}

            </section>

            {/* COMPLETED QUESTS */}

            {completedQuests.length > 0 && (

              <section className="quest-section">

                <div className="section-title-row">

                  <h2>
                    Completed Quests
                  </h2>

                  <span>
                    {completedQuests.length}
                  </span>

                </div>

                <div className="quest-list completed-list">

                  {completedQuests.map(
                    (quest) => {

                      const categoryInfo =
                        categories[
                          quest.category
                        ] ||
                        categories.Discipline;

                      const CategoryIcon =
                        categoryInfo.icon;

                      const isDeleting =
                        actionLoading ===
                        `delete-${quest.id}`;

                      return (

                        <div
                          className="quest-item completed"
                          key={quest.id}
                        >

                          <div className="quest-item-icon">
                            <CategoryIcon
                              size={24}
                            />
                          </div>

                          <div className="quest-item-content">

                            <div className="quest-item-top">

                              <span className="quest-category">
                                {quest.category}
                              </span>

                              {quest.recurring === 1 && (
                                <span className="quest-category">
                                  <Repeat size={13} />
                                  Daily
                                </span>
                              )}

                              <span className="completed-label">

                                <CheckCircle2
                                  size={14}
                                />

                                Completed

                              </span>

                            </div>

                            <h3>
                              {quest.title}
                            </h3>

                            {quest.description && (
                              <p>
                                {quest.description}
                              </p>
                            )}

                          </div>

                          <button
                            type="button"
                            className="delete-quest-button"
                            onClick={() =>
                              handleDeleteQuest(
                                quest.id
                              )
                            }
                            disabled={
                              isDeleting
                            }
                            title="Delete quest"
                            aria-label={`Delete ${quest.title}`}
                          >

                            <Trash2
                              size={18}
                            />

                          </button>

                        </div>

                      );
                    }
                  )}

                </div>

              </section>

            )}

          </>

        )}

        {/* LEVEL UP MODAL */}

        {levelUp && (
          <LevelUpModal
            level={levelUp}
            onClose={() =>
              setLevelUp(null)
            }
          />
        )}

      </main>

    </div>
  );
}

export default Quests;