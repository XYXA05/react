// App.js
import React, { useState, useEffect } from 'react'; // Додано useEffect
import axios from 'axios';
import './App.css';
import './CalendarView.css'; // CSS for calendar styling
import ChannelControl from './ChannelControl'; // Channel control component
import MainPage from './MainPage'; // Apartments list & filters
import RentalCalendar from './RentalCalendar'; // Calendar view component
import OrdersList from './OrdersList'; // Orders view (separate component)
import ClientsList from './ClientsList'; // Clients view (separate component)
import CreateUser from './CreateUser';
import ActionLogsMonitoring from './ActionLogsMonitoring';
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

  // --- Обробник виходу ---
  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setView('login');
  };

  // Якщо не залогінені, показуємо форму логіну
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
      {view === 'dashboard' && <Dashboard />}
      {view === 'store' && <StoreAdmin token={token} />}
      {view === 'design' && <DesignAdmin token={token} />}
      {view === 'renovation' && <RenovationAdmin token={token} />}
      {view === 'cleaning' && <CleaningAdmin token={token} />}
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
      {view === 'create_user' && <CreateUser />}
      {view === 'logs' && <ActionLogsMonitoring/>}      
    </div>
  );
}

// --- Компонент навігації між модулями ---
const Navigation = ({ setView, logout }) => (
  <nav style={{ marginBottom: '20px' }}>
    <button onClick={() => setView('dashboard')}>Dashboard</button>{' '}
    <button onClick={() => setView('store')}>Інтернет-магазин 🛍</button>{' '}
    <button onClick={() => setView('design')}>Дизайн 🎨</button>{' '}
    <button onClick={() => setView('renovation')}>Ремонт/Будівництво 🏗</button>{' '}
    <button onClick={() => setView('cleaning')}>Клінінг 🧹</button>{' '}
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
    <button onClick={() => setView('create_user')}>Create User</button>{' '}
    <button onClick={() => setView('logs')}>Log Users</button>{' '}    
    <button onClick={logout}>Logout</button>
    <hr />
  </nav>
);

// --- Компонент Dashboard ---
const Dashboard = () => (
  <div>
    <h3>Welcome!</h3>
    <p>Оберіть розділ із навігації.</p>
  </div>
);

// ============================
// Інтернет-магазин
// ============================
const StoreAdmin = ({ token }) => {
  // Підрозділи: apartments, orders, callbacks, requests, statistics, calendar, clients
  const [subView, setSubView] = useState('apartments');
  return (
    <div>
      <h2>Інтернет-магазин 🛍</h2>
      <StoreNavigation setSubView={setSubView} />
      {subView === 'apartments' && <StoreApartments token={token} />}
      {subView === 'orders' && <StoreOrders token={token} />}
      {subView === 'callbacks' && <StoreCallbacks token={token} />}
      {subView === 'requests' && <StoreRequests token={token} />}
      {subView === 'statistics' && <StoreStatistics token={token} />}
      {subView === 'calendar' && <StoreCalendar token={token} />}
      {subView === 'clients' && <StoreClients token={token} />}
    </div>
  );
};

const StoreNavigation = ({ setSubView }) => (
  <div>
    <button onClick={() => setSubView('apartments')}>Апартаменти</button>
    <button onClick={() => setSubView('orders')}>Замовлення</button>
    <button onClick={() => setSubView('callbacks')}>Продзвін</button>
    <button onClick={() => setSubView('requests')}>Запити</button>
    <button onClick={() => setSubView('statistics')}>Статистика</button>
    <button onClick={() => setSubView('calendar')}>Графік</button>
    <button onClick={() => setSubView('clients')}>Клієнти</button>
  </div>
);

// Компонент для апартаментів
const StoreApartments = ({ token }) => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/store/apartments/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setApartments(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);
  return (
    <div>
      <h3>Апартаменти</h3>
      {loading ? (
        <p>Завантаження...</p>
      ) : apartments.length ? (
        <ul>
          {apartments.map((apt) => (
            <li key={apt.id}>
              {apt.title} - {apt.price} - {apt.location}
            </li>
          ))}
        </ul>
      ) : (
        <p>Апартаменти не знайдено.</p>
      )}
    </div>
  );
};

