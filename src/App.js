import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import './CalendarView.css';

// Import your components
import ChannelControl from './ChannelControl';
import MainPage from './MainPage';
import RentalCalendar from './RentalCalendar';
import OrdersList from './OrdersList';
import ClientsList from './ClientsList';
import CreateUser from './CreateUser';
import ActionLogsMonitoring from './ActionLogsMonitoring';
import StatisticsDisplay from './StatisticsDisplay';
import MediaBuyerAdminPanel from './MediaBuyerAdminPanel';
import StoreAdmin from './StoreAdmin';              // For Internet Store
import DesignProjects from './DesignProjectsControl'; // For Design projects
import RenovationProjects from './RenovationProjectsControl'; // For Renovation projects
import CleaningOrders from './CleaningControl';       // For Cleaning orders
import AdminRolesPanel from './AdminRolesPanel';
import AdminOrdersPanel     from './AdminOrdersPanel';
import AdminMenuManager from './AdminMenuManager';  // NEW: Menu Manager
import StorePage from './StorePage';

const API_URL = 'http://localhost:8000'; // Replace with your backend URL

function App() {
  // Save token and role (persisted with localStorage)
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  // State to control displayed view
  // Allowed values include: 'login', 'dashboard', 'apartments', 'orders', 'clients', 'statistics',
  // 'documents', 'settings', 'schedule', 'rentalCalendar', 'reviewsAndDeals', 'call', 'channelControl',
  // 'create_user', 'logs'
  // And admin panels: 'adminStore', 'adminDesign', 'adminRenovation', 'adminCleaning'
  const [view, setView] = useState(token ? 'dashboard' : 'login');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        delete axios.defaults.headers.common['Authorization'];
    }
    }, [token]);
    
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
      const newRole = response.data.type; // API returns a "type" field
      setToken(newToken);
      setRole(newRole);
      localStorage.setItem('token', newToken);
      localStorage.setItem('role', newRole);
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
    setRole('');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setView('login');
  };

  // If not authenticated, render login form.
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Dashboard</h2>
      <Navigation setView={setView} logout={logout} role={role} token={token} />
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Common views (for admin, realtor, team_leader, etc.) */}
      {view === 'store' && (
        <StorePage token={token} onBack={() => setView('dashboard')} />
      )}
      {view === 'dashboard' && <Dashboard />}
      {view === 'apartments' && <MainPage />}
      {view === 'orders' && <OrdersList token={token} onBack={() => setView('dashboard')} />}
      {view === 'statistics' && <StatisticsDisplay userType={role} token={token} />}
      {view === 'documents' && <Documents />}
      {view === 'rentalCalendar' && (
        <RentalCalendar propertyId={1} category="default" onBack={() => setView('apartments')} />
      )}
      {view === 'channelControl' && <ChannelControl />}
      {view === 'create_user' && <CreateUser />}
      {view === 'logs' && <ActionLogsMonitoring />}
      {view === 'adminMenu' && role === 'admin' && <AdminMenuManager />}  {/* Menu Manager page */}
      {view === 'adminApartments' && (
  <AdminRolesPanel token={token} onBack={() => setView('dashboard')} />
)}
{view === 'adminOrders' && (
  <AdminOrdersPanel     token={token} onBack={() => setView('dashboard')} />
)}
      {/* Admin Panels:
            Design: role is admin OR design OR design_leader
            Renovation: role is admin OR repair_construction OR repair_construction_leader
            Cleaning: role is admin OR cliner OR cliner_leader
            Store: role is admin OR store OR store_leader
      */}
      {(role === 'admin' || role === 'store' || role === 'store_leader') && view === 'adminStore' && (
        <StoreAdmin />
      )}
      {(role === 'admin' || role === 'design' || role === 'design_leader') && view === 'adminDesign' && (
        <div>
          <h3>Адмінка для Дизайну 🎨</h3>
          <DesignProjects />
        </div>
      )}
      {(role === 'admin' || role === 'repair_construction' || role === 'repair_construction_leader') && view === 'adminRenovation' && (
        <div>
          <h3>Адмінка для Ремонту/Будівництва 🏗</h3>
          <RenovationProjects />
        </div>
      )}
      {(role === 'admin' || role === 'rieltor_media_buyer' || role === 'rieltor_media_buyer_leader') && view === 'adminMediaBuyer' && (
        <div>
          <h3>Адмінка для MediaBuyer 🏰</h3>
          <MediaBuyerAdminPanel />
        </div>
      )}
      {(role === 'admin' || role === 'cliner' || role === 'cliner_leader') && view === 'adminCleaning' && (
        <div>
          <h3>Адмінка для Клінінгу 🧹</h3>
          <CleaningOrders />
        </div>
      )}
          {role === 'admin' && (
      <button onClick={() => setView('adminMenu')} style={{ fontWeight: 'bold', color: '#007bff' }}>
        🔧 Menu Manager
      </button>
    )}
    </div>
  );
}

