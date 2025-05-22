// src/ClientsAdminPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';


/**
 * Helper: returns the correct API endpoint based on user category
 */
const getEndpoint = (category) => {
  switch (category) {
    case 'cliner':
    case 'cliner_leader':
      return '/cleaning/clients/';
    case 'repair_construction':
    case 'repair_construction_leader':
      return '/renovation/clients/';
    case 'design':
    case 'design_leader':
      return '/design/clients/';
    case 'store':
    case 'store_leader':
      return '/store/clients/';
  }
};

/**
 * ClientsAdminPanel
 * 
 * A unified admin UI for listing, searching, paginating,
 * and performing CRUD on client contacts across modules.
 */
const ClientsAdminPanel = ({ token, category, onBack }) => {
  // --- STATE ---
  const [clients, setClients] = useState([]);           // Raw list from server
  const [loading, setLoading] = useState(true);         // Loading indicator
  const [error, setError] = useState('');               // Error message

  const [filterText, setFilterText] = useState('');     // Name/phone filter
  const [page, setPage] = useState(1);                  // Pagination current page
  const [pageSize, setPageSize] = useState(10);         // Items per page

  const [editing, setEditing] = useState(null);         // { id, name, phone } or null
  const [form, setForm] = useState({                    // New client form
    name: '',
    phone: '',
  });
  const [showAdd, setShowAdd] = useState(false);        // Toggle add form

  const endpoint = getEndpoint(category);               // /module/clients/

  // --- FETCH CLIENTS ---
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
           const { data } = await axios.get(endpoint, {
               baseURL: process.env.REACT_APP_API_URL,
               headers: { Authorization: `Bearer ${token}` },
             });
             // ensure we always get an array
             const list = Array.isArray(data)
               ? Array.isArray(data[0]) ? data[0] : data
               : [];
             setClients(list);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load client contacts.');
    } finally {
      setLoading(false);
    }
  }, [endpoint, token]);

  useEffect(() => {
    fetchClients();
    setPage(1);
  }, [fetchClients]);

  // --- FILTER & PAGINATION ---
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(filterText.toLowerCase()) ||
    c.phone.toLowerCase().includes(filterText.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // --- HANDLERS ---
  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const startEdit = (client) => {
    setEditing({ ...client });
  };

  const cancelEdit = () => {
    setEditing(null);
    setError('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditing(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editing) return;
    setError('');
    try {
      await axios.put(`${endpoint}${editing.id}/`, editing, {
        baseURL: process.env.REACT_APP_API_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(prev =>
        prev.map(c => (c.id === editing.id ? editing : c))
      );
      setEditing(null);
    } catch (err) {
      console.error('Error updating client:', err);
      setError('Failed to update client.');
    }
  };

  const deleteClient = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    setError('');
    try {
      await axios.delete(`${endpoint}${id}/`, {
        baseURL: process.env.REACT_APP_API_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client.');
    }
  };

  const toggleAdd = () => {
    setShowAdd(prev => !prev);
    setForm({ name: '', phone: '' });
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const resp = await axios.post(endpoint, form, {
        baseURL: process.env.REACT_APP_API_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(prev => [...prev, resp.data]);
      setForm({ name: '', phone: '' });
      setShowAdd(false);
    } catch (err) {
      console.error('Error adding client:', err);
      setError('Failed to add client.');
    }
  };

  // --- RENDER ---
  return (
    <div className="clients-admin-panel">
      <header className="cap-header">
        <button className="cap-back-btn" onClick={onBack}>← Back</button>
        <h2 className="cap-title">Clients: {category.replace(/_/g, ' ')}</h2>
      </header>

      <div className="cap-controls">
        <input
          type="text"
          className="cap-filter-input"
          placeholder="Search by name or phone…"
          value={filterText}
          onChange={handleFilterChange}
        />
        <button className="cap-add-btn" onClick={toggleAdd}>
          {showAdd ? 'Hide Add Form' : 'Add Client'}
        </button>
      </div>

      {showAdd && (
        <form className="cap-add-form" onSubmit={submitAdd}>
          <div className="cap-form-row">
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="cap-form-row">
            <label>Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              required
            />
          </div>
          <div className="cap-form-actions">
            <button type="submit">Submit</button>
            <button type="button" onClick={toggleAdd}>Cancel</button>
          </div>
        </form>
      )}

      {error && <div className="cap-error">{error}</div>}
      {loading ? (
        <div className="cap-loading">Loading clients…</div>
      ) : (
        <>
          <table className="cap-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th className="cap-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="3" className="cap-no-data">
                    No clients found.
                  </td>
                </tr>
              ) : paginated.map(client => (
                <tr key={client.id}>
                  <td>
                    {editing?.id === client.id ? (
                      <input
                        name="name"
                        value={editing.name}
                        onChange={handleEditChange}
                      />
                    ) : (
                      client.name
                    )}
                  </td>
                  <td>
                    {editing?.id === client.id ? (
                      <input
                        name="phone"
                        value={editing.phone}
                        onChange={handleEditChange}
                      />
                    ) : (
                      client.phone
                    )}
                  </td>
                  <td>
                    {editing?.id === client.id ? (
                      <>
                        <button onClick={saveEdit}>Save</button>
                        <button onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(client)}>Edit</button>
                        <button onClick={() => deleteClient(client.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cap-pagination">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >‹ Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={page === i + 1 ? 'active' : ''}
                onClick={() => handlePageChange(i + 1)}
              >{i + 1}</button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >Next ›</button>
          </div>

          <div className="cap-page-size">
            <label>Items per page:</label>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              {[5, 10, 20, 50].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
};

ClientsAdminPanel.propTypes = {
  token: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default ClientsAdminPanel;
