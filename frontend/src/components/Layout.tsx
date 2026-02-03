import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome, FiFileText, FiAlertTriangle, FiCpu, FiBarChart2,
  FiBell, FiLogOut, FiPlusCircle, FiBookOpen, FiUsers, FiUser,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  roles?: string[]; // if set, only these roles see this item
}

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.getNotifications()
      .then((res) => {
        const unread = res.results?.filter((n) => !n.is_read).length || 0;
        setUnreadCount(unread);
      })
      .catch(() => {});
  }, [location]);

  const role = user?.role || 'customer';

  const claimsLabel = ['admin', 'manager'].includes(role)
    ? 'All Claims'
    : role === 'adjuster'
      ? 'Claims Queue'
      : role === 'reviewer'
        ? 'Review Queue'
        : 'My Claims';

  const navItems: NavItem[] = [
    { path: '/', icon: <FiHome />, label: 'Dashboard' },
    { path: '/claims', icon: <FiFileText />, label: claimsLabel },
    { path: '/claims/new', icon: <FiPlusCircle />, label: 'New Claim', roles: ['admin', 'manager', 'agent', 'customer'] },
    { path: '/policy-documents', icon: <FiBookOpen />, label: 'Policy Documents', roles: ['admin', 'manager', 'adjuster', 'reviewer'] },
    { path: '/fraud-alerts', icon: <FiAlertTriangle />, label: 'Fraud Alerts', roles: ['admin', 'manager', 'adjuster', 'reviewer'] },
    { path: '/user-admin', icon: <FiUsers />, label: 'User Admin', roles: ['admin', 'manager'] },
    { path: '/agents', icon: <FiCpu />, label: 'AI Agents', roles: ['admin', 'manager'] },
    { path: '/analytics', icon: <FiBarChart2 />, label: 'Analytics', roles: ['admin', 'manager', 'reviewer'] },
    { path: '/notifications', icon: <FiBell />, label: 'Notifications', badge: unreadCount },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username[0].toUpperCase()
    : '?';

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    manager: 'Claims Manager',
    adjuster: 'Claims Adjuster',
    reviewer: 'QA Reviewer',
    agent: 'Insurance Agent',
    customer: 'Customer',
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>ClaimAssist AI</h1>
          <p>Multi-Agent Insurance Platform</p>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div
              className="user-avatar"
              style={{
                background: role === 'admin' ? '#7c3aed' : role === 'manager' ? '#0891b2' : role === 'adjuster' ? '#1a56db' : role === 'reviewer' ? '#d97706' : '#10b981',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/profile')}
              title="View Profile"
            >{initials}</div>
            <div className="user-details" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div className="name">{user?.first_name} {user?.last_name}</div>
              <div className="role">{roleLabels[role] || role}</div>
            </div>
            <button className="logout-btn" onClick={() => navigate('/profile')} title="Profile" style={{ marginRight: '4px' }}>
              <FiUser />
            </button>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
