import React, { useState, useContext, useEffect } from 'react';
import { SocketContext } from '../App';
import { useNavigate } from 'react-router-dom';

export default function PlayerJoin() {
    const socket = useContext(SocketContext);
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        socket.on('joined_room', ({ playerId, name }) => {
            // Save info to local state/context if needed, then navigate
            navigate('/player/game', { state: { name, pin, playerId } });
        });

        socket.on('error', (msg) => {
            setError(msg);
        });

        return () => {
            socket.off('joined_room');
            socket.off('error');
        };
    }, [socket, navigate, pin]);

    const handleJoin = (e) => {
        e.preventDefault();
        if (!name || !pin) return;
        socket.emit('join_room', { pin, name });
    };

    return (
        <div className="fullscreen-center animate-fade-in">
            <h1 className="logo">Rapid Fire</h1>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {error && <div style={{ color: 'var(--error)', textAlign: 'center' }}>{error}</div>}

                    <input
                        className="input-field"
                        placeholder="Game PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                    />
                    <input
                        className="input-field"
                        placeholder="Nickname"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <button className="btn-primary" type="submit">Enter</button>
                </form>
            </div>
        </div>
    );
}
