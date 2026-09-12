function StatCard({ label, value }) {
  return (
    <section className="dashboard-stat-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </section>
  );
}

export default StatCard;