// Компонент для замовлень
const StoreOrders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/store/orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);
  return (
    <div>
      <h3>Замовлення</h3>
      {loading ? (
        <p>Завантаження...</p>
      ) : orders.length ? (
        <ul>
          {orders.map((ord) => (
            <li key={ord.id}>
              {ord.name} - {ord.status}
            </li>
          ))}
        </ul>
      ) : (
        <p>Замовлення не знайдено.</p>
      )}
    </div>
  );
};

// Компонент для продзвону
const StoreCallbacks = ({ token }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/store/callbacks/`,
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Запит на продзвін для номера ${phone} відправлено!`);
    } catch (err) {
      console.error(err);
      setMessage('Помилка відправлення запиту.');
    }
  };
  return (
    <div>
      <h3>Продзвін</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Введіть номер телефону"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit">Відправити</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

// Компонент для запитів
const StoreRequests = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/store/requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);
  return (
    <div>
      <h3>Запити</h3>
      {loading ? (
        <p>Завантаження...</p>
      ) : requests.length ? (
        <ul>
          {requests.map((req) => (
            <li key={req.id}>
              ID {req.id}: {req.message}
            </li>
          ))}
        </ul>
      ) : (
        <p>Запити відсутні.</p>
      )}
    </div>
  );
};

// Компонент для статистики
const StoreStatistics = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/store/statistics/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);
  return (
    <div>
      <h3>Статистика</h3>
      {loading ? (
        <p>Завантаження...</p>
      ) : stats ? (
        <div>
          <p>Прибуток: {stats.profit}</p>
          <p>Замовлень: {stats.orders_count}</p>
          <p>Інше: {stats.others}</p>
        </div>
      ) : (
        <p>Статистика не доступна.</p>
      )}
    </div>
  );
};

// Компонент для календаря
const StoreCalendar = ({ token }) => {
  const [calendar, setCalendar] = useState(null);
  const [apartmentId, setApartmentId] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/store/calendar/${apartmentId}/${year}/${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCalendar(res.data);
    } catch (err) {
      console.error(err);
      setCalendar(null);
    }
    setLoading(false);
  };
  return (
    <div>
      <h3>Графік</h3>
      <div>
        <input
          type="number"
          placeholder="ID апартаменту"
          value={apartmentId}
          onChange={(e) => setApartmentId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Рік"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <input
          type="number"
          placeholder="Місяць"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <button onClick={fetchCalendar}>Отримати календар</button>
      </div>
      {loading ? (
        <p>Завантаження календаря...</p>
      ) : calendar ? (
        <pre>{JSON.stringify(calendar, null, 2)}</pre>
      ) : (
        <p>Календар не доступний.</p>
      )}
    </div>
  );
};

// Компонент для клієнтів
const StoreClients = ({ token }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/store/clients/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setClients(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);
  return (
    <div>
      <h3>Клієнти</h3>
      {loading ? (
        <p>Завантаження...</p>
      ) : clients.length ? (
        <ul>
          {clients.map((client) => (
            <li key={client.id}>
              {client.name} - {client.phone}
            </li>
          ))}
        </ul>
      ) : (
        <p>Клієнти не знайдено.</p>
      )}
    </div>
  );
};

const DesignAdmin = ({ token }) => {
  const [subView, setSubView] = useState('projects');

  return (
    <div>
      <h2>Дизайн 🎨</h2>
      <DesignNavigation setSubView={setSubView} />
      {subView === 'projects' && <DesignProjects token={token} />}
      {subView === 'callbacks' && <DesignCallbacks token={token} />}
      {subView === 'requests' && <DesignRequests token={token} />}
      {subView === 'statistics' && <DesignStatistics token={token} />}
      {subView === 'calendar' && <DesignCalendar token={token} />}
      {subView === 'clients' && <DesignClients token={token} />}
    </div>
  );
};

const DesignNavigation = ({ setSubView }) => (
  <div>
    <button onClick={() => setSubView('projects')}>Проєкти</button>
    <button onClick={() => setSubView('callbacks')}>Продзвін</button>
    <button onClick={() => setSubView('requests')}>Запити</button>
    <button onClick={() => setSubView('statistics')}>Статистика</button>
    <button onClick={() => setSubView('calendar')}>Графік</button>
    <button onClick={() => setSubView('clients')}>Клієнти</button>
  </div>
);