// --- Navigation Component ---
const Navigation = ({ setView, logout, role, token }) => {
  // Determine which admin button to show based on the role.
  const renderAdminButtons = () => {
    if (["cliner", "cliner_leader"].includes(role)) {
      return (
        <button onClick={() => setView('adminCleaning')}>
          Адмінка для Клінінгу 🧹
        </button>
      );
    }
    if (["design", "design_leader"].includes(role)) {
      return (
        <button onClick={() => setView('adminDesign')}>
          Адмінка для Дизайну 🎨
        </button>
      );
    }
    if (["store", "store_leader"].includes(role)) {
      return (
        <button onClick={() => setView('adminStore')}>
          Адмінка для Інтернет-магазину 🛍
        </button>
      );
    }
    if (["repair_construction", "repair_construction_leader"].includes(role)) {
      return (
        <button onClick={() => setView('adminRenovation')}>
          Адмінка для Ремонту/Будівництва 🏗
        </button>
      );
    }
    if (["rieltor_media_buyer", "rieltor_media_buyer_leader"].includes(role)) {
      return (
        <button onClick={() => setView('adminMediaBuyer')}>Адмінка для MediaBuyer 🏰</button>
      );
    }
    // If role is admin, show all extra buttons.
    if (role === 'admin') {
      return (
        <>
          <button onClick={() => setView('adminStore')}>
            Адмінка для Інтернет-магазину 🛍
          </button>{' '}
          <button onClick={() => setView('adminDesign')}>
            Адмінка для Дизайну 🎨
          </button>{' '}
          <button onClick={() => setView('adminRenovation')}>
            Адмінка для Ремонту/Будівництва 🏗
          </button>{' '}
          <button onClick={() => setView('adminCleaning')}>
            Адмінка для Клінінгу 🧹
          </button>
          <button onClick={() => setView('adminApartments')}>
        Admin Apartments
      </button>
        </>
      );
    }
    return null;
  };

  return (
    <nav style={{ marginBottom: '20px' }}>
      <button onClick={() => setView('dashboard')}>Dashboard</button>{' '}
      <button onClick={() => setView('documents')}>Documents</button>{' '}
      <button onClick={() => setView('rentalCalendar')}>Rental Calendar</button>{' '}
      <button onClick={() => setView('channelControl')}>Channel Control</button>{' '}
      <button onClick={() => setView('apartments')}>Apartments</button>{' '}
      <button onClick={() => setView('orders')}>Orders</button>{' '}
      <button onClick={() => setView('statistics')}>Statistics</button>{' '}
      <button onClick={() => setView('create_user')}>Create User</button>{' '}
      <button onClick={() => setView('logs')}>Log Users</button>{' '}
      {renderAdminButtons()}
      <button onClick={logout}>Logout</button>
      <hr />
    </nav>
  );
};

const Dashboard = () => (
  <div>
    <h3>Welcome!</h3>
    <p>Select an option from the navigation above.</p>
  </div>
);

// Dummy components – replace these with your actual implementations.
const Documents = () => (
  <div>
    <h3>Documents</h3>
    <p>Documents functionality is not implemented yet.</p>
  </div>
);


export default App;
