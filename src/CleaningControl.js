// src/CleaningControl.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import RentalCalendar from './RentalCalendar';
import html2canvas from 'html2canvas';
import './control.css';

const API_URL = 'http://localhost:8000'; // adjust if needed

function CleaningControl() {
  // —— View State ——
  const [view, setView] = useState('list');              // 'list' | 'form' | 'calendar'
  const [selectedOrder, setSelectedOrder] = useState(null);

  // —— Data State ——
  const [orders, setOrders] = useState([]);              // all orders
  const [filteredOrders, setFilteredOrders] = useState([]); // after filters
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // —— Filter State ——
  const [searchText, setSearchText] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [cleaningTypeFilter, setCleaningTypeFilter] = useState('');
  const [costMin, setCostMin] = useState('');
  const [costMax, setCostMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // —— Pagination State ——
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const pageCount = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginated = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // —— Form State ——
  const initialForm = {
    address: '',
    room_type: '',
    area: '',
    cleaning_type: '',
    duration: '',
    cost: '',
    additional_services: '',
    features: '',
    execution_date: '',
    comment: '',
  };
  const [formOrder, setFormOrder] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  // —— Export Ref for html2canvas ——
  const exportRef = useRef(null);

  // —— Fetch Orders ——
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/cleaning/orders/`);
      setOrders(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // —— Apply Filters ——
  const applyFilters = useCallback(() => {
    let list = [...orders];
    const q = searchText.trim().toLowerCase();

    if (q) {
      list = list.filter(o =>
        (o.comment || '').toLowerCase().includes(q) ||
        (o.features || '').toLowerCase().includes(q) ||
        (o.additional_services || '').toLowerCase().includes(q)
      );
    }
    if (addressFilter) {
      list = list.filter(o =>
        o.address.toLowerCase().includes(addressFilter.toLowerCase())
      );
    }
    if (roomTypeFilter) {
      list = list.filter(o => o.room_type === roomTypeFilter);
    }
    if (cleaningTypeFilter) {
      list = list.filter(o => o.cleaning_type === cleaningTypeFilter);
    }
    if (costMin) {
      list = list.filter(o => parseFloat(o.cost) >= parseFloat(costMin));
    }
    if (costMax) {
      list = list.filter(o => parseFloat(o.cost) <= parseFloat(costMax));
    }
    if (dateFrom) {
      list = list.filter(o => o.execution_date >= dateFrom);
    }
    if (dateTo) {
      list = list.filter(o => o.execution_date <= dateTo);
    }

    setFilteredOrders(list);
    setCurrentPage(1);
  }, [
    orders,
    searchText,
    addressFilter,
    roomTypeFilter,
    cleaningTypeFilter,
    costMin,
    costMax,
    dateFrom,
    dateTo
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // —— Handlers ——
  const handleFilterChange = setter => e => setter(e.target.value);
  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormOrder(prev => ({ ...prev, [name]: value }));
  };

  const startEditing = order => {
    setFormOrder(order);
    setEditingId(order.id);
    setView('form');
  };

  const cancelForm = () => {
    setFormOrder(initialForm);
    setEditingId(null);
    setView('list');
  };

  const saveOrder = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await axios.put(
          `${API_URL}/cleaning/orders/${editingId}/`,
          formOrder
        );
        setOrders(prev => prev.map(o => (o.id === editingId ? res.data : o)));
      } else {
        const res = await axios.post(
          `${API_URL}/cleaning/orders/`,
          formOrder
        );
        setOrders(prev => [...prev, res.data]);
      }
      cancelForm();
      setError('');
    } catch (err) {
      console.error('Error saving order:', err);
      setError('Error saving order.');
    }
  };

  const deleteOrder = async id => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await axios.delete(`${API_URL}/cleaning/orders/${id}/`);
      setOrders(prev => prev.filter(o => o.id !== id));
      setError('');
    } catch (err) {
      console.error('Error deleting order:', err);
      setError('Failed to delete.');
    }
  };

  const exportOrder = async order => {
    const container = document.createElement('div');
    Object.assign(container.style, {
      padding: '20px',
      background: '#fff',
      color: '#000',
      fontFamily: 'Arial'
    });
    container.innerHTML = `
      <h1>Cleaning Order #${order.id}</h1>
      <p><strong>Address:</strong> ${order.address}</p>
      <p><strong>Room:</strong> ${order.room_type} (${order.area} m²)</p>
      <p><strong>Type:</strong> ${order.cleaning_type}</p>
      <p><strong>Duration:</strong> ${order.duration}</p>
      <p><strong>Cost:</strong> ${order.cost}</p>
      <p><strong>Date:</strong> ${order.execution_date}</p>
      <p><strong>Additional Services:</strong> ${order.additional_services}</p>
      <p><strong>Features:</strong> ${order.features}</p>
      <p><strong>Comment:</strong> ${order.comment}</p>
    `;
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { useCORS: true, scale: 2 });
    const link = document.createElement('a');
    link.download = `cleaning-${order.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    document.body.removeChild(container);
  };

  // —— Calendar View ——
  if (view === 'calendar' && selectedOrder) {
    return (
      <RentalCalendar
        propertyId={selectedOrder.id}
        category="Клінінг"
        onBack={() => setView('list')}
      />
    );
  }

  // —— Main Render ——
  return (
    <div className="container" ref={exportRef}>
      <h2>Cleaning Orders Control</h2>

      {/* Toolbar */}
      <div className="toolbar">
        <button onClick={() => { cancelForm(); setView('form'); }}>+ New Order</button>
        <button onClick={() => exportRef.current && html2canvas(exportRef.current).then(canvas => {
          const link = document.createElement('a');
          link.download = `cleaning-orders.png`;
          link.href = canvas.toDataURL();
          link.click();
        })}>Export View</button>
      </div>

      {/* Filters Section */}
      <section className="filters card">
        <input
          type="text"
          placeholder="Search comments, features, services"
          value={searchText}
          onChange={handleFilterChange(setSearchText)}
          className="filter-input animated"
        />
        <input
          type="text"
          placeholder="Filter by Address"
          value={addressFilter}
          onChange={handleFilterChange(setAddressFilter)}
          className="filter-input animated"
        />
        <input
          type="text"
          placeholder="Filter by Room Type"
          value={roomTypeFilter}
          onChange={handleFilterChange(setRoomTypeFilter)}
          className="filter-input animated"
        />
        <input
          type="text"
          placeholder="Filter by Cleaning Type"
          value={cleaningTypeFilter}
          onChange={handleFilterChange(setCleaningTypeFilter)}
          className="filter-input animated"
        />
        <input
          type="number"
          placeholder="Min Cost"
          value={costMin}
          onChange={handleFilterChange(setCostMin)}
          className="filter-input animated"
        />
        <input
          type="number"
          placeholder="Max Cost"
          value={costMax}
          onChange={handleFilterChange(setCostMax)}
          className="filter-input animated"
        />
        <label>Date From:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={handleFilterChange(setDateFrom)}
          className="filter-input animated"
        />
        <label>Date To:</label>
        <input
          type="date"
          value={dateTo}
          onChange={handleFilterChange(setDateTo)}
          className="filter-input animated"
        />
      </section>

      {/* List / Table View */}
      <section className="orders-list card">
        {loading ? (
          <div>Loading cleaning orders...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="apartments-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Address</th>
                    <th>Room Type</th>
                    <th>Area</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Cost</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.address}</td>
                      <td>{order.room_type}</td>
                      <td>{order.area} m²</td>
                      <td>{order.cleaning_type}</td>
                      <td>{order.duration}</td>
                      <td>{order.cost}</td>
                      <td>{order.execution_date}</td>
                      <td className="actions-cell">
                        <button onClick={() => { setSelectedOrder(order); setView('calendar'); }}>📅</button>
                        <button onClick={() => startEditing(order)}>Edit</button>
                        <button onClick={() => deleteOrder(order.id)}>Delete</button>
                        <button onClick={() => exportOrder(order)}>Export</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="pagination">
                <button onClick={() => setCurrentPage(cp => Math.max(cp - 1, 1))} disabled={currentPage === 1}>
                  ‹ Prev
                </button>
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i + 1}
                    className={currentPage === i + 1 ? 'active' : ''}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(cp => Math.min(cp + 1, pageCount))} disabled={currentPage === pageCount}>
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Form View */}
      {view === 'form' && (
        <form className="order-form card" onSubmit={saveOrder}>
          <h3>{editingId ? 'Edit' : 'Add'} Cleaning Order</h3>
          <label>
            Address:
            <input
              name="address"
              value={formOrder.address}
              onChange={handleFormChange}
              required
            />
          </label>
          <label>
            Room Type:
            <input
              name="room_type"
              value={formOrder.room_type}
              onChange={handleFormChange}
              required
            />
          </label>
          <label>
            Area (m²):
            <input
              name="area"
              type="number"
              value={formOrder.area}
              onChange={handleFormChange}
              required
            />
          </label>
          <label>
            Cleaning Type:
            <input
              name="cleaning_type"
              value={formOrder.cleaning_type}
              onChange={handleFormChange}
              required
            />
          </label>
          <label>
            Duration:
            <input
              name="duration"
              value={formOrder.duration}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Cost:
            <input
              name="cost"
              type="number"
              value={formOrder.cost}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Execution Date:
            <input
              name="execution_date"
              type="date"
              value={formOrder.execution_date}
              onChange={handleFormChange}
              required
            />
          </label>
          <label>
            Additional Services:
            <textarea
              name="additional_services"
              value={formOrder.additional_services}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Features:
            <textarea
              name="features"
              value={formOrder.features}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Comment:
            <textarea
              name="comment"
              value={formOrder.comment}
              onChange={handleFormChange}
            />
          </label>
          <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CleaningControl;
