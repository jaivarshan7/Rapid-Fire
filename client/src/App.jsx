import React, { useEffect, useState, createContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './index.css';

// Context for Socket
export const SocketContext = createContext();

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000'); // Use env var for prod, localhost for dev

import { AuthProvider, useAuth } from './contexts/AuthContext';

const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Simple check, render nothing while redirecting
  React.useEffect(() => {
    if (!user) navigate('/host');
  }, [user, navigate]);

  return user ? children : null;
};

function Home() {
  const navigate = useNavigate();
  return (
    <div className="lobby-screen animate-fade-in">
      {/* Hidden Admin Button */}
      <button
        onClick={() => navigate('/admin')}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.5)',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          borderRadius: '5px'
        }}
      >
        Admin
      </button>

      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Rapid Fire</h1>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn-primary" onClick={() => navigate('/host')}>Host Game</button>
        <button className="btn-primary" style={{ background: 'var(--bg-secondary)' }} onClick={() => navigate('/player')}>Join Game</button>
      </div>
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.8rem', opacity: 0.5 }}>
        Server: {import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).hostname : 'Localhost'}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketContext.Provider value={socket}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/host/*" element={<HostRoutes />} />
            <Route path="/player/*" element={<PlayerRoutes />} />
            <Route path="/admin" element={
              <RequireAuth>
                <AdminPanel />
              </RequireAuth>
            } />
          </Routes>
        </BrowserRouter>
      </SocketContext.Provider>
    </AuthProvider>
  );
}

// Lazy load or separate these components later
import HostLobby from './components/HostLobby';
import HostGame from './components/HostGame';
import PlayerJoin from './components/PlayerJoin';
import PlayerGame from './components/PlayerGame';
import HostLogin from './components/HostLogin';
import AdminPanel from './components/AdminPanel';

const HostRoutes = () => (
  <Routes>
    <Route path="/" element={<HostLogin />} />
    <Route path="/lobby" element={
      <RequireAuth>
        <HostLobby />
      </RequireAuth>
    } />
    <Route path="/game" element={
      <RequireAuth>
        <HostGame />
      </RequireAuth>
    } />
  </Routes>
);

const PlayerRoutes = () => (
  <Routes>
    <Route path="/" element={<PlayerJoin />} />
    <Route path="/game" element={<PlayerGame />} />
  </Routes>
);

export default App;
