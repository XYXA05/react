// ClientsList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const ClientsList = ({ token, onBack }) => {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/get_orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Extract contact info from orders
      const activeClients = response.data.filter(
        (order) => order.name && order.phone
      );
      const clientContacts = activeClients.map((order) => ({
        id: order.id,
        name: order.name,
        phone: order.phone,
      }));
      setClients(clientContacts);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch client contacts.');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (clientId) => {
    try {
      await axios.delete(`${API_URL}/orders/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchClients();
    } catch (err) {
      console.error(err);
      setError('Failed to delete client.');
    }
  };

  const handleEdit = (client) => {
    setEditingClient({ ...client });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_URL}/orders/${editingClient.id}`, editingClient, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingClient(null);
      fetchClients();
    } catch (err) {
      console.error(err);
      setError('Failed to update client.');
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/orders/`, newClient, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewClient({ name: '', phone: '' });
      setShowAddForm(false);
      fetchClients();
    } catch (err) {
      console.error(err);
      setError('Failed to add client.');
    }
  };

  return (
    <div className="clients-list">
      <h3>Client Contacts</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => setShowAddForm(!showAddForm)}>
        {showAddForm ? 'Hide Add Form' : 'Add Client'}
      </button>
      {showAddForm && (
        <div className="add-client-form">
          <h4>Add New Client</h4>
          <form onSubmit={handleAddClient}>
            <input
              type="text"
              placeholder="Name"
              value={newClient.name}
              onChange={(e) =>
                setNewClient({ ...newClient, name: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Phone"
              value={newClient.phone}
              onChange={(e) =>
                setNewClient({ ...newClient, phone: e.target.value })
              }
              required
            />
            <button type="submit">Submit Client</button>
          </form>
        </div>
      )}
      <hr />
      {clients && clients.length > 0 ? (
        <table className="clients-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) =>
              editingClient && editingClient.id === client.id ? (
                <tr key={client.id}>
                  <td>
                    <input
                      type="text"
                      value={editingClient.name}
                      onChange={(e) =>
                        setEditingClient({
                          ...editingClient,
                          name: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingClient.phone}
                      onChange={(e) =>
                        setEditingClient({
                          ...editingClient,
                          phone: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <button onClick={handleSaveEdit}>Save</button>
                    <button onClick={() => setEditingClient(null)}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.phone}</td>
                  <td>
                    <button onClick={() => handleEdit(client)}>Edit</button>
                    <button onClick={() => handleDelete(client.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      ) : (
        <p>No client contacts found.</p>
      )}
      <button onClick={onBack}>Back</button>
    </div>
  );
};

export default ClientsList;
