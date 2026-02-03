import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('questions'); // 'questions' or 'scores'
    const [questions, setQuestions] = useState([]);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(false);

    // New Question Form State
    const [newQ, setNewQ] = useState({
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        time: 20
    });

    useEffect(() => {
        fetchData();
    }, [tab]);

    const fetchData = async () => {
        setLoading(true);
        if (tab === 'questions') {
            const { data, error } = await supabase.from('questions').select('*').order('created_at', { ascending: true });
            if (error) console.error('Error fetching questions:', error);
            else setQuestions(data || []);
        } else {
            const { data, error } = await supabase.from('scores').select('*').order('score', { ascending: false });
            if (error) console.error('Error fetching scores:', error);
            else setScores(data || []);
        }
        setLoading(false);
    };

    const handleAddQuestion = async () => {
        if (!newQ.text || newQ.options.some(o => !o)) return alert("Fill all fields");

        const { error } = await supabase.from('questions').insert([{
            text: newQ.text,
            options: newQ.options, // Supabase handles array/json
            correct_answer: newQ.correctAnswer,
            time_limit: newQ.time
        }]);

        if (error) {
            alert('Error adding question: ' + error.message);
        } else {
            alert('Question added!');
            setNewQ({ text: '', options: ['', '', '', ''], correctAnswer: 0, time: 20 });
            fetchData();
        }
    };

    const handleDeleteQuestion = async (id) => {
        const { error } = await supabase.from('questions').delete().eq('id', id);
        if (!error) fetchData();
    };

    const handleDeleteScore = async (id) => {
        const { error } = await supabase.from('scores').delete().eq('id', id);
        if (!error) fetchData();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="fullscreen-center" style={{ justifyContent: 'flex-start', paddingTop: '2rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button className={`btn-primary ${tab === 'questions' ? '' : 'secondary'}`} onClick={() => setTab('questions')}>Questions</button>
                <button className={`btn-primary ${tab === 'scores' ? '' : 'secondary'}`} onClick={() => setTab('scores')}>Scores</button>
                <button className="btn-primary secondary" onClick={handleLogout}>Logout</button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div style={{ width: '80%', maxWidth: '800px' }}>
                    {tab === 'questions' ? (
                        <>
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <h3>Add Question</h3>
                                <input
                                    placeholder="Question Text"
                                    style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                                    value={newQ.text}
                                    onChange={e => setNewQ({ ...newQ, text: e.target.value })}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {newQ.options.map((opt, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                value={opt}
                                                onChange={e => {
                                                    const opts = [...newQ.options];
                                                    opts[i] = e.target.value;
                                                    setNewQ({ ...newQ, options: opts });
                                                }}
                                                placeholder={`Option ${i + 1}`}
                                                style={{ flex: 1, padding: '0.5rem' }}
                                            />
                                            <input
                                                type="radio"
                                                name="correct"
                                                checked={newQ.correctAnswer === i}
                                                onChange={() => setNewQ({ ...newQ, correctAnswer: i })}
                                                style={{ marginLeft: '0.5rem' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <label>Time (s):</label>
                                    <input
                                        type="number"
                                        value={newQ.time}
                                        onChange={e => setNewQ({ ...newQ, time: parseInt(e.target.value) })}
                                        style={{ width: '60px', padding: '0.5rem' }}
                                    />
                                    <button className="btn-primary" onClick={handleAddQuestion}>Add</button>
                                </div>
                            </div>

                            <div className="list">
                                {questions.map(q => (
                                    <div key={q.id} className="card" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong>{q.text}</strong>
                                            <button onClick={() => handleDeleteQuestion(q.id)} style={{ background: 'red', color: 'white', border: 'none', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>X</button>
                                        </div>
                                        <small>Time: {q.time_limit}s | Correct: {q.options[q.correct_answer]}</small>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="list">
                            {scores.length === 0 ? <p>No scores recorded yet.</p> : scores.map(s => (
                                <div key={s.id} className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{s.player_name}</span>
                                    <span>{s.score} pts</span>
                                    <button onClick={() => handleDeleteScore(s.id)} style={{ background: 'red', color: 'white', border: 'none', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Delete</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
