function CharacterCard({ name = "Adventurer" }) {
  return (
    <article className="character-card card">
      <span className="dashboard-section-label">YOUR HERO</span>
      <h2>{name}</h2>
    </article>
  );
}

export default CharacterCard;
