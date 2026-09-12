function StreakCard({ days = 0 }) {
  return (
    <section className="streak-card">
      <span className="dashboard-section-label">CURRENT STREAK</span>
      <strong className="streak-number">{days}</strong>
      <span>days in a row</span>
    </section>
  );
}

export default StreakCard;
