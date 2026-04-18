// src/components/Navbar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      {/* Logo */}
      <NavLink to="/dashboard" className="navbar-logo">
        <Lock size={13} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
        MNEMOCRYPT
      </NavLink>

      {/* Links */}
      <div className="navbar-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Vault
        </NavLink>
        <NavLink
          to="/timeline"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Timeline
        </NavLink>
        <NavLink
          to="/ghost"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Ghost Wall
        </NavLink>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
          title="Sign out"
        >
          <LogOut size={13} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;