const DesignProjects = ({ token }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Завантаження проєктів з бекенду
  useEffect(() => {
    axios
      .get(`${API_URL}/design/projects/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProjects(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Помилка завантаження проєктів:", err);
        setLoading(false);
      });
  }, [token]);

  const viewProjects = () => {
    alert("Список проєктів:\n" + JSON.stringify(projects, null, 2));
  };

  const editProject = () => {
    // Логіка для редагування проєкту (відкриття форми)
    alert("Відкриття діалогу редагування проєкту (функціонал не реалізовано)");
  };

  const addPhoto = () => {
    alert("Відкриття процесу додавання фото (функціонал не реалізовано)");
  };

  return (
    <div>
      <h3>Проєкти</h3>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={viewProjects}>📝 Перегляд списку</button>{' '}
        <button onClick={editProject}>✏️ Редагувати</button>{' '}
        <button onClick={addPhoto}>📸 Додати фото</button>
      </div>
      {loading ? (
        <p>Завантаження проєктів...</p>
      ) : projects.length ? (
        <ul>
          {projects.map((proj) => (
            <li key={proj.id}>
              ID {proj.id}: {proj.design_type} — {proj.style} (Бюджет: {proj.budget})
            </li>
          ))}
        </ul>
      ) : (
        <p>Проєкти не знайдено.</p>
      )}
    </div>
  );
};

const DesignCallbacks = ({ token }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/design/callbacks/`,
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Запит на продзвін для номера ${phone} відправлено!`);
    } catch (err) {
      console.error("Помилка продзвону:", err);
      setMessage('Помилка відправлення запиту.');
    }
  };
  return (
    <div>
      <h3>Продзвін</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Введіть номер телефону"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit">Відправити</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

const DesignRequests = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/design/requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Помилка завантаження запитів:", err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div>
      <h3>Запити</h3>
      {loading ? (
        <p>Завантаження запитів...</p>
      ) : requests.length ? (
        <ul>
          {requests.map((req) => (
            <li key={req.id}>
              ID {req.id}: {req.message}
            </li>
          ))}
        </ul>
      ) : (
        <p>Запити відсутні.</p>
      )}
    </div>
  );
};

const DesignStatistics = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/design/statistics/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Помилка завантаження статистики:", err);
        setLoading(false);
      });
  }, [token]);
  return (
    <div>
      <h3>Статистика</h3>
      {loading ? (
        <p>Завантаження статистики...</p>
      ) : stats ? (
        <div>
          <p>Прибуток: {stats.profit}</p>
          <p>Замовлень: {stats.orders_count}</p>
          <p>Інше: {stats.others}</p>
        </div>
      ) : (
        <p>Статистика не доступна.</p>
      )}
    </div>
  );
};

const DesignCalendar = ({ token }) => {
  const [calendar, setCalendar] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/design/calendar/${projectId}/${year}/${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCalendar(res.data);
    } catch (err) {
      console.error("Помилка завантаження календаря:", err);
      setCalendar(null);
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Графік</h3>
      <div>
        <input
          type="number"
          placeholder="ID проєкту"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Рік"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <input
          type="number"
          placeholder="Місяць"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <button onClick={fetchCalendar}>Отримати календар</button>
      </div>
      {loading ? (
        <p>Завантаження календаря...</p>
      ) : calendar ? (
        <pre>{JSON.stringify(calendar, null, 2)}</pre>
      ) : (
        <p>Календар не доступний.</p>
      )}
    </div>
  );
};

const DesignClients = ({ token }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/design/clients/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setClients(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Помилка завантаження клієнтів:", err);
        setLoading(false);
      });
  }, [token]);
  return (
    <div>
      <h3>Клієнти</h3>
      {loading ? (
        <p>Завантаження...</p>
      ) : clients.length ? (
        <ul>
          {clients.map((client) => (
            <li key={client.id}>{client.name} - {client.phone}</li>
          ))}
        </ul>
      ) : (
        <p>Клієнти не знайдено.</p>
      )}
    </div>
  );
};

const RenovationAdmin = ({ token }) => {
  const [subView, setSubView] = useState('projects'); // можливі: projects, callbacks, requests, statistics, calendar, clients
  return (
    <div>
      <h2>Ремонт/Будівництво 🏗</h2>
      <RenovationNavigation setSubView={setSubView} />
      {subView === 'projects' && <RenovationProjects token={token} />}
      {subView === 'callbacks' && <RenovationCallbacks token={token} />}
      {subView === 'requests' && <RenovationRequests token={token} />}
      {subView === 'statistics' && <RenovationStatistics token={token} />}
      {subView === 'calendar' && <RenovationCalendar token={token} />}
      {subView === 'clients' && <RenovationClients token={token} />}
    </div>
  );
};

const RenovationNavigation = ({ setSubView }) => (
  <div>
    <button onClick={() => setSubView('projects')}>Проєкти</button>
    <button onClick={() => setSubView('callbacks')}>Продзвін</button>
    <button onClick={() => setSubView('requests')}>Запити</button>
    <button onClick={() => setSubView('statistics')}>Статистика</button>
    <button onClick={() => setSubView('calendar')}>Графік</button>
    <button onClick={() => setSubView('clients')}>Клієнти</button>
  </div>
);

// --- Проєкти ремонту/будівництва ---
const RenovationProjects = ({ token }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/renovation/projects/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProjects(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div>
      <h3>Проєкти</h3>
      {loading ? (
        <p>Завантаження проєктів...</p>
      ) : projects.length ? (
        <ul>
          {projects.map((proj) => (
            <li key={proj.id}>
              ID {proj.id}: {proj.address} - {proj.work_type} - {proj.cost}
            </li>
          ))}
        </ul>
      ) : (
        <p>Проєкти не знайдено.</p>
      )}
    </div>
  );
};

// --- Продзвін для ремонту/будівництва ---
const RenovationCallbacks = ({ token }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/renovation/callbacks/`,
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Запит на продзвін для номера ${phone} відправлено!`);
    } catch (err) {
      console.error(err);
      setMessage('Помилка відправлення запиту.');
    }
  };
  return (
    <div>
      <h3>Продзвін</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Введіть номер телефону"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit">Відправити</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

// --- Запити для ремонту/будівництва ---
const RenovationRequests = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/renovation/requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div>
      <h3>Запити</h3>
      {loading ? (
        <p>Завантаження запитів...</p>
      ) : requests.length ? (
        <ul>
          {requests.map((req) => (
            <li key={req.id}>
              ID {req.id}: {req.message}
            </li>
          ))}
        </ul>
      ) : (
        <p>Запити відсутні.</p>
      )}
    </div>
  );
};

// --- Статистика для ремонту/будівництва ---
const RenovationStatistics = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/renovation/statistics/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);
  return (
    <div>
      <h3>Статистика</h3>
      {loading ? (
        <p>Завантаження статистики...</p>
      ) : stats ? (
        <div>
          <p>Прибуток: {stats.profit}</p>
          <p>Замовлень: {stats.orders_count}</p>
          <p>Інше: {stats.others}</p>
        </div>
      ) : (
        <p>Статистика не доступна.</p>
      )}
    </div>
  );
};

// --- Графік для ремонту/будівництва ---
const RenovationCalendar = ({ token }) => {
  const [calendar, setCalendar] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/renovation/calendar/${projectId}/${year}/${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCalendar(res.data);
    } catch (err) {
      console.error(err);
      setCalendar(null);
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Графік</h3>
      <div>
        <input
          type="number"
          placeholder="ID проєкту"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Рік"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <input
          type="number"
          placeholder="Місяць"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <button onClick={fetchCalendar}>Отримати календар</button>
      </div>
      {loading ? (
        <p>Завантаження календаря...</p>
      ) : calendar ? (
        <pre>{JSON.stringify(calendar, null, 2)}</pre>
      ) : (
        <p>Календар не доступний.</p>
      )}
    </div>
  );
};

// --- Клієнти для ремонту/будівництва ---
const RenovationClients = ({ token }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/renovation/clients/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setClients(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);
  return (
    <div>
      <h3>Клієнти</h3>
      {loading ? (
        <p>Завантаження...</p>
      ) : clients.length ? (
        <ul>
          {clients.map((client) => (
            <li key={client.id}>
              {client.name} - {client.phone}
            </li>
          ))}
        </ul>
      ) : (
        <p>Клієнти не знайдено.</p>
      )}
    </div>
  );
};


const CleaningAdmin = ({ token }) => {
  const [subView, setSubView] = useState('orders'); // orders, callbacks, requests, statistics, calendar, clients

  return (
    <div>
      <h2>Клінінг 🧹</h2>
      <CleaningNavigation setSubView={setSubView} />
      {subView === 'orders' && <CleaningOrders token={token} />}
      {subView === 'callbacks' && <CleaningCallbacks token={token} />}
      {subView === 'requests' && <CleaningRequests token={token} />}
      {subView === 'statistics' && <CleaningStatistics token={token} />}
      {subView === 'calendar' && <CleaningCalendar token={token} />}
      {subView === 'clients' && <CleaningClients token={token} />}
    </div>
  );
};

const CleaningNavigation = ({ setSubView }) => (
  <div>
    <button onClick={() => setSubView('orders')}>Замовлення</button>
    <button onClick={() => setSubView('callbacks')}>Продзвін</button>
    <button onClick={() => setSubView('requests')}>Запити</button>
    <button onClick={() => setSubView('statistics')}>Статистика</button>
    <button onClick={() => setSubView('calendar')}>Графік</button>
    <button onClick={() => setSubView('clients')}>Клієнти</button>
  </div>
);

// --- Замовлення для клінінгу ---
const CleaningOrders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/cleaning/orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Помилка завантаження замовлень:", err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div>
      <h3>Замовлення для клінінгу</h3>
      {loading ? (
        <p>Завантаження замовлень...</p>
      ) : orders.length ? (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              ID {order.id}: {order.address} – {order.status}
            </li>
          ))}
        </ul>
      ) : (
        <p>Замовлення не знайдено.</p>
      )}
    </div>
  );
};

// --- Продзвін для клінінгу ---
const CleaningCallbacks = ({ token }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/cleaning/callbacks/`,
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 200 || res.status === 201) {
        setMessage(`Запит на продзвін для номера ${phone} відправлено!`);
      } else {
        setMessage("Помилка відправлення запиту.");
      }
    } catch (err) {
      console.error("Помилка продзвону:", err);
      setMessage("Помилка підключення до сервера.");
    }
  };

  return (
    <div>
      <h3>Продзвін для клінінгу</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Введіть номер телефону"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit">Відправити</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

// --- Запити для клінінгу ---
const CleaningRequests = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/cleaning/requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRequests(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Помилка завантаження запитів:", err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div>
      <h3>Запити для клінінгу</h3>
      {loading ? (
        <p>Завантаження запитів...</p>
      ) : requests.length ? (
        <ul>
          {requests.map((req) => (
            <li key={req.id}>
              ID {req.id}: {req.message}
            </li>
          ))}
        </ul>
      ) : (
        <p>Запити відсутні.</p>
      )}
    </div>
  );
};

// --- Статистика для клінінгу ---
const CleaningStatistics = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/cleaning/statistics/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Помилка завантаження статистики:", err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div>
      <h3>Статистика для клінінгу</h3>
      {loading ? (
        <p>Завантаження статистики...</p>
      ) : stats ? (
        <div>
          <p>Прибуток: {stats.profit}</p>
          <p>Замовлень: {stats.orders_count}</p>
          <p>Інше: {stats.others}</p>
        </div>
      ) : (
        <p>Статистика не доступна.</p>
      )}
    </div>
  );
};

