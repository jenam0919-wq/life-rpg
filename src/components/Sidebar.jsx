import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Sidebar">
      <nav className="sidebar-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/quests">Quests</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/character">Character</NavLink>
        <NavLink to="/rewards">Rewards</NavLink>
        <NavLink to="/profile">Profile</NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
