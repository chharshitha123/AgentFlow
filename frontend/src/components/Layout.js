import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>MERN Admin</h2>
          <p>Welcome, {user?.name}</p>
        </div>
        
        <nav>
          <ul className="sidebar-nav">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/agents" className={({ isActive }) => isActive ? 'active' : ''}>
                Agents
              </NavLink>
            </li>
            <li>
              <NavLink to="/lists" className={({ isActive }) => isActive ? 'active' : ''}>
                Lists
              </NavLink>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#bdc3c7',
                  padding: '0.75rem 1rem',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;