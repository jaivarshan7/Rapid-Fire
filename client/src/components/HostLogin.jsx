import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HostLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                // In a real app, store token in localStorage/Context
                navigate('/host/lobby');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Connection refused');
        }
    };

    return (
        <div className="fullscreen-center animate-fade-in">
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Host Login</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {error && <div style={{ color: 'var(--error)', textAlign: 'center' }}>{error}</div>}

                    <input
                        className="input-field"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className="input-field"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="btn-primary" type="submit">Login</button>
                    <button className="btn-primary" type="button" style={{ background: 'transparent', border: '1px solid #333' }} onClick={() => navigate('/')}>Cancel</button>
                </form>
            </div>
        </div>
    );
}
