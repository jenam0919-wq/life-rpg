function BadgeCard({ title = "Badge" }) {
  return (
    <article className="badge-card card">
      <span className="dashboard-section-label">ACHIEVEMENT</span>
      <h2>{title}</h2>
    </article>
  );
}

export default BadgeCard;
