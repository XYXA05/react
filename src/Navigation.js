// Navigation.js
import React from 'react';

const Navigation = ({ setView, logout }) => (
  <nav style={{ marginBottom: '20px' }}>
    <button onClick={() => setView('dashboard')}>Dashboard</button>
    {/* ... other navigation buttons ... */}
    <button onClick={logout}>Logout</button>
  </nav>
);

export default Navigation;
