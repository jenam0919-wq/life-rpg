import { Sparkles, Trophy, X } from "lucide-react";
import { useEffect } from "react";

function LevelUpModal({ level, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!level) {
    return null;
  }

  return (
    <div className="level-up-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="level-up-particles">
        {[0, 1, 2, 3, 4, 5].map((particle) => (
          <Sparkles key={particle} size={particle % 2 ? 14 : 18} aria-hidden="true" />
        ))}
      </div>

      <div className="level-up-modal" role="dialog" aria-modal="true" aria-labelledby="level-up-title">

        <button
          type="button"
          className="level-up-close"
          onClick={onClose}
          aria-label="Close level up message"
          autoFocus
        >
          <X size={20} />
        </button>

        <div className="level-up-icon">
          <Trophy size={42} />
        </div>

        <div className="level-up-sparkles">
          <Sparkles size={20} />
        </div>

        <span className="level-up-label">
          LEVEL UP
        </span>

        <h2 id="level-up-title">
          Congratulations, Hero!
        </h2>

        <p>
          Your hard work has made you stronger.
        </p>

        <div className="level-up-number">
          <span>LEVEL</span>
          <strong>{level}</strong>
        </div>

        <p className="level-up-message">
          Keep completing quests and continue
          building your real-life character.
        </p>

        <button
          type="button"
          className="primary-button level-up-button"
          onClick={onClose}
        >
          Continue Adventure
        </button>

      </div>
    </div>
  );
}

export default LevelUpModal;