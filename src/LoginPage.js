// src/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // build form‑urlencoded body
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);

    try {
      const res = await axios.post(
        `${API_URL}/login`,
        body,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const { access_token, type } = res.data;

      // install into axios defaults:
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // tell parent
      onLogin(access_token, type);
    }
    catch (err) {
      console.error(err);
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e=>setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
