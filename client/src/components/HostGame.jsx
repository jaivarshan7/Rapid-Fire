import React, { useEffect, useState, useContext, useRef } from 'react';
import { SocketContext } from '../App';
import { useLocation, useNavigate } from 'react-router-dom';

const SHAPES = ['red', 'blue', 'yellow', 'green'];
const ICONS = ['▲', '◆', '●', '■'];

export default function HostGame() {
    const socket = useContext(SocketContext);
    const location = useLocation();
    const navigate = useNavigate();
    const pin = location.state?.pin;

    const [question, setQuestion] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [gameState, setGameState] = useState('LOADING'); // LOADING, QUESTION, RESULTS, LEADERBOARD, GAMEOVER
    const [leaderboard, setLeaderboard] = useState([]);
    const [answeredCount, setAnsweredCount] = useState(0);

    const timerRef = useRef(null);

    useEffect(() => {
        if (!pin) {
            navigate('/');
            return;
        }

        // Start the first question
        socket.emit('host_next_question', { pin });

        socket.on('next_question', (q) => {
            setQuestion(q);
            setTimeLeft(q.time);
            setGameState('QUESTION');
            setAnsweredCount(0);

            // Start Timer
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        // Trigger results automatically when time is up
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        socket.on('player_answered', () => {
            setAnsweredCount(prev => prev + 1);
        });

        socket.on('show_question_results', () => {
            setGameState('RESULTS');
        });

        socket.on('show_leaderboard', (lb) => {
            setLeaderboard(lb);
            setGameState('LEADERBOARD');
        });

        socket.on('game_over', (finalLb) => {
            setLeaderboard(finalLb);
            setGameState('GAMEOVER');
        });

        return () => {
            socket.off('next_question');
            socket.off('player_answered');
            socket.off('show_question_results');
            socket.off('show_leaderboard');
            socket.off('game_over');
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [pin, socket, navigate]);

    const handleTimeUp = () => {
        socket.emit('host_show_question_results', { pin });
    };

    const handleNext = () => {
        if (gameState === 'RESULTS') {
            socket.emit('host_show_leaderboard', { pin });
        } else if (gameState === 'LEADERBOARD') {
            socket.emit('host_next_question', { pin });
        }
    };

    if (gameState === 'GAMEOVER') {
        return (
            <div className="fullscreen-center animate-fade-in">
                <h1>Game Over</h1>
                <div className="card" style={{ width: '600px' }}>
                    {leaderboard.map((p, i) => (
                        <div key={p.id} style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '1rem', borderBottom: '1px solid #333',
                            fontSize: i === 0 ? '1.5rem' : '1rem',
                            fontWeight: i === 0 ? 'bold' : 'normal',
                            color: i === 0 ? 'var(--accent-color)' : 'white'
                        }}>
                            <span>#{i + 1} {p.name}</span>
                            <span>{p.score} pts</span>
                        </div>
                    ))}
                </div>
                <button className="btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>Back to Home</button>
            </div>
        );
    }

    if (!question) return <div className="fullscreen-center">Loading...</div>;

    return (
        <div className="fullscreen-center" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 2rem', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{answeredCount} Answers</div>
                <div className="btn-primary" style={{ borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    {timeLeft}
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80%', textAlign: 'center' }}>
                {gameState === 'QUESTION' && <h1 style={{ fontSize: '3rem' }}>{question.text}</h1>}
                {gameState === 'RESULTS' && <h1 style={{ fontSize: '3rem' }}>Time's Up!</h1>}
                {gameState === 'LEADERBOARD' && <h1 style={{ fontSize: '3rem' }}>Leaderboard</h1>}
            </div>

            {gameState === 'LEADERBOARD' ? (
                <div className="card" style={{ width: '600px', marginBottom: '4rem' }}>
                    {leaderboard.map((p, i) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #333' }}>
                            <span>{p.name}</span>
                            <span>{p.score}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    {question.options.map((opt, i) => (
                        <div key={i} className={`shape-btn ${SHAPES[i]}`} style={{
                            opacity: gameState === 'RESULTS' && i !== question.correctAnswer ? 0.2 : 1,
                            position: 'relative'
                        }}>
                            <span style={{ marginRight: '1rem' }}>{ICONS[i]}</span>
                            {opt}
                            {gameState === 'RESULTS' && i === question.correctAnswer && (
                                <span style={{ position: 'absolute', right: '1rem', fontSize: '1.5rem' }}>✓</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {(gameState === 'RESULTS' || gameState === 'LEADERBOARD') && (
                <button className="btn-primary" style={{ marginBottom: '2rem', fontSize: '1.2rem', padding: '1rem 3rem' }} onClick={handleNext}>
                    Next
                </button>
            )}
        </div>
    );
}
