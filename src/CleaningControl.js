import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RentalCalendar from './RentalCalendar'; // Import RentalCalendar component
const API_URL = 'http://localhost:8000'; // Adjust if needed

const CleaningControl = () => {
  // State for cleaning orders
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // State for filtering orders
  const [filter, setFilter] = useState('');
  // New cleaning order form state
  const [newOrder, setNewOrder] = useState({
    address: '',
    room_type: '',
    area: '',
    cleaning_type: '',
    duration: '',
    cost: '',
    additional_services: '',
    features: '',
    execution_date: '',
    comment: ''
  });
  // State for editing an order
  const [editOrder, setEditOrder] = useState(null);
  // State for calendar view info
  const [calendarInfo, setCalendarInfo] = useState(null);

  // Function to open calendar view
  const openCalendar = (id, category) => {
    setCalendarInfo({ id, category });
  };

  // Fetch cleaning orders from backend
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/cleaning/orders/`);
      setOrders(response.data);
      setError('');
    } catch (err) {
      console.error("Error fetching cleaning orders:", err);
      setError('Error fetching cleaning orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle new order form changes
  const handleNewOrderChange = (e) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({ ...prev, [name]: value }));
  };

  // Handle filter input changes
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Add a new cleaning order
  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/cleaning/orders/`, newOrder);
      setOrders(prev => [...prev, response.data]);
      setNewOrder({
        address: '',
        room_type: '',
        area: '',
        cleaning_type: '',
        duration: '',
        cost: '',
        additional_services: '',
        features: '',
        execution_date: '',
        comment: ''
      });
      setError('');
    } catch (err) {
      console.error("Error adding cleaning order:", err);
      setError('Error adding cleaning order.');
    }
  };

  // Start editing an order
  const startEditing = (order) => {
    setEditOrder(order);
  };

  // Handle editing form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditOrder(prev => ({ ...prev, [name]: value }));
  };

  // Update an order via PUT
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/cleaning/orders/${editOrder.id}`, editOrder);
      setOrders(prev =>
        prev.map(order => (order.id === editOrder.id ? response.data : order))
      );
      setEditOrder(null);
      setError('');
    } catch (err) {
      console.error("Error updating cleaning order:", err);
      setError('Error updating cleaning order.');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditOrder(null);
  };

  // Delete an order
  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this cleaning order?")) return;
    try {
      await axios.delete(`${API_URL}/cleaning/orders/${id}`);
      setOrders(prev => prev.filter(order => order.id !== id));
      setError('');
    } catch (err) {
      console.error("Error deleting cleaning order:", err);
      setError('Error deleting cleaning order.');
    }
  };

  // Filter orders based on cleaning_type or address
  const filteredOrders = orders.filter(order =>
    order.cleaning_type.toLowerCase().includes(filter.toLowerCase()) ||
    order.address.toLowerCase().includes(filter.toLowerCase())
  );

  if (calendarInfo) {
    return (
      <RentalCalendar
        propertyId={calendarInfo.id}
        category={calendarInfo.category}
        onBack={() => setCalendarInfo(null)}
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Cleaning Orders Control</h2>
      
      {/* Filter input */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          placeholder="Filter by cleaning type or address..."
          value={filter}
          onChange={handleFilterChange}
          style={{ padding: '8px', width: '300px' }}
        />
      </div>

      {/* Display orders list */}
      {loading ? (
        <div>Loading cleaning orders...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Address</th>
              <th>Room Type</th>
              <th>Area</th>
              <th>Cleaning Type</th>
              <th>Duration</th>
              <th>Cost</th>
              <th>Execution Date</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>
                  {editOrder && editOrder.id === order.id ? (
                    <input
                      name="address"
                      value={editOrder.address}
                      onChange={handleEditChange}
                    />
                  ) : (
                    order.address
                  )}
                </td>
                <td>
                  {editOrder && editOrder.id === order.id ? (
                    <input
                      name="room_type"
                      value={editOrder.room_type}
                      onChange={handleEditChange}
                    />
                  ) : (
                    order.room_type
                  )}
                </td>
                <td>{order.area}</td>
                <td>
                  {editOrder && editOrder.id === order.id ? (
                    <input
                      name="cleaning_type"
                      value={editOrder.cleaning_type}
                      onChange={handleEditChange}
                    />
                  ) : (
                    order.cleaning_type
                  )}
                </td>
                <td>{order.duration}</td>
                <td>{order.cost}</td>
                <td>{order.execution_date}</td>
                <td>{order.comment}</td>
                <td>
                  {editOrder && editOrder.id === order.id ? (
                    <>
                      <button onClick={handleUpdateOrder}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openCalendar(order.id, 'Клінінг')}>Calendar</button>
                      <button onClick={() => startEditing(order)}>Edit</button>
                      <button onClick={() => handleDeleteOrder(order.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Form to add new cleaning order */}
      <h3>Add New Cleaning Order</h3>
      <form onSubmit={handleAddOrder}>
        <div>
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={newOrder.address}
            onChange={handleNewOrderChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="room_type"
            placeholder="Room Type"
            value={newOrder.room_type}
            onChange={handleNewOrderChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="area"
            placeholder="Area"
            value={newOrder.area}
            onChange={handleNewOrderChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="cleaning_type"
            placeholder="Cleaning Type"
            value={newOrder.cleaning_type}
            onChange={handleNewOrderChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="duration"
            placeholder="Duration"
            value={newOrder.duration}
            onChange={handleNewOrderChange}
          />
        </div>
        <div>
          <input
            type="text"
            name="cost"
            placeholder="Cost"
            value={newOrder.cost}
            onChange={handleNewOrderChange}
          />
        </div>
        <div>
          <input
            type="date"
            name="execution_date"
            placeholder="Execution Date"
            value={newOrder.execution_date}
            onChange={handleNewOrderChange}
            required
          />
        </div>
        <div>
          <textarea
            name="comment"
            placeholder="Comment"
            value={newOrder.comment}
            onChange={handleNewOrderChange}
          />
        </div>
        <div>
          <textarea
            name="additional_services"
            placeholder="Additional Services"
            value={newOrder.additional_services}
            onChange={handleNewOrderChange}
          />
        </div>
        <div>
          <textarea
            name="features"
            placeholder="Features"
            value={newOrder.features}
            onChange={handleNewOrderChange}
          />
        </div>
        <button type="submit">Add Order</button>
      </form>
    </div>
  );
};

export default CleaningControl;
