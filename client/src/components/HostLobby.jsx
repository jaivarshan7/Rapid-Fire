import React, { useEffect, useState, useContext } from 'react';
import { SocketContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import QRCode from 'react-qr-code';

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

    const handleStartGame = async () => {
        // Fetch questions from Supabase
        const { data: dbQuestions, error } = await supabase
            .from('questions')
            .select('*')
            .order('created_at', { ascending: true }); // Optional: order by creation or random

        if (error) {
            console.error('Error fetching questions:', error);
            alert('Failed to load questions. Check console.');
            return;
        }

        if (!dbQuestions || dbQuestions.length === 0) {
            alert('No questions available! Add some in the Admin Panel.');
            return;
        }

        const questions = dbQuestions.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correctAnswer: q.correct_answer,
            time: q.time_limit
        }));

        socket.emit('start_game', { pin, questions });
    };

    return (
        <div className="lobby-screen animate-fade-in">
            <h2>Join at <span style={{ color: 'var(--accent-color)' }}>rapid-fire-six.vercel.app</span></h2>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '1rem', margin: '1rem auto', width: 'fit-content' }}>
                <QRCode value="https://rapid-fire-six.vercel.app/" size={128} />
            </div>
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
