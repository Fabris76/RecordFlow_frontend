import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

export default function AppShell({ role, links, accent, notificationCount = 0 }) {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };
  return <div className={`app-shell app-shell--${accent}`}>
    <aside className="sidebar"><div className="brand-mark"><span className="brand-logo"><img src="/recordflow-logo.png" alt="RecordFlow logo" /></span><span>RecordFlow</span></div><div className="role-chip">{role} workspace</div>
      <nav className="side-nav" aria-label={`${role} navigation`}>{links.map((link) => link.enabled === false ? <span key={link.label} className="side-link side-link--disabled"><span>{link.icon}</span>{link.label}</span> : <NavLink key={link.label} to={link.to} end={link.end !== false} className={({ isActive }) => `side-link${isActive ? ' side-link--active' : ''}`}><span>{link.icon}</span>{link.label}</NavLink>)}</nav>
      <div className="sidebar-footer"><div className="user-mini"><span className="avatar">{user?.name?.charAt(0) || '?'}</span><span><strong>{user?.name}</strong><small>{user?.phone}</small></span></div><Button variant="ghost" className="sidebar-logout" onClick={handleLogout}><span className="sidebar-logout__icon" aria-hidden="true">↪</span><span>Log out</span></Button></div>
    </aside><div className="shell-main"><header className="topbar"><div className="topbar-brand"><span className="brand-logo brand-logo--topbar"><img src="/recordflow-logo.png" alt="RecordFlow logo" /></span><span><span className="topbar-kicker">RecordFlow</span><span className="topbar-title">{role} workspace</span></span></div><div className="topbar-actions"><span className="notification-badge" aria-label={`${notificationCount} unread notifications`}>Bell {notificationCount > 0 && <b>{notificationCount}</b>}</span><div className="topbar-status"><span className="status-pulse" />System online</div></div></header><main className="content"><Outlet /></main></div>
  </div>;
}
