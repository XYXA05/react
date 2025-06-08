// src/RenovationProjectsControl.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import RentalCalendar from './RentalCalendar';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import html2canvas from 'html2canvas';
import './control.css';

const API_URL = 'https://79cf-217-31-72-114.ngrok-free.app'; // adjust if necessary
const PAGE_SIZE = 10;

const RenovationProjectsControl = () => {
  // ─── VIEW & ROLE STATE ─────────────────────────────────────────────────────
  const [view, setView] = useState('list');             // 'list' | 'form' | 'calendar'
  const [selectedProject, setSelectedProject] = useState(null);

  // ─── DATA STATE ─────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([]);         // all fetched projects
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── FILTER STATE ───────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [durationMax, setDurationMax] = useState('');
  const [costMin, setCostMin] = useState('');
  const [costMax, setCostMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ─── PAGINATION STATE ───────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ─── FORM STATE ─────────────────────────────────────────────────────────────
  // Include name/phone/email/telegram_username + renovation fields + photos[]
  const initialForm = {
    name: '',
    phone: '',
    email: '',
    telegram_username: '',
    address: '',
    work_type: '',
    materials: '',
    duration: '',
    cost: '',
    execution_stages: '',
    comment: '',
    start_date: '',
    end_date: '',
    photos: [] // array of { id, file_path, filename } from server or { id:'new-...', file, preview } locally
  };
  const [formProject, setFormProject] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  // ─── REF FOR EXPORT (html2canvas) ───────────────────────────────────────────
  const exportRef = useRef(null);

  // ─── FETCH ALL RENOVATION PROJECTS ─────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/renovation/projects/`);
      // Ensure any returned `photos` field (if present) is always an array:
      const normalized = data.map((p) => ({
        ...p,
        photos: Array.isArray(p.photos) ? p.photos : []
      }));
      setProjects(normalized);
      setError('');
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ─── APPLY FILTERS ──────────────────────────────────────────────────────────
  const applyFilters = useCallback(() => {
    let result = [...projects];

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.comment || '').toLowerCase().includes(q) ||
          (p.execution_stages || '').toLowerCase().includes(q)
      );
    }
    if (addressFilter.trim()) {
      const q = addressFilter.trim().toLowerCase();
      result = result.filter((p) =>
        p.address.toLowerCase().includes(q)
      );
    }
    if (workTypeFilter.trim()) {
      result = result.filter((p) => p.work_type === workTypeFilter.trim());
    }
    if (durationMin) {
      result = result.filter(
        (p) => parseFloat(p.duration) >= parseFloat(durationMin)
      );
    }
    if (durationMax) {
      result = result.filter(
        (p) => parseFloat(p.duration) <= parseFloat(durationMax)
      );
    }
    if (costMin) {
      result = result.filter(
        (p) => parseFloat(p.cost) >= parseFloat(costMin)
      );
    }
    if (costMax) {
      result = result.filter(
        (p) => parseFloat(p.cost) <= parseFloat(costMax)
      );
    }
    if (dateFrom) {
      result = result.filter((p) => p.start_date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((p) => p.end_date <= dateTo);
    }

    setFilteredProjects(result);
    setCurrentPage(1);
  }, [
    projects,
    searchText,
    addressFilter,
    workTypeFilter,
    durationMin,
    durationMax,
    costMin,
    costMax,
    dateFrom,
    dateTo
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ─── HANDLERS FOR FILTER INPUTS ────────────────────────────────────────────
  const handleFilterChange = (setter) => (e) => setter(e.target.value);

  // ─── HANDLERS FOR FORM INPUTS ──────────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormProject((prev) => ({ ...prev, [name]: value }));
  };

  // ─── HANDLE PHOTO UPLOAD (NEW FILES) ───────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files).map((file, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      file,
      preview: URL.createObjectURL(file)
    }));
    setFormProject((prev) => ({
      ...prev,
      photos: [...(Array.isArray(prev.photos) ? prev.photos : []), ...files]
    }));
  };

  // ─── START EDITING AN EXISTING PROJECT ─────────────────────────────────────
  const startEditing = async (proj) => {
    // 1) Populate all scalar fields into form state:
    setFormProject({
      name: proj.name || '',
      phone: proj.phone || '',
      email: proj.email || '',
      telegram_username: proj.telegram_username || '',
      address: proj.address || '',
      work_type: proj.work_type || '',
      materials: proj.materials || '',
      duration: proj.duration || '',
      cost: proj.cost || '',
      execution_stages: proj.execution_stages || '',
      comment: proj.comment || '',
      start_date: proj.start_date || '',
      end_date: proj.end_date || '',
      photos: [] // we'll overwrite next
    });
    setEditingId(proj.id);
    setView('form');

    // 2) Fetch existing photos from /files/renovation/{proj.id}
    try {
      const { data: filesList } = await axios.get(
        `${API_URL}/files/renovation/${proj.id}`
      );
      // filesList: Array<FileAdminResponse> => { id, filename, date, content_type, file_path, ... }
      const existingPhotos = filesList.map((f) => ({
        id: f.id,
        file_path: f.file_path,
        filename: f.filename
      }));
      setFormProject((prev) => ({ ...prev, photos: existingPhotos }));
    } catch (err) {
      console.error('Could not fetch existing photos:', err);
      // We still let the user edit the rest even if photo-fetch fails
    }
  };

  const cancelForm = () => {
    // Revoke any local objectURLs before clearing:
    formProject.photos.forEach((p) => {
      if (p.preview) URL.revokeObjectURL(p.preview);
    });
    setFormProject(initialForm);
    setEditingId(null);
    setView('list');
  };

  // ─── DELETE A SINGLE PHOTO (EXISTING OR NEW) ──────────────────────────────
  const handleDeletePhoto = async (photoItem) => {
    if (photoItem.id && typeof photoItem.id === 'number') {
      // This is an existing photo on the server => call DELETE /files/{id}
      try {
        await axios.delete(`${API_URL}/files/${photoItem.id}`);
      } catch (err) {
        console.error('Failed to delete photo on server:', err);
      }
    }
    // If it has a `preview`, revoke that objectURL:
    if (photoItem.preview) {
      URL.revokeObjectURL(photoItem.preview);
    }
    // Remove from state in either case:
    setFormProject((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== photoItem.id)
    }));
  };

  // ─── SAVE (CREATE OR UPDATE) ────────────────────────────────────────────────
  const saveProject = async (e) => {
    e.preventDefault();

    // 1) Build payload exactly matching your Pydantic schema:
    const payload = {
      name: formProject.name,
      phone: formProject.phone,
      email: formProject.email || null,
      telegram_username: formProject.telegram_username || null,
      address: formProject.address,
      work_type: formProject.work_type,
      // The schema expects materials/duration/cost field names (even if “photo” in base gets ignored by backend):
      materials: formProject.materials,
      duration: formProject.duration,
      cost: formProject.cost,
      execution_stages: formProject.execution_stages || null,
      comment: formProject.comment || null,
      start_date: formProject.start_date,
      end_date: formProject.end_date
      // Note: We do NOT send “photos” here. File storage is handled separately via /files/renovation/{id}.
    };

    try {
      let newProj;
      if (editingId) {
        // UPDATE EXISTING
        const { data: updated } = await axios.put(
          `${API_URL}/renovation/projects/${editingId}/`,
          payload
        );
        newProj = updated;
        setProjects((prev) =>
          prev.map((p) => (p.id === editingId ? updated : p))
        );
      } else {
        // CREATE NEW
        const { data: created } = await axios.post(
          `${API_URL}/renovation/projects/`,
          payload
        );
        newProj = created;
        setProjects((prev) => [...prev, created]);
        setEditingId(created.id);
      }

      // 2) Upload ANY new files in formProject.photos (items having `file` property)
      const projectId = newProj.id;
      const toUpload = formProject.photos.filter((p) => p.file);
      for (let photoItem of toUpload) {
        const formData = new FormData();
        formData.append('file', photoItem.file);
        // If you want to send a “purpose” field, you can:
        // formData.append('purpose', 'renovation')
        await axios.post(
          `${API_URL}/files/renovation/${projectId}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }

      // 3) Re‐fetch existing photos from server so state is fresh
      try {
        const { data: freshFiles } = await axios.get(
          `${API_URL}/files/renovation/${projectId}`
        );
        const existingPhotos = freshFiles.map((f) => ({
          id: f.id,
          file_path: f.file_path,
          filename: f.filename
        }));
        setFormProject((prev) => ({ ...prev, photos: existingPhotos }));
      } catch (err) {
        console.error('Failed to re‐fetch uploaded photos:', err);
      }

      // 4) Finally, exit form (you could keep form open if you want further edits)
      cancelForm();
      setError('');
    } catch (err) {
      console.error('Error saving project:', err.response || err);
      setError('Error saving project.');
    }
  };

  // ─── DELETE A PROJECT ───────────────────────────────────────────────────────
  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API_URL}/renovation/projects/${id}/`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setError('');
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete.');
    }
  };

  // ─── EXPORT A SINGLE PROJECT AS AN IMAGE ───────────────────────────────────
  const exportPoster = async (proj) => {
    const container = document.createElement('div');
    Object.assign(container.style, {
      padding: '20px',
      background: '#fff',
      color: '#000',
      fontFamily: 'Arial'
    });
    container.innerHTML = `
      <h1>Renovation: ${proj.work_type}</h1>
      <p><strong>Name:</strong> ${proj.name}</p>
      <p><strong>Phone:</strong> ${proj.phone}</p>
      <p><strong>Email:</strong> ${proj.email || '–'}</p>
      <p><strong>Telegram:</strong> ${proj.telegram_username || '–'}</p>
      <hr/>
      <p><strong>Address:</strong> ${proj.address}</p>
      <p><strong>Materials:</strong> ${proj.materials}</p>
      <p><strong>Duration:</strong> ${proj.duration}</p>
      <p><strong>Cost:</strong> ${proj.cost}</p>
      <p><strong>Dates:</strong> ${proj.start_date} – ${proj.end_date}</p>
      <p><strong>Stages:</strong> ${proj.execution_stages || '–'}</p>
      <p><strong>Comment:</strong> ${proj.comment || '–'}</p>
    `;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { useCORS: true, scale: 2 });
      const link = document.createElement('a');
      link.download = `renovation-${proj.id}.png`;
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
  if (view === 'calendar' && selectedProject) {
    return (
      <RentalCalendar
        propertyId={selectedProject.id}
        category="Ремонт"
        onBack={() => {
          setSelectedProject(null);
          setView('list');
        }}
      />
    );
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="container" ref={exportRef}>
      <h2>Renovation Projects</h2>

      {/* ─── Toolbar ────────────────────────────────────────────────────────────── */}
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <button
          onClick={() => {
            cancelForm();
            setView('form');
          }}
        >
          + New Project
        </button>
        <button
          onClick={() => {
            if (!exportRef.current) return;
            html2canvas(exportRef.current).then((canvas) => {
              const link = document.createElement('a');
              link.download = `renovation-projects-${view}.png`;
              link.href = canvas.toDataURL();
              link.click();
            });
          }}
        >
          Export View
        </button>
      </div>

      {/* ─── Filters ────────────────────────────────────────────────────────────── */}
      <section className="filters card" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search comments or stages..."
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
          placeholder="Filter by Work Type"
          value={workTypeFilter}
          onChange={handleFilterChange(setWorkTypeFilter)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Min Duration"
          value={durationMin}
          onChange={handleFilterChange(setDurationMin)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Max Duration"
          value={durationMax}
          onChange={handleFilterChange(setDurationMax)}
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

      {/* ─── List View ─────────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          {loading ? (
            <p>Loading projects...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <section className="projects-list">
              <div
                className="project-row header"
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
                <div style={{ flex: 1 }}>Work Type</div>
                <div style={{ flex: 0.8 }}>Duration</div>
                <div style={{ flex: 0.8 }}>Cost</div>
                <div style={{ flex: 1 }}>Dates</div>
                <div style={{ flex: 1 }}>Actions</div>
              </div>

              {paginatedProjects.length > 0 ? (
                paginatedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="project-row"
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
                    <div style={{ flex: 0.5 }}>{proj.id}</div>
                    <div style={{ flex: 1 }}>{proj.name}</div>
                    <div style={{ flex: 1 }}>{proj.phone}</div>
                    <div style={{ flex: 1 }}>{proj.email || '–'}</div>
                    <div style={{ flex: 0.8 }}>
                      {proj.telegram_username || '–'}
                    </div>
                    <div style={{ flex: 1 }}>{proj.address}</div>
                    <div style={{ flex: 1 }}>{proj.work_type}</div>
                    <div style={{ flex: 0.8 }}>{proj.duration}</div>
                    <div style={{ flex: 0.8 }}>{proj.cost}</div>
                    <div style={{ flex: 1 }}>
                      {proj.start_date} – {proj.end_date}
                    </div>
                    <div style={{ flex: 1 }}>
                      <button
                        onClick={() => {
                          setSelectedProject(proj);
                          setView('calendar');
                        }}
                        style={{ marginRight: 8 }}
                      >
                        📅
                      </button>
                      <button
                        onClick={() => startEditing(proj)}
                        style={{ marginRight: 8 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        style={{ marginRight: 8 }}
                      >
                        Delete
                      </button>
                      <button onClick={() => exportPoster(proj)}>
                        Export
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No renovation projects found.</p>
              )}

              {/* Pagination */}
              {pageCount > 1 && (
                <div className="pagination" style={{ marginTop: 16 }}>
                  <button
                    onClick={() =>
                      setCurrentPage((cp) => Math.max(cp - 1, 1))
                    }
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
          className="project-form card"
          style={{
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: 16,
            marginTop: 16
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {editingId ? 'Edit' : 'Add'} Renovation Project
          </h3>
          <form onSubmit={saveProject}>
            {/* ─── NAME & PHONE ───────────────────────────────────────────────── */}
            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Name</label>
              <input
                name="name"
                value={formProject.name}
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
                value={formProject.phone}
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

            {/* ─── EMAIL & TELEGRAM ─────────────────────────────────────────────── */}
            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Email</label>
              <input
                name="email"
                type="email"
                value={formProject.email}
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
                value={formProject.telegram_username}
                onChange={handleFormChange}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
              />
            </div>

            {/* ─── RENOVATION FIELDS ──────────────────────────────────────────────── */}
            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Address</label>
              <input
                name="address"
                value={formProject.address}
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
              <label style={{ width: 120 }}>Work Type</label>
              <input
                name="work_type"
                value={formProject.work_type}
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
              <label style={{ width: 120 }}>Materials</label>
              <input
                name="materials"
                value={formProject.materials}
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
              <label style={{ width: 120 }}>Duration</label>
              <input
                name="duration"
                value={formProject.duration}
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
                value={formProject.cost}
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
              style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start' }}
            >
              <label style={{ width: 120, marginTop: 8 }}>Execution Stages</label>
              <textarea
                name="execution_stages"
                value={formProject.execution_stages}
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
                value={formProject.comment}
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
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Start Date</label>
              <input
                name="start_date"
                type="date"
                value={formProject.start_date}
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
              <label style={{ width: 120 }}>End Date</label>
              <input
                name="end_date"
                type="date"
                value={formProject.end_date}
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
            {formProject.photos && formProject.photos.length > 0 && (
              <div
                className="photos-preview"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: 16
                }}
              >
                {formProject.photos.map((photoItem) => {
                  const src = photoItem.file_path
                    ? `${photoItem.file_path}` // existing server file
                    : photoItem.preview;       // local preview
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

            {/* ─── FORM ACTIONS ───────────────────────────────────────────────────── */}
            <div className="form-actions" style={{ marginTop: 16 }}>
              <button type="submit" className="advanced">
                {editingId ? 'Save Changes' : 'Create Project'}
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
};

export default RenovationProjectsControl;
