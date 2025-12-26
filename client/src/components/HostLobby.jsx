import React, { useEffect, useState, useContext } from 'react';
import { SocketContext } from '../App';
import { useNavigate } from 'react-router-dom';

export default function HostLobby() {
    const socket = useContext(SocketContext);
    const navigate = useNavigate();
    const [pin, setPin] = useState(null);
    const [players, setPlayers] = useState([]);

    const pinRef = React.useRef(null);

    useEffect(() => {
        pinRef.current = pin;
    }, [pin]);

    useEffect(() => {
        // Create room on mount
        socket.emit('create_room');

        socket.on('room_created', (roomPin) => {
            setPin(roomPin);
        });

        socket.on('player_joined', (player) => {
            setPlayers((prev) => [...prev, player]);
        });

        socket.on('game_started', () => {
            navigate('/host/game', { state: { pin: pinRef.current } });
        });

        return () => {
            socket.off('room_created');
            socket.off('player_joined');
            socket.off('game_started');
        };
    }, [socket, navigate]);

    const handleStartGame = () => {
        // For MVP, using a hardcoded set of questions
        // In a real app, you'd select a quiz deck here
        const questions = [
            {
                id: 1,
                text: "What is the capital of France?",
                options: ["Berlin", "Madrid", "Paris", "Rome"],
                correctAnswer: 2,
                time: 20
            },
            {
                id: 2,
                text: "Which planet is known as the Red Planet?",
                options: ["Earth", "Mars", "Jupiter", "Venus"],
                correctAnswer: 1,
                time: 20
            },
            {
                id: 3,
                text: "What is 2 + 2?",
                options: ["3", "4", "5", "22"],
                correctAnswer: 1,
                time: 10
            }
        ];

        socket.emit('start_game', { pin, questions });
    };

    return (
        <div className="lobby-screen animate-fade-in">
            <h2>Join at <span style={{ color: 'var(--accent-color)' }}>rapid-fire.game</span></h2>
            <p>Game PIN:</p>
            <div className="pin-display">{pin || '...'}</div>

            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Players ({players.length})</h3>
                    <button
                        className="btn-primary"
                        disabled={players.length === 0}
                        onClick={handleStartGame}
                        style={{ opacity: players.length === 0 ? 0.5 : 1 }}
                    >
                        Start Game
                    </button>
                </div>

                <div className="player-grid">
                    {players.map((p) => (
                        <div key={p.id} className="player-chip">
                            {p.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
