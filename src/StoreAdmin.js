// src/StoreAdmin.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import html2canvas from 'html2canvas';
import RentalCalendar from './RentalCalendar';

const API_URL = 'http://localhost:8000';
const FILE_MODULE = 'products';   // ← use "products" as the module for store apartments
const BACKEND = 'http://127.0.0.1:8000'
function StoreAdmin() {
  // ─── VIEW STATE ─────────────────────────────────────────────────────────────
  const [view, setView] = useState('list');            // 'list' | 'form' | 'calendar'
  const [calendarInfo, setCalendarInfo] = useState(null);

  // ─── DATA STATE ─────────────────────────────────────────────────────────────
  const [apartments, setApartments] = useState([]);    // all apartments
  const [filtered, setFiltered] = useState([]);        // filtered subset
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // ─── LOADING & ERROR ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── FILTERS ────────────────────────────────────────────────────────────────
  const [filterText, setFilterText]             = useState('');
  const [filterDealType, setFilterDealType]     = useState('');
  const [filterObjectType, setFilterObjectType] = useState('');
  const [filterLocation, setFilterLocation]     = useState('');
  const [priceMin, setPriceMin]                 = useState('');
  const [priceMax, setPriceMax]                 = useState('');
  const [dateFrom, setDateFrom]                 = useState('');
  const [dateTo, setDateTo]                     = useState('');

  // ─── FORM STATE ─────────────────────────────────────────────────────────────
  const emptyApartment = {
    unique_id:    '',
    type_deal:    '',
    type_object:  '',
    title:        '',
    price:        '',
    location:     '',
    description:  '',
    features:     '',
    owner:        '',
    phone:        '',
    // Each image object: { id, url, file?, isNew }
    // • if isNew===true → `file: File` (means not yet uploaded)
    // • if isNew===false → `id` is the numeric file‐ID on the server, `url` is its public URL
    images:       [],
    created_date: '',
  };
  const [formApartment, setFormApartment] = useState(emptyApartment);

  // ─── REF for “Export to PNG” ─────────────────────────────────────────────────
  const exportRef = useRef(null);

  // ─── FETCH APARTMENTS ON MOUNT ──────────────────────────────────────────────
  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    setLoading(true);
    try {
      // 1) Fetch all store apartments (your existing endpoint)
      const resp = await axios.get(`${API_URL}/store/apartments/`);
      // Assume your backend returns an array like:
      //   [{ id, unique_id, type_deal, type_object, title, price, location, description,
      //      features, owner, phone, created_at, /* …but probably NO “files” field here… */ }, …]
      //
      // We’ll keep all fields, but initialize `images: []` for now.
      const normalized = resp.data.map(a => ({
        ...a,
        images: [],
        created_date: a.created_at
      }));
      setApartments(normalized);
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

  // ─── FILTER & PAGINATION ────────────────────────────────────────────────────
  const applyFilters = useCallback(() => {
    let arr = [...apartments];
    if (filterText.trim()) {
      const q = filterText.trim().toLowerCase();
      arr = arr.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
      );
    }
    if (filterDealType) {
      arr = arr.filter(a => a.type_deal === filterDealType);
    }
    if (filterObjectType) {
      arr = arr.filter(a => a.type_object === filterObjectType);
    }
    if (filterLocation.trim()) {
      const q = filterLocation.trim().toLowerCase();
      arr = arr.filter(a => a.location.toLowerCase().includes(q));
    }
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!isNaN(min)) arr = arr.filter(a => parseFloat(a.price) >= min);
    if (!isNaN(max)) arr = arr.filter(a => parseFloat(a.price) <= max);

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
  }, [
    apartments,
    filterText,
    filterDealType,
    filterObjectType,
    filterLocation,
    priceMin,
    priceMax,
    dateFrom,
    dateTo
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const goToPage = (num) => {
    if (num < 1 || num > pageCount) return;
    setCurrentPage(num);
  };

  // ─── FORM HANDLERS ─────────────────────────────────────────────────────────
  const startAdd = () => {
    setFormApartment({ ...emptyApartment, created_date: new Date().toISOString() });
    setView('form');
  };

  const startEdit = async (apt) => {
    // 1) Copy the basic fields into form state
    setFormApartment({
      ...apt,
      images: [], // we will fetch them next
      created_date: apt.created_date
    });

    // 2) Fetch existing files from your `/files/products/{object_id}` endpoint
    try {
      const fileResp = await axios.get(`${API_URL}/files/${FILE_MODULE}/${apt.id}`);
      // fileResp.data is an array of FileAdminResponse:
      //   [{ id, filename, date, content_type, file_path, purpose, store_id, … }, …]
      const existingImages = fileResp.data.map(f => ({
        id:    f.id,
        url:   f.file_path,
        isNew: false,
        // We ignore `purpose` here (optional), but you could store it if you want
      }));
      setFormApartment(prev => ({
        ...prev,
        images: existingImages
      }));
    } catch (err) {
      console.error('Error fetching files for apartment:', err);
      // We’ll still allow editing the other fields even if file‐fetch fails
    }

    setView('form');
  };

  const cancelForm = () => {
    setFormApartment(emptyApartment);
    setView('list');
    setError('');
  };

  // ─── IMAGES: DRAG & DROP, UPLOAD PREVIEW, & REMOVE ───────────────────────────
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const imgs = Array.from(formApartment.images || []);
    const [moved] = imgs.splice(result.source.index, 1);
    imgs.splice(result.destination.index, 0, moved);
    setFormApartment(prev => ({ ...prev, images: imgs }));
  };

  const handleUploadImages = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((f, idx) => ({
      id:    `new-${Date.now()}-${idx}`,   // unique string for React key
      url:   URL.createObjectURL(f),      // local URL for preview
      file:  f,                           // the raw File object
      isNew: true,                        // indicates “not yet on server”
    }));
    setFormApartment(prev => ({
      ...prev,
      images: [ ...(prev.images || []), ...newPreviews ]
    }));
    e.target.value = null; // reset so same file can be re‐selected later
  };

  const removeImage = async (imgObj) => {
    // If it’s already on the server, call DELETE /files/{file_id}
    if (imgObj.isNew === false) {
      try {
        await axios.delete(`${API_URL}/files/${imgObj.id}`);
      } catch (errDel) {
        console.error('Error deleting file on server:', errDel);
        setError('Could not delete image from server.');
        return;
      }
    }
    // Remove from local state in both cases (new or existing)
    setFormApartment(prev => ({
      ...prev,
      images: prev.images.filter(x => x.id !== imgObj.id)
    }));
  };

  // ─── SAVE APARTMENT (CREATE or UPDATE) ──────────────────────────────────────
  const saveApartment = async (e) => {
    e.preventDefault();
    setError('');
    let aptId = formApartment.id || null;

    try {
      // 1) CREATE or UPDATE the apartment itself (no files yet)
      if (aptId) {
        // UPDATE existing apartment
        const resp = await axios.put(
          `${API_URL}/store/apartments/${aptId}/`,
          {
            unique_id:   formApartment.unique_id,
            type_deal:   formApartment.type_deal,
            type_object: formApartment.type_object,
            title:       formApartment.title,
            price:       formApartment.price,
            location:    formApartment.location,
            description: formApartment.description,
            features:    formApartment.features,
            owner:       formApartment.owner,
            phone:       formApartment.phone,
            // …any other fields your backend expects
          }
        );
        aptId = resp.data.id;
        // Update local “apartments” array so list view shows updated text fields
        setApartments(prev =>
          prev.map(a =>
            a.id === resp.data.id
              ? { 
                  ...a,
                  unique_id:   resp.data.unique_id,
                  type_deal:   resp.data.type_deal,
                  type_object: resp.data.type_object,
                  title:       resp.data.title,
                  price:       resp.data.price,
                  location:    resp.data.location,
                  description: resp.data.description,
                  features:    resp.data.features,
                  owner:       resp.data.owner,
                  phone:       resp.data.phone,
                }
              : a
          )
        );
      } else {
        // CREATE new apartment
        const resp = await axios.post(
          `${API_URL}/store/apartments/`,
          {
            unique_id:   formApartment.unique_id,
            type_deal:   formApartment.type_deal,
            type_object: formApartment.type_object,
            title:       formApartment.title,
            price:       formApartment.price,
            location:    formApartment.location,
            description: formApartment.description,
            features:    formApartment.features,
            owner:       formApartment.owner,
            phone:       formApartment.phone,
          }
        );
        aptId = resp.data.id;
        // Insert into local state with empty images (we’ll upload next)
        setApartments(prev => [
          ...prev,
          {
            ...resp.data,
            images:       [],
            created_date: resp.data.created_at,
          }
        ]);
      }

      // 2) UPLOAD each “new” image to `POST /files/products/{aptId}`
      //    (your backend accepts exactly one UploadFile per request)
      const newImgs = formApartment.images.filter(img => img.isNew === true);
      if (newImgs.length) {
        for (const imgObj of newImgs) {
          const data = new FormData();
          // `purpose` is optional; we’ll omit it here
          data.append('file', imgObj.file);
          try {
            const uploadResp = await axios.post(
              `${API_URL}/files/${FILE_MODULE}/${aptId}`,
              data,
              { headers: { 'Content-Type': 'multipart/form-data' }}
            );
            // uploadResp.data is one FileAdminResponse:
            //   { id, filename, date, content_type, file_path, purpose, store_id, … }
            const savedFile = {
              id:    uploadResp.data.id,
              url:   uploadResp.data.file_path,
              isNew: false
            };
            // Replace the placeholder “new-…” entry in formApartment.images with this savedFile
            setFormApartment(prev => ({
              ...prev,
              images: prev.images.map(x =>
                x.id === imgObj.id
                  ? savedFile
                  : x
              )
            }));
            // Also update our top‐level `apartments` array if desired
            setApartments(prev =>
              prev.map(a =>
                a.id === aptId
                  ? {
                      ...a,
                      images: [ ...(a.images || []).filter(i=>!i.isNew), savedFile ]
                    }
                  : a
              )
            );
          } catch (uploadErr) {
            console.error('Error uploading one image:', uploadErr);
            setError('One or more images failed to upload.');
          }
        }
      }

      // 3) (Optional) Reordering:  
      //    Your current backend does NOT expose an “update order” endpoint.  
      //    If you add something like `PATCH /files/{file_id}` that accepts { order: <int> },
      //    then you could loop here over all images (after upload) and send their `order`
      //    field. For now, we simply skip it because it’s not implemented server-side.

      // 4) Done! Reset form and go back to list:
      cancelForm();
    } catch (err) {
      console.error('Error saving apartment:', err);
      setError('Could not save apartment.');
    }
  };

  // ─── DELETE ENTIRE APARTMENT ────────────────────────────────────────────────
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

  // ─── CALENDAR VIEW ──────────────────────────────────────────────────────────
  const openCalendar = (apt) => {
    setCalendarInfo({ id: apt.id, category: 'Інтернет-магазин' });
    setView('calendar');
  };

  // ─── EXPORT TO PNG ──────────────────────────────────────────────────────────
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

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  if (view === 'calendar' && calendarInfo) {
    return (
      <RentalCalendar
        propertyId={calendarInfo.id}
        category={calendarInfo.category}
        onBack={() => {
          setView('list');
          setCalendarInfo(null);
        }}
      />
    );
  }

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

          {/* File Input for “New” Images */}
          <div className="form-row">
            <label>Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUploadImages}
            />
          </div>

          {/* Drag-and-Drop Gallery */}
          {formApartment.images && formApartment.images.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided) => (
                  <div
                    className="image-gallery"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ display: 'flex', overflowX: 'auto', marginTop: 8 }}
                  >
                    {formApartment.images.map((img, idx) => (
                      <Draggable key={img.id} draggableId={img.id.toString()} index={idx}>
                        {(prov) => (
                          <div
                            className="image-item"
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            style={{
                              position: 'relative',
                              marginRight: 8,
                              ...prov.draggableProps.style
                            }}
                          >
                            <img
                              src={`${BACKEND}${img.url}`}
                              alt=""
                              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(img)}
                              style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                lineHeight: '18px',
                                cursor: 'pointer'
                              }}
                            >
                              ×
                            </button>
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
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="submit">Save</button>
            <button type="button" onClick={cancelForm} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── LIST VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="store-admin list-view" ref={exportRef}>
      <h2>Store Apartments Admin</h2>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <button onClick={startAdd}>+ Add Apartment</button>
        <button onClick={exportToImage} style={{ marginLeft: 8 }}>
          Export View
        </button>
      </div>

      {/* FILTER PANEL */}
      <section className="filters card" style={{ marginBottom: 16 }}>
        <h2>Filter Apartments</h2>
        <input
          type="text"
          placeholder="Search title or description..."
          value={filterText}
          onChange={e => {
            setFilterText(e.target.value);
            applyFilters();
          }}
          className="filter-input animated"
        />
        <input
          type="text"
          placeholder="Deal Type..."
          value={filterDealType}
          onChange={e => {
            setFilterDealType(e.target.value);
            applyFilters();
          }}
          className="filter-input animated"
          style={{ marginLeft: 8 }}
        />
        <input
          type="text"
          placeholder="Object Type..."
          value={filterObjectType}
          onChange={e => {
            setFilterObjectType(e.target.value);
            applyFilters();
          }}
          className="filter-input animated"
          style={{ marginLeft: 8 }}
        />
        <input
          type="text"
          placeholder="Location..."
          value={filterLocation}
          onChange={e => {
            setFilterLocation(e.target.value);
            applyFilters();
          }}
          className="filter-input animated"
          style={{ marginLeft: 8 }}
        />
        <input
          type="number"
          placeholder="Min Price"
          value={priceMin}
          onChange={e => {
            setPriceMin(e.target.value);
            applyFilters();
          }}
          className="filter-input animated"
          style={{ marginLeft: 8 }}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={priceMax}
          onChange={e => {
            setPriceMax(e.target.value);
            applyFilters();
          }}
          className="filter-input animated"
          style={{ marginLeft: 8 }}
        />
        <label style={{ marginLeft: 8 }}>Date From:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={e => {
            setDateFrom(e.target.value);
            applyFilters();
          }}
          className="filter-input animated"
          style={{ marginLeft: 4 }}
        />
        <label style={{ marginLeft: 8 }}>Date To:</label>
        <input
          type="date"
          value={dateTo}
          onChange={e => {
            setDateTo(e.target.value);
            applyFilters();
          }}
          className="filter-input animated"
          style={{ marginLeft: 4 }}
        />
      </section>

      {/* APARTMENTS LIST */}
      <section className="apartments-list card">
        <h2>Apartments</h2>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="error" style={{ color: 'red' }}>{error}</div>
        ) : paginated.length > 0 ? (
          paginated.map(apt => (
            <div key={apt.id} className="apartment-item" style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
              <div className="apartment-header" style={{ display: 'flex', alignItems: 'center' }}>
                <div className="col col-id" style={{ width: 30 }}>{apt.id}</div>
                <div className="col col-uid" style={{ width: 100 }}>{apt.unique_id}</div>
                <div className="col col-deal" style={{ width: 80 }}>{apt.type_deal}</div>
                <div className="col col-object" style={{ width: 80 }}>{apt.type_object}</div>
                <div className="col col-title" style={{ flex: 1 }}>{apt.title}</div>
                <div className="col col-price" style={{ width: 80 }}>{apt.price}</div>
                <div className="col col-location" style={{ width: 120 }}>{apt.location}</div>
                <div className="col col-created" style={{ width: 100 }}>
                  {new Date(apt.created_date).toLocaleDateString()}
                </div>
                <div className="col col-actions" style={{ width: 180 }}>
                  <button onClick={() => startEdit(apt)}>Edit</button>
                  <button onClick={() => handleDelete(apt.id)} style={{ marginLeft: 8 }}>Delete</button>
                  <button onClick={() => openCalendar(apt)} style={{ marginLeft: 8 }}>📅</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-apartments">No apartments found.</div>
        )}

        {/* PAGINATION */}
        {pageCount > 1 && (
          <div className="pagination" style={{ marginTop: 16 }}>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              ‹ Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => goToPage(i + 1)}
                style={{ marginLeft: 4 }}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount} style={{ marginLeft: 4 }}>
              Next ›
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default StoreAdmin;
