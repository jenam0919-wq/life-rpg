function RewardCard({ title = "Reward" }) {
  return (
    <article className="reward-card card">
      <span className="dashboard-section-label">REWARD</span>
      <h2>{title}</h2>
    </article>
  );
}

export default RewardCard;
