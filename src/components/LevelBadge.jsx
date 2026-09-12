function LevelBadge({ level = 1 }) {
  return <span className="level-badge" aria-label={`Level ${level}`}>Lv. {level}</span>;
}

export default LevelBadge;
