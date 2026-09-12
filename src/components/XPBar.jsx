function XPBar({ value = 0, max = 100 }) {
  const progress = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      className="xp-bar"
      role="progressbar"
      aria-label="Experience progress"
      aria-valuenow={value}
      aria-valuemin="0"
      aria-valuemax={max}
    >
      <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
    </div>
  );
}

export default XPBar;
