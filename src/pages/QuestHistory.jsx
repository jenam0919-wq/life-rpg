import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Coins,
  Heart,
  History as HistoryIcon,
  Shield,
  Sparkles,
  Sword,
} from "lucide-react";
import { apiUrl, authHeaders } from "../services/api";
import Navbar from "../components/Navbar";

const categoryIcons = {
  Strength: Sword,
  Intellect: Brain,
  Vitality: Heart,
  Discipline: Shield,
};

function QuestHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function loadHistory() {
      if (!token) {
        setError("Please login first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl("/api/quests/history"), {
          headers: authHeaders(token),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load quest history.");
        }

        setHistory(Array.isArray(data.history) ? data.history : []);
      } catch (loadError) {
        console.error("History loading error:", loadError);
        setError(loadError.message || "Unable to load quest history.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [token]);

  const totalXP = history.reduce(
    (total, quest) => total + Number(quest.xp_reward || 0),
    0
  );
  const totalGold = history.reduce(
    (total, quest) => total + Number(quest.gold_reward || 0),
    0
  );

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown date";

  return (
    <div className="history-page">
      <Navbar />

      <main className="history-container">
        <div className="history-header">
          <div>
            <Link to="/dashboard" className="back-link">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            <h1>Quest History</h1>
            <p>Your completed real-life missions and adventure progress.</p>
          </div>
          <div className="history-header-icon">
            <HistoryIcon size={32} />
          </div>
        </div>

        <div className="history-summary">
          <div className="history-summary-card">
            <CheckCircle2 size={22} />
            <div><span>Completed Quests</span><strong>{history.length}</strong></div>
          </div>
          <div className="history-summary-card">
            <Sparkles size={22} />
            <div><span>XP Earned</span><strong>{totalXP}</strong></div>
          </div>
          <div className="history-summary-card">
            <Coins size={22} />
            <div><span>Gold Earned</span><strong>{totalGold}</strong></div>
          </div>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        {loading ? (
          <div className="history-empty" role="status" aria-live="polite"><Sparkles size={30} /><p>Loading your quest history...</p></div>
        ) : history.length === 0 ? (
          <div className="history-empty">
            <HistoryIcon size={42} />
            <h2>No Quest History Yet</h2>
            <p>Complete your first quest and your achievement will appear here.</p>
            <Link to="/quests" className="primary-button">View Quest Board</Link>
          </div>
        ) : (
          <section className="history-section">
            <div className="history-section-header">
              <div><span>ADVENTURE LOG</span><h2>Completed Missions</h2></div>
              <CheckCircle2 size={25} />
            </div>
            <div className="history-list">
              {history.map((quest) => {
                const Icon = categoryIcons[quest.category] || Shield;
                return (
                  <div className="history-item" key={quest.id}>
                    <div className="history-item-icon"><Icon size={22} /></div>
                    <div className="history-item-content">
                      <div className="history-item-top">
                        <span className="history-category">{quest.category}</span>
                        <span className="history-completed"><CheckCircle2 size={14} /> Completed</span>
                      </div>
                      <h3>{quest.title}</h3>
                      <p>Completed on {formatDate(quest.completed_at)}</p>
                    </div>
                    <div className="history-rewards">
                      <span><Sparkles size={14} /> +{quest.xp_reward} XP</span>
                      <span><Coins size={14} /> +{quest.gold_reward}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default QuestHistory;
