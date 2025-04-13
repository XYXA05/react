import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function StatisticsDisplay() {
  const [module, setModule] = useState('store'); // store, design, renovation, cleaning, mediabuyer
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatistics = async (selectedModule) => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (selectedModule) {
        case 'store':
          endpoint = '/store/statistics';
          break;
        case 'design':
          endpoint = '/design/statistics';
          break;
        case 'renovation':
          endpoint = '/renovation/statistics';
          break;
        case 'cleaning':
          endpoint = '/cleaning/statistics';
          break;
        case 'mediabuyer':
          endpoint = '/mediabuyer/statistics';
          break;
        default:
          endpoint = '/store/statistics';
      }
      const response = await axios.get(`${API_URL}${endpoint}`);
      setStats(response.data);
    } catch (error) {
      console.error("Помилка отримання статистики:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics(module);
  }, [module]);

  return (
    <div>
      <h3>Статистика</h3>
      <select value={module} onChange={(e) => setModule(e.target.value)}>
        <option value="store">Інтернет-магазин</option>
        <option value="design">Дизайн</option>
        <option value="renovation">Ремонт/Будівництво</option>
        <option value="cleaning">Клінінг</option>
        <option value="mediabuyer">MediaBuyer</option>
      </select>
      {loading ? (
        <p>Завантаження статистики...</p>
      ) : stats ? (
        <div>
          {(module === 'store' || module === 'cleaning' || module === 'mediabuyer') ? (
            <div>
              <p>Загальна кількість замовлень/кліків: {stats.total_orders || stats.total_clicks}</p>
              <p>Очікують: {stats.pending}</p>
              <p>Обробляються: {stats.processing}</p>
              <p>Завершено: {stats.completed}</p>
              {module === 'mediabuyer' && <p>Заробіток: {stats.earnings}$</p>}
            </div>
          ) : (
            <div>
              <p>Загальна кількість проєктів: {stats.total_projects}</p>
            </div>
          )}
        </div>
      ) : (
        <p>Статистика відсутня.</p>
      )}
    </div>
  );
}

export default StatisticsDisplay;
