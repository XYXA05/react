// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import MainPage from './MainPage';
import ChannelControl from './ChannelControl';
import CreateUser from './CreateUser';
import LoginPage from './LoginPage';
import './App.css'; // Import your styles

// Helper function to get a cookie by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

function App() {
  const token = getCookie('access_token');

  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/channel-control" element={ token ? <ChannelControl /> : <Navigate replace to="/login" /> } />
          <Route path="/create-user" element={ token ? <CreateUser /> : <Navigate replace to="/login" /> } />
          <Route path="/" element={ token ? <MainPage /> : <Navigate replace to="/login" /> } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
