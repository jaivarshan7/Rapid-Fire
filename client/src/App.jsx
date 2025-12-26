import React, { useEffect, useState, createContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './index.css';

// Context for Socket
export const SocketContext = createContext();

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000'); // Use env var for prod, localhost for dev

function Home() {
  const navigate = useNavigate();
  return (
    <div className="lobby-screen animate-fade-in">
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Rapid Fire</h1>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn-primary" onClick={() => navigate('/host')}>Host Game</button>
        <button className="btn-primary" style={{ background: 'var(--bg-secondary)' }} onClick={() => navigate('/player')}>Join Game</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <SocketContext.Provider value={socket}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host/*" element={<HostRoutes />} />
          <Route path="/player/*" element={<PlayerRoutes />} />
        </Routes>
      </BrowserRouter>
    </SocketContext.Provider>
  );
}

// Lazy load or separate these components later
import HostLobby from './components/HostLobby';
import HostGame from './components/HostGame';
import PlayerJoin from './components/PlayerJoin';
import PlayerGame from './components/PlayerGame';
import HostLogin from './components/HostLogin';

const HostRoutes = () => (
  <Routes>
    <Route path="/" element={<HostLogin />} />
    <Route path="/lobby" element={<HostLobby />} />
    <Route path="/game" element={<HostGame />} />
  </Routes>
);

const PlayerRoutes = () => (
  <Routes>
    <Route path="/" element={<PlayerJoin />} />
    <Route path="/game" element={<PlayerGame />} />
  </Routes>
);

export default App;
