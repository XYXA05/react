// Example in App.js or Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    if (!isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  return (
    <nav style={{ padding: '1rem', background: '#2c3e50' }}>
      <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem', margin: 0 }}>
      <li><Link to="/channel-control">Channel Control</Link></li>
      <li><Link to="/create-user">Create User</Link></li>
      <li><Link to="/">Home</Link></li>
      </ul>
      <button className="dark-toggle" onClick={toggleDarkMode}>
        {isDarkMode ? '☀' : '🌙'}
      </button>
    </nav>
  );
};

export default Navbar;