// --- Графік для клінінгу ---
const CleaningCalendar = ({ token }) => {
  const [calendar, setCalendar] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/cleaning/calendar/${orderId}/${year}/${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCalendar(res.data);
    } catch (err) {
      console.error("Помилка завантаження календаря:", err);
      setCalendar(null);
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Графік для клінінгу</h3>
      <div>
        <input
          type="number"
          placeholder="ID замовлення"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Рік"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <input
          type="number"
          placeholder="Місяць"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
        <button onClick={fetchCalendar}>Отримати календар</button>
      </div>
      {loading ? (
        <p>Завантаження календаря...</p>
      ) : calendar ? (
        <pre>{JSON.stringify(calendar, null, 2)}</pre>
      ) : (
        <p>Календар не доступний.</p>
      )}
    </div>
  );
};

// --- Клієнти для клінінгу ---
const CleaningClients = ({ token }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API_URL}/cleaning/clients/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setClients(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Помилка завантаження клієнтів:", err);
        setLoading(false);
      });
  }, [token]);

  return (
    <div>
      <h3>Клієнти для клінінгу</h3>
      {loading ? (
        <p>Завантаження...</p>
      ) : clients.length ? (
        <ul>
          {clients.map((client) => (
            <li key={client.id}>
              {client.name} - {client.phone}
            </li>
          ))}
        </ul>
      ) : (
        <p>Клієнти не знайдено.</p>
      )}
    </div>
  );
};



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
