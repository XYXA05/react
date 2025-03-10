// App.js
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import './CalendarView.css'; // CSS for calendar styling
import ChannelControl from './ChannelControl'; // Channel control component
import MainPage from './MainPage'; // Apartments list & filters
import RentalCalendar from './RentalCalendar'; // Calendar view component
import OrdersList from './OrdersList'; // Orders view (separate component)
import ClientsList from './ClientsList'; // Clients view (separate component)

const API_URL = 'http://localhost:8000'; // Adjust to your backend URL

function App() {
  // Authentication token and view control state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  // Valid views: 'login', 'dashboard', 'apartments', 'orders', 'clients', 'statistics',
  // 'documents', 'settings', 'schedule', 'rentalCalendar', 'reviewsAndDeals', 'call', 'channelControl'
  const [view, setView] = useState(token ? 'dashboard' : 'login');
  const [error, setError] = useState('');

  // --- LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    try {
      const response = await axios.post(
        `${API_URL}/login`,
        new URLSearchParams({ username, password }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const newToken = response.data.access_token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setView('dashboard');
      setError('');
    } catch (err) {
      console.error(err);
      setError('Login failed. Please check your credentials.');
    }
  };

  // --- LOGOUT HANDLER ---
  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setView('login');
  };

  // Render login form if user is not authenticated.
  if (view === 'login') {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div>
            <input name="username" type="text" placeholder="Username" required />
          </div>
          <div>
            <input name="password" type="password" placeholder="Password" required />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>
      <Navigation setView={setView} logout={logout} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {view === 'dashboard' && <Dashboard />}
      {view === 'apartments' && <MainPage />}
      {view === 'orders' && (
        <OrdersList token={token} onBack={() => setView('dashboard')} />
      )}
      {view === 'clients' && (
        <ClientsList token={token} onBack={() => setView('dashboard')} />
      )}
      {view === 'statistics' && <StatisticsDisplay />}
      {view === 'documents' && <Documents />}
      {view === 'settings' && <Settings />}
      {view === 'schedule' && <Schedule />}
      {view === 'rentalCalendar' && (
        <RentalCalendar propertyId={1} onBack={() => setView('apartments')} />
      )}
      {view === 'reviewsAndDeals' && <ReviewsAndDeals />}
      {view === 'call' && <Call />}
      {view === 'channelControl' && <ChannelControl />}
    </div>
  );
}

// --- Navigation Component ---
const Navigation = ({ setView, logout }) => (
  <nav style={{ marginBottom: '20px' }}>
    <button onClick={() => setView('dashboard')}>Dashboard</button>{' '}
    <button onClick={() => setView('documents')}>Documents</button>{' '}
    <button onClick={() => setView('settings')}>Settings</button>{' '}
    <button onClick={() => setView('schedule')}>Schedule</button>{' '}
    <button onClick={() => setView('rentalCalendar')}>Rental Calendar</button>{' '}
    <button onClick={() => setView('reviewsAndDeals')}>Reviews & Deals</button>{' '}
    <button onClick={() => setView('call')}>Call</button>{' '}
    <button onClick={() => setView('channelControl')}>Channel Control</button>{' '}
    <button onClick={() => setView('apartments')}>Apartments</button>{' '}
    <button onClick={() => setView('orders')}>Orders</button>{' '}
    <button onClick={() => setView('clients')}>Clients</button>{' '}
    <button onClick={() => setView('statistics')}>Statistics</button>{' '}
    <button onClick={logout}>Logout</button>
    <hr />
  </nav>
);

const Dashboard = () => (
  <div>
    <h3>Welcome!</h3>
    <p>Select an option from the navigation above.</p>
  </div>
);

// --- Statistics Display Component ---
const StatisticsDisplay = ({ stats }) => (
  <div>
    <h3>Statistics</h3>
    {stats ? (
      <div>
        <p>Profit: {stats.profit}</p>
      </div>
    ) : (
      <p>No statistics available.</p>
    )}
  </div>
);

// --- Documents Component ---
const Documents = () => (
  <div>
    <h3>Documents</h3>
    <p>This is where you would display documents.</p>
  </div>
);

// --- Settings Component ---
const Settings = () => (
  <div>
    <h3>Settings</h3>
    <p>This is where settings options would be available.</p>
  </div>
);

// --- Schedule Component ---
const Schedule = () => (
  <div className="card">
    <h3>Schedule</h3>
    <p>This is where you can manage scheduling (reviews, signings, appointments).</p>
    <form>
      <div>
        <label>Date and Time:</label>
        <input type="datetime-local" />
      </div>
      <div>
        <label>Location:</label>
        <input type="text" placeholder="Enter location" />
      </div>
      <div>
        <label>Event Type:</label>
        <select>
          <option value="review">Review</option>
          <option value="signing">Signing</option>
          <option value="appointment">Appointment</option>
        </select>
      </div>
      <div>
        <label>Notes:</label>
        <textarea placeholder="Enter notes" />
      </div>
      <button type="submit" className="advanced">Schedule</button>
    </form>
  </div>
);

// --- Reviews and Deals Component ---
const ReviewsAndDeals = () => (
  <div className="card">
    <h3>Reviews and Deals</h3>
    <p>This view would list reviews and deals with options to update them.</p>
    <table className="reviews-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Review</th>
          <th>Deal Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>101</td>
          <td>Great property!</td>
          <td>Completed</td>
          <td>
            <button>Edit</button>
            <button>Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

// --- Call Component ---
const Call = () => (
  <div className="card">
    <h3>Call</h3>
    <p>This view would allow you to create and manage call reminders.</p>
    <form>
      <div>
        <label>Order ID:</label>
        <input type="number" placeholder="Enter order id" />
      </div>
      <div>
        <label>Date & Time:</label>
        <input type="datetime-local" />
      </div>
      <div>
        <label>Note:</label>
        <textarea placeholder="Enter note" />
      </div>
      <button type="submit" className="advanced">Set Reminder</button>
    </form>
  </div>
);

export default App;
