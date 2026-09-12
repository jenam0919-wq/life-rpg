import { useState } from "react";
import {
  Plus,
  X,
  Sparkles,
  Coins,
  Repeat,
} from "lucide-react";
import { apiUrl, authHeaders } from "../services/api";

function QuestForm({ id, onQuestCreated, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Discipline");

  const [xpReward, setXpReward] = useState(50);
  const [goldReward, setGoldReward] = useState(10);

  const [recurring, setRecurring] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a quest title.");
      return;
    }

    const xp = Number(xpReward);
    const gold = Number(goldReward);
    const maxReward = 1000000;

    if (!Number.isSafeInteger(xp) || xp < 1 || xp > maxReward) {
      setError(`XP reward must be a whole number from 1 to ${maxReward}.`);
      return;
    }

    if (!Number.isSafeInteger(gold) || gold < 1 || gold > maxReward) {
      setError(`Gold reward must be a whole number from 1 to ${maxReward}.`);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(apiUrl("/api/quests"), {
        method: "POST",

        headers: authHeaders(token, {
          "Content-Type": "application/json",
        }),

        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          xp_reward: xp,
          gold_reward: gold,
          recurring,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create quest."
        );
      }

      // Send new quest back to Quest Board
      if (onQuestCreated) {
        onQuestCreated(data.quest);
      }

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("Discipline");
      setXpReward(50);
      setGoldReward(10);
      setRecurring(false);

      // Close form
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error("Create quest error:", error);

      setError(
        error.message ||
        "Unable to create quest."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quest-form-card" id={id}>

      {/* HEADER */}

      <div className="quest-form-header">

        <div>
          <div className="quest-form-title-row">
            <Sparkles size={22} />

            <h2>Create New Quest</h2>
          </div>

          <p>
            Turn a real-life task into an RPG mission.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            className="quest-form-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close quest form"
          >
            <X size={20} />
          </button>
        )}

      </div>

      {/* ERROR */}

      {error && (
        <div className="auth-error" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {/* FORM */}

      <form onSubmit={handleSubmit}>

        {/* TITLE */}

        <div className="form-group">

          <label htmlFor="quest-title">
            Quest Title
          </label>

          <input
            id="quest-title"
            type="text"
            placeholder="Example: Study Java for 1 hour"
            value={title}
            maxLength={120}
            required
            onChange={(event) =>
              setTitle(event.target.value)
            }
            disabled={loading}
          />

        </div>

        {/* DESCRIPTION */}

        <div className="form-group">

          <label htmlFor="quest-description">
            Description
          </label>

          <textarea
            id="quest-description"
            placeholder="Describe what you need to accomplish..."
            value={description}
            maxLength={2000}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            disabled={loading}
            rows="4"
          />

        </div>

        {/* CATEGORY */}

        <div className="form-group">

          <label htmlFor="quest-category">
            Attribute
          </label>

          <select
            id="quest-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            disabled={loading}
          >
            <option value="Strength">
              Strength
            </option>

            <option value="Intellect">
              Intellect
            </option>

            <option value="Vitality">
              Vitality
            </option>

            <option value="Discipline">
              Discipline
            </option>
          </select>

        </div>

        {/* REWARDS */}

        <div className="quest-reward-inputs">

          <div className="form-group">

            <label htmlFor="quest-xp-reward">
              XP Reward
            </label>

            <div className="reward-input-wrapper">

              <Sparkles size={17} />

              <input
                id="quest-xp-reward"
                type="number"
                min="1"
                max="1000000"
                step="1"
                value={xpReward}
                required
                onChange={(event) =>
                  setXpReward(event.target.value)
                }
                disabled={loading}
              />

            </div>

          </div>

          <div className="form-group">

            <label htmlFor="quest-gold-reward">
              Gold Reward
            </label>

            <div className="reward-input-wrapper">

              <Coins size={17} />

              <input
                id="quest-gold-reward"
                type="number"
                min="1"
                max="1000000"
                step="1"
                value={goldReward}
                required
                onChange={(event) =>
                  setGoldReward(event.target.value)
                }
                disabled={loading}
              />

            </div>

          </div>

        </div>

        {/* DAILY QUEST */}

        <label
          htmlFor="quest-recurring"
          className={`recurring-quest-option ${
            recurring
              ? "recurring-active"
              : ""
          }`}
        >

          <div className="recurring-icon">
            <Repeat size={22} />
          </div>

          <div className="recurring-content">

            <strong>
              Daily Quest
            </strong>

            <span>
              Complete this quest every day to build your streak.
            </span>

          </div>

          <input
            id="quest-recurring"
            type="checkbox"
            aria-label="Make this a daily quest"
            checked={recurring}
            onChange={(event) =>
              setRecurring(event.target.checked)
            }
            disabled={loading}
          />

        </label>

        {/* BUTTONS */}

        <div className="quest-form-actions">

          {onClose && (
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >

            {loading ? (
              "Creating Quest..."
            ) : (
              <>
                <Plus size={18} />
                Create Quest
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
}

export default QuestForm;