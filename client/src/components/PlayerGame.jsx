import React, { useEffect, useState, useContext, useRef } from 'react';
import { SocketContext } from '../App';
import { useLocation, useNavigate } from 'react-router-dom';

const SHAPES = ['red', 'blue', 'yellow', 'green'];
const ICONS = ['▲', '◆', '●', '■'];

export default function PlayerGame() {
    const socket = useContext(SocketContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Fallbacks if state is missing (e.g. reload) - in real app handle better
    const { name, pin, playerId } = location.state || {};

    const [view, setView] = useState('WAITING'); // WAITING, ANSWERING, SUBMITTED, RESULT, GAMEOVER
    const [result, setResult] = useState(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [maxTime, setMaxTime] = useState(0);

    const timerRef = useRef(null);

    useEffect(() => {
        if (!pin || !playerId) {
            navigate('/');
            return;
        }

        socket.on('next_question', (q) => {
            setView('ANSWERING');
            setResult(null);
            setMaxTime(q.time);
            setTimeLeft(q.time);

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 0) {
                        clearInterval(timerRef.current);
                        if (view === 'ANSWERING') {
                            setView('WAITING'); // Time up, didn't answer
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        socket.on('answer_result', (res) => {
            setResult(res);
            setScore(res.totalScore);
            setView('RESULT');
        });

        socket.on('show_question_results', () => {
            // Could switch to "Look at Host" or keep showing result
            if (view !== 'RESULT') setView('WAITING');
        });

        socket.on('show_leaderboard', () => {
            setView('WAITING');
        });

        socket.on('game_over', () => {
            setView('GAMEOVER');
        });

        socket.on('host_disconnected', () => {
            alert('Host disconnected');
            navigate('/');
        });

        return () => {
            socket.off('next_question');
            socket.off('answer_result');
            socket.off('show_question_results');
            socket.off('show_leaderboard');
            socket.off('game_over');
            socket.off('host_disconnected');
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [pin, playerId, navigate, socket, view]);

    const handleAnswer = (index) => {
        if (view !== 'ANSWERING') return;

        setView('SUBMITTED');
        socket.emit('submit_answer', {
            pin,
            playerId,
            answer: index,
            timeLeft: timeLeft,
            maxTime: maxTime
        });
    };

    if (view === 'GAMEOVER') {
        return (
            <div className="fullscreen-center animate-fade-in">
                <h1>Game Over</h1>
                <p>Final Score: {score}</p>
                <button className="btn-primary" onClick={() => navigate('/')}>Exit</button>
            </div>
        );
    }

    if (view === 'WAITING' || view === 'SUBMITTED') {
        return (
            <div className="fullscreen-center animate-fade-in">
                <h2>{view === 'SUBMITTED' ? "Answer Sent!" : "Get Ready..."}</h2>
                <div className="loader" style={{ marginTop: '2rem' }}></div>
                <p style={{ marginTop: '1rem' }}>Look at the host screen</p>
                <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                    {name} | {score} pts
                </div>
            </div>
        );
    }

    if (view === 'RESULT') {
        const bg = result?.isCorrect ? 'var(--success)' : 'var(--error)';
        return (
            <div className="fullscreen-center animate-fade-in" style={{ backgroundColor: bg }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>{result?.isCorrect ? "Correct!" : "Wrong!"}</h1>
                <p style={{ fontSize: '1.5rem' }}>+ {result?.points} points</p>
                <p>Current Streak: {result?.streak} 🔥</p>
                <p style={{ marginTop: '2rem' }}>Total Score: {result?.totalScore}</p>
            </div>
        );
    }

    return (
        <div className="fullscreen-center" style={{ padding: '1rem', boxSizing: 'border-box' }}>
            <div style={{ width: '100%', maxWidth: '600px', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '1rem', maxHeight: '600px' }}>
                {SHAPES.map((color, i) => (
                    <button
                        key={i}
                        className={`shape-btn ${color}`}
                        onClick={() => handleAnswer(i)}
                        style={{ height: '100%', fontSize: '3rem' }}
                    >
                        {ICONS[i]}
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '600px' }}>
                <span style={{ fontWeight: 'bold' }}>{name}</span>
                <span style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{score}</span>
            </div>
        </div>
    );
}
