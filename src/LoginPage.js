// src/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    // Create form data (since backend expects Form fields)
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        body: formData,
        credentials: 'include' // send cookies if needed
      });
      if (res.ok) {
        const data = await res.json();
        // Save the JWT token as a cookie
        document.cookie = `access_token=${data.access_token}; path=/;`;
        // Optionally, store other user info in localStorage
        // Redirect to home page
        navigate('/');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('Login error');
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      {error && <p style={{color:'red'}}>{error}</p>}
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input 
            id="username" 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input 
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
