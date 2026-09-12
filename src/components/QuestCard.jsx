function QuestCard({ title = "New quest" }) {
  return (
    <article className="quest-card card">
      <span className="dashboard-section-label">QUEST</span>
      <h2 className="quest-title">{title}</h2>
    </article>
  );
}

export default QuestCard;
