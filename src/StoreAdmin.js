// src/StoreAdmin.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import html2canvas from 'html2canvas';
import RentalCalendar from './RentalCalendar';

const API_URL = 'http://localhost:8000'; // Adjust API base URL as needed

function StoreAdmin() {
  // --- VIEW STATE ---
  const [view, setView] = useState('list');            // 'list' | 'form' | 'calendar'
  const [calendarInfo, setCalendarInfo] = useState(null);

  // --- DATA STATE ---
  const [apartments, setApartments] = useState([]);    // All apartments
  const [filtered, setFiltered] = useState([]);        // Filtered subset
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // --- LOADING & ERROR ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- FILTERS ---
  const [filterText, setFilterText]             = useState('');
  const [filterDealType, setFilterDealType]     = useState('');
  const [filterObjectType, setFilterObjectType] = useState('');
  const [filterLocation, setFilterLocation]     = useState('');
  const [priceMin, setPriceMin]                 = useState('');
  const [priceMax, setPriceMax]                 = useState('');
  const [dateFrom, setDateFrom]                 = useState('');
  const [dateTo, setDateTo]                     = useState('');

  // --- FORM STATE ---
  const emptyApartment = {
    unique_id: '',
    type_deal: '',
    type_object: '',
    title: '',
    price: '',
    location: '',
    description: '',
    features: '',
    owner: '',
    phone: '',
    images: [],           // list of { id, url }
    created_date: '',     // ISO string
  };
  const [formApartment, setFormApartment] = useState(emptyApartment);

  // --- REF for export ---
  const exportRef = useRef(null);

  // --- EFFECT: fetch initial data ---
  useEffect(() => {
    fetchApartments();
  }, []);

  // --- Fetch apartments ---
  const fetchApartments = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_URL}/store/apartments/`);
      setApartments(resp.data);
      setError('');
      setCurrentPage(1);
      setView('list');
    } catch (err) {
      console.error('Error fetching apartments:', err);
      setError('Could not load apartments.');
    } finally {
      setLoading(false);
    }
  };

  // --- Apply filters & pagination ---
  const applyFilters = useCallback(() => {
    let arr = [...apartments];

    // text search on title and description
    if (filterText.trim()) {
      const q = filterText.trim().toLowerCase();
      arr = arr.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    }
    // deal type
    if (filterDealType) {
      arr = arr.filter(a => a.type_deal === filterDealType);
    }
    // object type
    if (filterObjectType) {
      arr = arr.filter(a => a.type_object === filterObjectType);
    }
    // location
    if (filterLocation.trim()) {
      const q = filterLocation.trim().toLowerCase();
      arr = arr.filter(a => a.location.toLowerCase().includes(q));
    }
    // price range
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!isNaN(min)) arr = arr.filter(a => parseFloat(a.price) >= min);
    if (!isNaN(max)) arr = arr.filter(a => parseFloat(a.price) <= max);

    // date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      arr = arr.filter(a => new Date(a.created_date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      arr = arr.filter(a => new Date(a.created_date) <= to);
    }

    setFiltered(arr);
    setCurrentPage(1);
  }, [apartments, filterText, filterDealType, filterObjectType, filterLocation, priceMin, priceMax, dateFrom, dateTo]);

  // Re-apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // --- Pagination helpers ---
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (num) => {
    if (num < 1 || num > pageCount) return;
    setCurrentPage(num);
  };

  // --- Form handlers ---
  const startAdd = () => {
    setFormApartment({ ...emptyApartment, created_date: new Date().toISOString() });
    setView('form');
  };

  const startEdit = (apt) => {
    setFormApartment({ ...apt });
    setView('form');
  };

  const cancelForm = () => {
    setFormApartment(emptyApartment);
    setView('list');
  };

  const saveApartment = async (e) => {
    e.preventDefault();
    try {
      if (formApartment.id) {
        // UPDATE
        const resp = await axios.put(
          `${API_URL}/store/apartments/${formApartment.id}/`,
          formApartment
        );
        setApartments(prev =>
          prev.map(a => (a.id === resp.data.id ? resp.data : a))
        );
      } else {
        // CREATE
        const resp = await axios.post(
          `${API_URL}/store/apartments/`,
          formApartment
        );
        setApartments(prev => [...prev, resp.data]);
      }
      cancelForm();
      setError('');
    } catch (err) {
      console.error('Error saving apartment:', err);
      setError('Could not save apartment.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this apartment?')) return;
    try {
      await axios.delete(`${API_URL}/store/apartments/${id}/`);
      setApartments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting apartment:', err);
      setError('Could not delete apartment.');
    }
  };

  // --- Calendar view handler ---
  const openCalendar = (apt) => {
    setCalendarInfo({ id: apt.id, category: 'Інтернет-магазин' });
    setView('calendar');
  };

  // --- Export to PNG ---
  const exportToImage = async () => {
    if (!exportRef.current) return;
    try {
      const canvas = await html2canvas(exportRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `apartments-${view}.png`;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed.');
    }
  };

  // --- Drag & Drop images in edit form ---
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const imgs = Array.from(formApartment.images || []);
    const [moved] = imgs.splice(result.source.index, 1);
    imgs.splice(result.destination.index, 0, moved);
    setFormApartment(prev => ({ ...prev, images: imgs }));
  };

  const handleUploadImages = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((f, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(f),
    }));
    setFormApartment(prev => ({
      ...prev,
      images: [...(prev.images||[]), ...previews],
    }));
  };

  const removeImage = (id) => {
    setFormApartment(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== id),
    }));
  };

  // --- RENDERING ---

  // Calendar view
  if (view === 'calendar' && calendarInfo) {
    return (
      <RentalCalendar
        propertyId={calendarInfo.id}
        category={calendarInfo.category}
        onBack={() => { setView('list'); setCalendarInfo(null); }}
      />
    );
  }

  // Form view
  if (view === 'form') {
    return (
      <div className="store-admin form-view">
        <h2>{formApartment.id ? 'Edit Apartment' : 'Add New Apartment'}</h2>
        <form onSubmit={saveApartment}>
          {/* Unique ID */}
          <div className="form-row">
            <label>Unique ID</label>
            <input
              name="unique_id"
              value={formApartment.unique_id}
              onChange={e => setFormApartment({ ...formApartment, unique_id: e.target.value })}
              required
            />
          </div>
          {/* Deal Type */}
          <div className="form-row">
            <label>Deal Type</label>
            <input
              name="type_deal"
              value={formApartment.type_deal}
              onChange={e => setFormApartment({ ...formApartment, type_deal: e.target.value })}
              required
            />
          </div>
          {/* Object Type */}
          <div className="form-row">
            <label>Object Type</label>
            <input
              name="type_object"
              value={formApartment.type_object}
              onChange={e => setFormApartment({ ...formApartment, type_object: e.target.value })}
              required
            />
          </div>
          {/* Title */}
          <div className="form-row">
            <label>Title</label>
            <input
              name="title"
              value={formApartment.title}
              onChange={e => setFormApartment({ ...formApartment, title: e.target.value })}
              required
            />
          </div>
          {/* Price */}
          <div className="form-row">
            <label>Price</label>
            <input
              name="price"
              type="number"
              value={formApartment.price}
              onChange={e => setFormApartment({ ...formApartment, price: e.target.value })}
              required
            />
          </div>
          {/* Location */}
          <div className="form-row">
            <label>Location</label>
            <input
              name="location"
              value={formApartment.location}
              onChange={e => setFormApartment({ ...formApartment, location: e.target.value })}
              required
            />
          </div>
          {/* Description */}
          <div className="form-row">
            <label>Description</label>
            <textarea
              name="description"
              value={formApartment.description}
              onChange={e => setFormApartment({ ...formApartment, description: e.target.value })}
            />
          </div>
          {/* Features */}
          <div className="form-row">
            <label>Features</label>
            <textarea
              name="features"
              value={formApartment.features}
              onChange={e => setFormApartment({ ...formApartment, features: e.target.value })}
            />
          </div>
          {/* Owner */}
          <div className="form-row">
            <label>Owner</label>
            <input
              name="owner"
              value={formApartment.owner}
              onChange={e => setFormApartment({ ...formApartment, owner: e.target.value })}
            />
          </div>
          {/* Phone */}
          <div className="form-row">
            <label>Phone</label>
            <input
              name="phone"
              value={formApartment.phone}
              onChange={e => setFormApartment({ ...formApartment, phone: e.target.value })}
            />
          </div>
          {/* Images Upload & DnD Gallery */}
          <div className="form-row">
            <label>Images</label>
            <input type="file" multiple accept="image/*" onChange={handleUploadImages} />
          </div>
          {formApartment.images && formApartment.images.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="images" direction="horizontal">
                {provided => (
                  <div className="image-gallery" ref={provided.innerRef} {...provided.droppableProps}>
                    {formApartment.images.map((img, idx) => (
                      <Draggable key={img.id} draggableId={img.id.toString()} index={idx}>
                        {(prov) => (
                          <div
                            className="image-item"
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                          >
                            <img src={img.url} alt="" />
                            <button type="button" onClick={() => removeImage(img.id)}>✕</button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // --- List view ---
  return (
    <div className="store-admin list-view" ref={exportRef}>
      <h2>Store Apartments Admin</h2>
      <div className="toolbar">
        <button onClick={startAdd}>+ Add Apartment</button>
        <button onClick={exportToImage}>Export View</button>
      </div>

      {/* FILTER PANEL */}
      <section className="filters card">
        <h2>Filter Apartments</h2>
        <input
          type="text"
          placeholder="Search title or description..."
          value={filterText}
          onChange={e => { setFilterText(e.target.value); applyFilters(); }}
          className="filter-input animated"
        />
        <input
          type="text"
          placeholder="Deal Type..."
          value={filterDealType}
          onChange={e => { setFilterDealType(e.target.value); applyFilters(); }}
          className="filter-input animated"
        />
        <input
          type="text"
          placeholder="Object Type..."
          value={filterObjectType}
          onChange={e => { setFilterObjectType(e.target.value); applyFilters(); }}
          className="filter-input animated"
        />
        <input
          type="text"
          placeholder="Location..."
          value={filterLocation}
          onChange={e => { setFilterLocation(e.target.value); applyFilters(); }}
          className="filter-input animated"
        />
        <input
          type="number"
          placeholder="Min Price"
          value={priceMin}
          onChange={e => { setPriceMin(e.target.value); applyFilters(); }}
          className="filter-input animated"
        />
        <input
          type="number"
          placeholder="Max Price"
          value={priceMax}
          onChange={e => { setPriceMax(e.target.value); applyFilters(); }}
          className="filter-input animated"
        />
        <label>Date From:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); applyFilters(); }}
          className="filter-input animated"
        />
        <label>Date To:</label>
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); applyFilters(); }}
          className="filter-input animated"
        />
      </section>

      {/* LIST TABLE (card layout) */}
      <section className="apartments-list card">
        <h2>Apartments</h2>

        {/* Header Row */}
        <div className="apartment-header header">
          <div className="col col-id">ID</div>
          <div className="col col-uid">UID</div>
          <div className="col col-deal">Deal</div>
          <div className="col col-object">Object</div>
          <div className="col col-title">Title</div>
          <div className="col col-price">Price</div>
          <div className="col col-location">Location</div>
          <div className="col col-created">Created</div>
          <div className="col col-actions">Actions</div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          paginated.length > 0 ? (
            paginated.map(apt => (
              <div key={apt.id} className="apartment-item">
                <div className="apartment-header">
                  <div className="col col-id">{apt.id}</div>
                  <div className="col col-uid">{apt.unique_id}</div>
                  <div className="col col-deal">{apt.type_deal}</div>
                  <div className="col col-object">{apt.type_object}</div>
                  <div className="col col-title">{apt.title}</div>
                  <div className="col col-price">{apt.price}</div>
                  <div className="col col-location">{apt.location}</div>
                  <div className="col col-created">{new Date(apt.created_date).toLocaleDateString()}</div>
                  <div className="col col-actions">
                    <button onClick={() => startEdit(apt)}>Edit</button>
                    <button onClick={() => handleDelete(apt.id)}>Delete</button>
                    <button onClick={() => openCalendar(apt)}>📅</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-apartments">No apartments found.</div>
          )
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="pagination">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              ‹ Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => goToPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount}>
              Next ›
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
export default StoreAdmin;