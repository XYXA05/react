import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function MediaBuyerAdminPanel() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [newLink, setNewLink] = useState({
    resource_url: '',
    telegram_bot_key: '',
    category: '',
    link_name: ''
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await axios.get(`${API_URL}/mediabuyer/links/`);
      setLinks(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Помилка отримання посилань MediaBuyer:", error);
      setLoading(false);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/mediabuyer/links/`, newLink);
      setLinks([...links, response.data]);
      setNewLink({ resource_url: '', telegram_bot_key: '', category: '', link_name: '' });
    } catch (error) {
      console.error("Помилка додавання посилання MediaBuyer:", error);
    }
  };

  const handleDeleteLink = async (id) => {
    try {
      await axios.delete(`${API_URL}/mediabuyer/links/${id}`);
      setLinks(links.filter(link => link.id !== id));
    } catch (error) {
      console.error("Помилка видалення посилання MediaBuyer:", error);
    }
  };

  const filteredLinks = links.filter(link =>
    link.link_name.toLowerCase().includes(filter.toLowerCase()) ||
    link.category.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div>Завантаження посилань MediaBuyer...</div>;

  return (
    <div>
      <h2>Адмінка для MediaBuyer 🏰</h2>
      <input
        type="text"
        placeholder="Фільтр посилань"
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      <ul>
        {filteredLinks.map(link => (
          <li key={link.id}>
            {link.id}: {link.link_name} ({link.category})
            <button onClick={() => handleDeleteLink(link.id)}>Видалити</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddLink}>
        <h3>Створити нове посилання</h3>
        <input
          type="text"
          placeholder="URL ресурсу"
          value={newLink.resource_url}
          onChange={e => setNewLink({ ...newLink, resource_url: e.target.value })}
        />
        <input
          type="text"
          placeholder="Telegram Bot Key"
          value={newLink.telegram_bot_key}
          onChange={e => setNewLink({ ...newLink, telegram_bot_key: e.target.value })}
        />
        <input
          type="text"
          placeholder="Категорія"
          value={newLink.category}
          onChange={e => setNewLink({ ...newLink, category: e.target.value })}
        />
        <input
          type="text"
          placeholder="Назва посилання"
          value={newLink.link_name}
          onChange={e => setNewLink({ ...newLink, link_name: e.target.value })}
        />
        <button type="submit">Створити посилання</button>
      </form>
    </div>
  );
}

export default MediaBuyerAdminPanel;
