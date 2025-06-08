// src/CleaningControl.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import RentalCalendar from './RentalCalendar';
import html2canvas from 'html2canvas';
import './control.css';

const API_URL = 'http://localhost:8000'; // adjust if needed
const PAGE_SIZE = 10;

function CleaningControl() {
  // ─── VIEW STATE ─────────────────────────────────────────────────────────────
  const [view, setView] = useState('list');              // 'list' | 'form' | 'calendar'
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ─── DATA STATE ─────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);              // all orders
  const [filteredOrders, setFilteredOrders] = useState([]); // after filters
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── FILTER STATE ───────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [cleaningTypeFilter, setCleaningTypeFilter] = useState('');
  const [costMin, setCostMin] = useState('');
  const [costMax, setCostMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ─── PAGINATION STATE ───────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginated = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ─── FORM STATE ─────────────────────────────────────────────────────────────
  // Include name, phone, email, telegram_username + all cleaning fields + photos array
  const initialForm = {
    name: '',
    phone: '',
    email: '',
    telegram_username: '',
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
    photos: [] // Each element: either { id, file_path, filename } from server, or { id: 'new-...', file, preview }
  };
  const [formOrder, setFormOrder] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  // ─── REF FOR html2canvas (Export entire view) ───────────────────────────────
  const exportRef = useRef(null);

  // ─── FETCH ALL CLEANING ORDERS ───────────────────────────────────────────────
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

  // ─── APPLY FILTERS ──────────────────────────────────────────────────────────
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
    if (addressFilter.trim()) {
      list = list.filter(o =>
        o.address?.toLowerCase().includes(addressFilter.trim().toLowerCase())
      );
    }
    if (roomTypeFilter.trim()) {
      list = list.filter(o => o.room_type === roomTypeFilter.trim());
    }
    if (cleaningTypeFilter.trim()) {
      list = list.filter(o => o.cleaning_type === cleaningTypeFilter.trim());
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

  // ─── HANDLERS ──────────────────────────────────────────────────────────────
  const handleFilterChange = setter => e => setter(e.target.value);
  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormOrder(prev => ({ ...prev, [name]: value }));
  };

  // When user clicks “Upload Photos” in the form:
  const handlePhotoUpload = e => {
    const files = Array.from(e.target.files).map((file, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      file,
      preview: URL.createObjectURL(file)
    }));
    setFormOrder(prev => ({
      ...prev,
      photos: [...(Array.isArray(prev.photos) ? prev.photos : []), ...files]
    }));
  };

  // When user clicks “Edit” on an existing cleaning order:
  const startEditing = async (order) => {
    // 1) Load the order’s fields into the form
    setFormOrder({
      name: order.name || '',
      phone: order.phone || '',
      email: order.email || '',
      telegram_username: order.telegram_username || '',
      address: order.address || '',
      room_type: order.room_type || '',
      area: order.area || '',
      cleaning_type: order.cleaning_type || '',
      duration: order.duration || '',
      cost: order.cost || '',
      additional_services: order.additional_services || '',
      features: order.features || '',
      execution_date: order.execution_date || '',
      comment: order.comment || '',
      photos: [] // we’ll overwrite this in step 2
    });
    setEditingId(order.id);
    setView('form');

    // 2) Fetch existing files from /files/cleaning/{order.id}
    try {
      const { data: filesList } = await axios.get(`${API_URL}/files/cleaning/${order.id}`);
      // filesList is an array of FileAdminResponse: { id, filename, date, content_type, file_path, purpose? }
      // We only need id, file_path, filename for preview in form.
      const existingPhotos = filesList.map(f => ({
        id: f.id,
        file_path: f.file_path,
        filename: f.filename
      }));
      setFormOrder(prev => ({ ...prev, photos: existingPhotos }));
    } catch (err) {
      console.error('Could not fetch existing photos:', err);
      // Even if photo fetch fails, we let the user edit other fields.
    }
  };

  const cancelForm = () => {
    // Clean up any objectURLs for newly selected previews:
    formOrder.photos.forEach((p) => {
      if (p.preview) {
        URL.revokeObjectURL(p.preview);
      }
    });
    setFormOrder(initialForm);
    setEditingId(null);
    setView('list');
  };

  // When the user clicks the little “✕” on any thumbnail in form mode:
  const handleDeletePhoto = async (photoItem) => {
    // If it’s an existing photo (has a numeric `id`), call DELETE /files/{id}.
    if (photoItem.id && typeof photoItem.id === 'number') {
      try {
        await axios.delete(`${API_URL}/files/${photoItem.id}`);
      } catch (err) {
        console.error('Failed to delete photo on server:', err);
      }
    }
    // If it’s “new” (id starts with 'new-'), just revoke its preview URL and remove it locally.
    if (photoItem.preview) {
      URL.revokeObjectURL(photoItem.preview);
    }
    // In either case, remove it from state:
    setFormOrder(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== photoItem.id)
    }));
  };

  // Saving a brand‐new or updated cleaning order:
  const saveOrder = async (e) => {
    e.preventDefault();

    // 1) Build the payload that matches your Pydantic schema exactly:
    const payload = {
      name: formOrder.name,
      phone: formOrder.phone,
      email: formOrder.email || null,
      telegram_username: formOrder.telegram_username || null,
      address: formOrder.address,
      room_type: formOrder.room_type,
      area: formOrder.area,
      cleaning_type: formOrder.cleaning_type,
      duration: formOrder.duration,
      cost: formOrder.cost,
      additional_services: formOrder.additional_services || null,
      features: formOrder.features || null,
      execution_date: formOrder.execution_date,
      comment: formOrder.comment || null,
      // (In the DB, the base schema has a required `photo: str` field; 
      //  however, since you now store multiple files via /files/cleaning/{id}, 
      //  you can simply supply an empty string or a default. We'll leave it empty.)
      photo: ''
    };

    try {
      let newOrder;
      if (editingId) {
        // UPDATED ORDER
        const { data: updated } = await axios.put(
          `${API_URL}/cleaning/orders/${editingId}/`,
          payload
        );
        newOrder = updated;
        setOrders(prev => prev.map(o => (o.id === editingId ? updated : o)));
      } else {
        // NEW ORDER
        const { data: created } = await axios.post(
          `${API_URL}/cleaning/orders/`,
          payload
        );
        newOrder = created;
        setOrders(prev => [...prev, created]);
        setEditingId(created.id);
      }

      // 2) Now upload any **new** photo files (those that have `file` and `preview`)
      const orderId = newOrder.id;
      const toUpload = formOrder.photos.filter(p => p.file);
      for (let photoItem of toUpload) {
        const formData = new FormData();
        formData.append('file', photoItem.file);
        // If you want to pass a “purpose” string, uncomment below:
        // formData.append('purpose', 'cleaning'); 
        await axios.post(
          `${API_URL}/files/cleaning/${orderId}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      }

      // 3) Re‐fetch the “existing photos” for this order so that we can display them freshly
      try {
        const { data: freshFiles } = await axios.get(`${API_URL}/files/cleaning/${orderId}`);
        const existingPhotos = freshFiles.map(f => ({
          id: f.id,
          file_path: f.file_path,
          filename: f.filename
        }));
        setFormOrder(prev => ({ ...prev, photos: existingPhotos }));
      } catch (err) {
        console.error('Failed to re‐fetch uploaded photos:', err);
      }

      // 4) Finally, we can either keep the form visible (to allow uploading more, editing, etc.)
      //    or immediately switch back to “list” (depending on your UX). Here, we go back to list.
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
      <p><strong>Name:</strong> ${order.name}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Email:</strong> ${order.email || '–'}</p>
      <p><strong>Telegram:</strong> ${order.telegram_username || '–'}</p>
      <hr/>
      <p><strong>Address:</strong> ${order.address}</p>
      <p><strong>Room:</strong> ${order.room_type} (${order.area} m²)</p>
      <p><strong>Type:</strong> ${order.cleaning_type}</p>
      <p><strong>Duration:</strong> ${order.duration}</p>
      <p><strong>Cost:</strong> ${order.cost}</p>
      <p><strong>Date:</strong> ${order.execution_date}</p>
      <p><strong>Additional Services:</strong> ${order.additional_services || '–'}</p>
      <p><strong>Features:</strong> ${order.features || '–'}</p>
      <p><strong>Comment:</strong> ${order.comment || '–'}</p>
    `;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { useCORS: true, scale: 2 });
      const link = document.createElement('a');
      link.download = `cleaning-${order.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed.');
    } finally {
      document.body.removeChild(container);
    }
  };

  // ─── CALENDAR VIEW ──────────────────────────────────────────────────────────
  if (view === 'calendar' && selectedOrder) {
    return (
      <RentalCalendar
        propertyId={selectedOrder.id}
        category="Клінінг"
        onBack={() => setView('list')}
      />
    );
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="container" ref={exportRef}>
      <h2>Cleaning Orders Control</h2>

      {/* ─── TOOLBAR ───────────────────────────────────────────────────────────── */}
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <button
          onClick={() => {
            cancelForm();
            setView('form');
          }}
        >
          + New Order
        </button>
        <button
          onClick={() => {
            if (!exportRef.current) return;
            html2canvas(exportRef.current).then((canvas) => {
              const link = document.createElement('a');
              link.download = `cleaning-orders.png`;
              link.href = canvas.toDataURL();
              link.click();
            });
          }}
        >
          Export View
        </button>
      </div>

      {/* ─── FILTERS SECTION ────────────────────────────────────────────────────── */}
      <section className="filters card" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search comments, features, services"
          value={searchText}
          onChange={handleFilterChange(setSearchText)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <input
          type="text"
          placeholder="Filter by Address"
          value={addressFilter}
          onChange={handleFilterChange(setAddressFilter)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <input
          type="text"
          placeholder="Filter by Room Type"
          value={roomTypeFilter}
          onChange={handleFilterChange(setRoomTypeFilter)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <input
          type="text"
          placeholder="Filter by Cleaning Type"
          value={cleaningTypeFilter}
          onChange={handleFilterChange(setCleaningTypeFilter)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Min Cost"
          value={costMin}
          onChange={handleFilterChange(setCostMin)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Max Cost"
          value={costMax}
          onChange={handleFilterChange(setCostMax)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <label style={{ marginRight: 4 }}>Date From:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={handleFilterChange(setDateFrom)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <label style={{ marginRight: 4 }}>Date To:</label>
        <input
          type="date"
          value={dateTo}
          onChange={handleFilterChange(setDateTo)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
      </section>

      {/* ─── ROW‐BASED LIST VIEW ────────────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          {loading ? (
            <p>Loading cleaning orders...</p>
          ) : error ? (
            <p className="error" style={{ color: 'red' }}>{error}</p>
          ) : (
            <section className="orders-list">
              {/* Header Row */}
              <div
                className="order-row header"
                style={{
                  display: 'flex',
                  padding: '12px 16px',
                  background: '#f7f7f7',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  marginBottom: 8
                }}
              >
                <div style={{ flex: 0.5 }}>ID</div>
                <div style={{ flex: 1 }}>Name</div>
                <div style={{ flex: 1 }}>Phone</div>
                <div style={{ flex: 1 }}>Email</div>
                <div style={{ flex: 0.8 }}>Telegram</div>
                <div style={{ flex: 1 }}>Address</div>
                <div style={{ flex: 1 }}>Room Type</div>
                <div style={{ flex: 0.8 }}>Area</div>
                <div style={{ flex: 1 }}>Type</div>
                <div style={{ flex: 0.8 }}>Duration</div>
                <div style={{ flex: 0.8 }}>Cost</div>
                <div style={{ flex: 1 }}>Date</div>
                <div style={{ flex: 1 }}>Actions</div>
              </div>

              {paginated.length > 0 ? (
                paginated.map((order) => (
                  <div
                    key={order.id}
                    className="order-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      marginBottom: 8
                    }}
                  >
                    <div style={{ flex: 0.5 }}>{order.id}</div>
                    <div style={{ flex: 1 }}>{order.name}</div>
                    <div style={{ flex: 1 }}>{order.phone}</div>
                    <div style={{ flex: 1 }}>{order.email || '–'}</div>
                    <div style={{ flex: 0.8 }}>{order.telegram_username || '–'}</div>
                    <div style={{ flex: 1 }}>{order.address}</div>
                    <div style={{ flex: 1 }}>{order.room_type}</div>
                    <div style={{ flex: 0.8 }}>{order.area} m²</div>
                    <div style={{ flex: 1 }}>{order.cleaning_type}</div>
                    <div style={{ flex: 0.8 }}>{order.duration}</div>
                    <div style={{ flex: 0.8 }}>{order.cost}</div>
                    <div style={{ flex: 1 }}>{order.execution_date}</div>
                    <div style={{ flex: 1 }}>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setView('calendar');
                        }}
                        style={{ marginRight: 8 }}
                      >
                        📅
                      </button>
                      <button
                        onClick={() => startEditing(order)}
                        style={{ marginRight: 8 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        style={{ marginRight: 8 }}
                      >
                        Delete
                      </button>
                      <button onClick={() => exportOrder(order)}>Export</button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No cleaning orders found.</p>
              )}

              {/* Pagination */}
              {pageCount > 1 && (
                <div className="pagination" style={{ marginTop: 16 }}>
                  <button
                    onClick={() => setCurrentPage((cp) => Math.max(cp - 1, 1))}
                    disabled={currentPage === 1}
                    style={{ marginRight: 4 }}
                  >
                    ‹ Prev
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => (
                    <button
                      key={i + 1}
                      className={currentPage === i + 1 ? 'active' : ''}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{ margin: '0 4px' }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((cp) => Math.min(cp + 1, pageCount))
                    }
                    disabled={currentPage === pageCount}
                    style={{ marginLeft: 4 }}
                  >
                    Next ›
                  </button>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* ─── FORM VIEW ─────────────────────────────────────────────────────────── */}
      {view === 'form' && (
        <section
          className="order-form card"
          style={{
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: 16,
            marginTop: 16
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {editingId ? 'Edit Cleaning Order' : 'Add Cleaning Order'}
          </h3>
          <form onSubmit={saveOrder}>
            {/* ─── NAME & PHONE ───────────────────────────────────────────────── */}
            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Name</label>
              <input
                name="name"
                value={formOrder.name}
                onChange={handleFormChange}
                required
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Phone</label>
              <input
                name="phone"
                value={formOrder.phone}
                onChange={handleFormChange}
                required
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            {/* ─── EMAIL & TELEGRAM ──────────────────────────────────────────────── */}
            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Email</label>
              <input
                name="email"
                type="email"
                value={formOrder.email}
                onChange={handleFormChange}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Telegram</label>
              <input
                name="telegram_username"
                value={formOrder.telegram_username}
                onChange={handleFormChange}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            {/* ─── CLEANING‐SPECIFIC FIELDS ──────────────────────────────────────── */}
            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Address</label>
              <input
                name="address"
                value={formOrder.address}
                onChange={handleFormChange}
                required
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Room Type</label>
              <input
                name="room_type"
                value={formOrder.room_type}
                onChange={handleFormChange}
                required
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Area (m²)</label>
              <input
                name="area"
                type="number"
                value={formOrder.area}
                onChange={handleFormChange}
                required
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Cleaning Type</label>
              <input
                name="cleaning_type"
                value={formOrder.cleaning_type}
                onChange={handleFormChange}
                required
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Duration</label>
              <input
                name="duration"
                value={formOrder.duration}
                onChange={handleFormChange}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Cost</label>
              <input
                name="cost"
                type="number"
                value={formOrder.cost}
                onChange={handleFormChange}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Execution Date</label>
              <input
                name="execution_date"
                type="date"
                value={formOrder.execution_date}
                onChange={handleFormChange}
                required
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start' }}
            >
              <label style={{ width: 120, marginTop: 8 }}>
                Additional Services
              </label>
              <textarea
                name="additional_services"
                value={formOrder.additional_services}
                onChange={handleFormChange}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  minHeight: 60
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start' }}
            >
              <label style={{ width: 120, marginTop: 8 }}>Features</label>
              <textarea
                name="features"
                value={formOrder.features}
                onChange={handleFormChange}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  minHeight: 60
                }}
              />
            </div>

            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start' }}
            >
              <label style={{ width: 120, marginTop: 8 }}>Comment</label>
              <textarea
                name="comment"
                value={formOrder.comment}
                onChange={handleFormChange}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  minHeight: 60
                }}
              />
            </div>

            {/* ─── PHOTO UPLOAD ────────────────────────────────────────────────────── */}
            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Photos</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{
                  flex: 1,
                  padding: 4
                }}
              />
            </div>

            {/* ─── PHOTO PREVIEWS ───────────────────────────────────────────────────── */}
            {formOrder.photos && formOrder.photos.length > 0 && (
              <div
                className="photos-preview"
                style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: 16
                }}
              >
                {formOrder.photos.map((photoItem) => {
                  const src = photoItem.file_path
                    ? `${photoItem.file_path}` // existing file from server
                    : photoItem.preview;       // newly selected local file
                  return (
                    <div
                      key={photoItem.id}
                      style={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    >
                      <img
                        src={`${API_URL}${src}`}
                        alt="photo"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photoItem)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          background: 'rgba(0,0,0,0.6)',
                          border: 'none',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          color: 'white',
                          fontSize: 12,
                          lineHeight: '20px',
                          cursor: 'pointer'
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button type="submit" className="advanced">
                {editingId ? 'Save Changes' : 'Create Order'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="advanced"
                style={{ marginLeft: 8 }}
              >
                Cancel
              </button>
            </div>

            {error && (
              <p className="error" style={{ color: 'red', marginTop: 12 }}>
                {error}
              </p>
            )}
          </form>
        </section>
      )}
    </div>
  );
}

export default CleaningControl;
