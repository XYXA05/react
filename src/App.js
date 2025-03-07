// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import ChannelControl from './ChannelControl'; // Import the ChannelControl component
import MainPage from './MainPage';
const API_URL = 'http://localhost:8000'; // adjust to your backend URL

function App() {
  // Token is stored in state and localStorage for persistence
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  // view is one of: 'login', 'dashboard', 'apartments', 'orders', 'clients', 'statistics', 
  // 'documents', 'settings', 'schedule', 'rentalCalendar', 'reviewsAndDeals', 'call'
  const [view, setView] = useState(token ? 'dashboard' : 'login');
  const [error, setError] = useState('');

  // Data for certain views (example: apartments, orders, clients, statistics)
  const [apartments, setApartments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);

  // --- LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    try {
      // Your API expects form data (adjust if necessary)
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

  // --- FETCH FUNCTIONS (for demo views) ---
  const fetchApartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_apartments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApartments(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch apartments.');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch orders.');
    }
  };

  const fetchClients = async () => {
    try {
      // For demo, we reuse the orders endpoint and filter orders that are not closed.
      const response = await axios.get(`${API_URL}/get_orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activeClients = response.data.filter(
        (order) =>
          order.ed_status && order.ed_status.toLowerCase() !== 'closed'
      );
      setClients(activeClients);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch clients.');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/statistics/finance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch statistics.');
    }
  };

  // --- When view changes, fetch data for certain views ---
  useEffect(() => {
    if (token) {
      if (view === 'apartments') fetchApartments();
      else if (view === 'orders') fetchOrders();
      else if (view === 'clients') fetchClients();
      else if (view === 'statistics') fetchStats();
    }
  }, [view, token]);

  // --- Render different views ---
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
      {view === 'apartments' && <ApartmentsList apartments={apartments} />}
      {view === 'orders' && <OrdersList orders={orders} />}
      {view === 'clients' && <ClientsList clients={clients} />}
      {view === 'statistics' && <StatisticsDisplay stats={stats} />}
      {view === 'documents' && <Documents />}
      {view === 'settings' && <Settings />}
      {view === 'schedule' && <Schedule />}
      {view === 'rentalCalendar' && <RentalCalendar />}
      {view === 'reviewsAndDeals' && <ReviewsAndDeals />}
      {view === 'call' && <Call />}
      {view === 'channelControl' && <ChannelControl />}
    </div>
  );
}

// --- Navigation Component ---
const Navigation = ({ setView, logout }) => {
  return (
    <nav style={{ marginBottom: '20px' }}>
      <button onClick={() => setView('dashboard')}>Dashboard</button>{' '}
      <button onClick={() => setView('documents')}>📂 Документи</button>{' '}
      <button onClick={() => setView('settings')}>🔧 Налаштування</button>{' '}
      <button onClick={() => setView('schedule')}>⏰ Розклад</button>{' '}
      <button onClick={() => setView('rentalCalendar')}>📅 Календар оренди</button>{' '}
      <button onClick={() => setView('reviewsAndDeals')}>📅 Відгуки та угоди</button>{' '}
      <button onClick={() => setView('call')}>📞 Дзвінок</button>{' '}
      <button onClick={() => setView('channelControl')}>Channel Control</button>{' '}
      <button onClick={() => setView('apartments')}>Apartments</button>{' '}
      <button onClick={() => setView('orders')}>Orders</button>{' '}
      <button onClick={() => setView('clients')}>Clients</button>{' '}
      <button onClick={() => setView('statistics')}>Statistics</button>{' '}
      <button onClick={logout}>Logout</button>
      <hr />
    </nav>
  );
};


// --- Dashboard Component ---
const Dashboard = () => (
  <div>
    <h3>Welcome!</h3>
    <p>Select an option from the navigation above.</p>
  </div>
);

// --- Apartments List Component ---
const ApartmentsList = ({ apartments }) => (
  <div className="App">
  <MainPage />
</div>
);

// --- Orders List Component ---
const OrdersList = ({ orders }) => (
  <div>
    <h3>Orders</h3>
    {orders && orders.length > 0 ? (
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            Order ID: {order.id}, Name: {order.name}, Status: {order.ed_status}
          </li>
        ))}
      </ul>
    ) : (
      <p>No orders found.</p>
    )}
  </div>
);

// --- Clients List Component ---
const ClientsList = ({ clients }) => (
  <div>
    <h3>Clients (Active Orders)</h3>
    {clients && clients.length > 0 ? (
      <ul>
        {clients.map((client) => (
          <li key={client.id}>
            {client.name} — {client.phone}
          </li>
        ))}
      </ul>
    ) : (
      <p>No clients found.</p>
    )}
  </div>
);

// --- Statistics Display Component ---
const StatisticsDisplay = ({ stats }) => (
  <div>
    <h3>Statistics</h3>
    {stats ? (
      <div>
        <p>Profit: {stats.profit}</p>
        {/* Additional stats can be shown here */}
      </div>
    ) : (
      <p>No statistics available.</p>
    )}
  </div>
);

// --- Documents Component ---
const Documents = () => (
  <div>
    <h3>Документи (Documents)</h3>
    <p>This is where you would display documents.</p>
  </div>
);

// --- Settings Component ---
const Settings = () => (
  <div>
    <h3>Налаштування (Settings)</h3>
    <p>This is where settings options would be available.</p>
  </div>
);

// --- Schedule Component ---
const Schedule = () => (
  <div>
    <h3>Розклад (Schedule)</h3>
    <p>This is where you can manage scheduling (reviews, signings, appointments).</p>
  </div>
);

// --- Rental Calendar Component ---
const RentalCalendar = () => (
  <div>
    <h3>Календар оренди (Rental Calendar)</h3>
    <p>This view would show available and busy rental days.</p>
  </div>
);

// --- Reviews and Deals Component ---
const ReviewsAndDeals = () => (
  <div>
    <h3>Відгуки та угоди (Reviews and Deals)</h3>
    <p>This view would list reviews and deals with options to update them.</p>
  </div>
);

// --- Call Component ---
const Call = () => (
  <div>
    <h3>Дзвінок (Call)</h3>
    <p>This view would allow you to create and manage call reminders.</p>
  </div>
);

export default App;
