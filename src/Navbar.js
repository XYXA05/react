// Example in App.js or Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';


const Navbar = (onLogout) => {
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
    <nav>
      <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem' }}>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/properties">Properties</Link></li>
        <li><Link to="/orders">Orders</Link></li>
        <li><Link to="/schedule">Schedule</Link></li>
        <li><Link to="/clients">Clients</Link></li>
        <li><Link to="/statistics">Statistics</Link></li>
        <li><button onClick={onLogout}>Logout</button></li>
      </ul>
      <hr />
      <button className="dark-toggle" onClick={toggleDarkMode}>
        {isDarkMode ? '☀' : '🌙'}
      </button>
    </nav>
  );
};

export default Navbar;

