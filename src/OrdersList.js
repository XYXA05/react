// OrdersList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const OrdersList = ({ token, onBack }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrder, setNewOrder] = useState({ name: '', phone: '', ed_status: '' });

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

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (orderId) => {
    try {
      await axios.delete(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Failed to delete order.');
    }
  };

  const handleEdit = (order) => {
    setEditingOrder({ ...order });
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_URL}/orders/${editingOrder.id}`, editingOrder, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Failed to update order.');
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/orders/`, newOrder, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewOrder({ name: '', phone: '', ed_status: '' });
      setShowAddForm(false);
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Failed to add order.');
    }
  };

  return (
    <div className="orders-list">
      <h3>Orders (Full Details)</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Toggle button for the Add Order form */}
      <button onClick={() => setShowAddForm(!showAddForm)}>
        {showAddForm ? 'Hide Add Form' : 'Add Order'}
      </button>
      {showAddForm && (
        <div className="add-order-form">
          <h4>Add New Order</h4>
          <form onSubmit={handleAddOrder}>
            <input
              type="text"
              placeholder="Name"
              value={newOrder.name}
              onChange={(e) =>
                setNewOrder({ ...newOrder, name: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Phone"
              value={newOrder.phone}
              onChange={(e) =>
                setNewOrder({ ...newOrder, phone: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Status"
              value={newOrder.ed_status}
              onChange={(e) =>
                setNewOrder({ ...newOrder, ed_status: e.target.value })
              }
            />
            <button type="submit">Submit Order</button>
          </form>
        </div>
      )}
      <hr />

      {orders && orders.length > 0 ? (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) =>
              editingOrder && editingOrder.id === order.id ? (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>
                    <input
                      type="text"
                      value={editingOrder.name}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          name: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingOrder.phone}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          phone: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingOrder.ed_status}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          ed_status: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <button onClick={handleSaveEdit}>Save</button>
                    <button onClick={() => setEditingOrder(null)}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.name}</td>
                  <td>{order.phone}</td>
                  <td>{order.ed_status}</td>
                  <td>
                    <button onClick={() => handleEdit(order)}>Edit</button>
                    <button onClick={() => handleDelete(order.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      ) : (
        <p>No orders found.</p>
      )}
      <button onClick={onBack}>Back</button>
    </div>
  );
};

export default OrdersList;
