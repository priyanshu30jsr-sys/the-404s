// src/App.jsx
// Entry point — React Router + Auth guard + layout shell
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing       from './pages/Landing';
import Dashboard     from './pages/Dashboard';
import VaultTimeline from './pages/VaultTimeline';
import GhostWall     from './pages/GhostWall';

// Shared layout components
import Navbar from './components/Navbar';

// Global styles
import './index.css';

// ── Protected Route wrapper ──────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 16,
          background: 'var(--void)',
        }}
      >
        <div className="spinner" />
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.65rem',
            letterSpacing: '3px',
            color: 'var(--text-muted)',
          }}
        >
          AUTHENTICATING
        </p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return children;
};

// ── App shell (authenticated) ────────────────────────────────────
// Renders Navbar + scanline + grain on all protected pages
const AppShell = ({ children }) => (
  <>
    <div className="grain" />
    <div className="scanline" />
    <Navbar />
    {children}
  </>
);

// ── Router ───────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<Landing />} />

    {/* Protected */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <AppShell>
            <Dashboard />
          </AppShell>
        </ProtectedRoute>
      }
    />
    <Route
      path="/timeline"
      element={
        <ProtectedRoute>
          <AppShell>
            <VaultTimeline />
          </AppShell>
        </ProtectedRoute>
      }
    />
    <Route
      path="/ghost"
      element={
        <ProtectedRoute>
          <AppShell>
            <GhostWall />
          </AppShell>
        </ProtectedRoute>
      }
    />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// ── Root ─────────────────────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <div className="scanner-overlay" />
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;