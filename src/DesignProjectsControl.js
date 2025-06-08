// src/DesignProjectsControl.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import html2canvas from 'html2canvas';
import RentalCalendar from './RentalCalendar';
import './control.css';

const API_URL = 'https://79cf-217-31-72-114.ngrok-free.app'; // adjust if necessary
const PAGE_SIZE = 10;

const DesignProjectsControl = () => {
  // ─── VIEW STATE ─────────────────────────────────────────────────────────────
  const [view, setView] = useState('list');            // 'list' | 'form' | 'calendar'
  const [selectedProject, setSelectedProject] = useState(null);

  // ─── DATA STATE ─────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  // ─── PAGINATION ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ─── LOADING & ERROR ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── FILTERS ─────────────────────────────────────────────────────────────────
  const [filterText, setFilterText] = useState('');
  const [designTypeFilter, setDesignTypeFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // ─── FORM STATE ─────────────────────────────────────────────────────────────
  const emptyProject = {
    name: '',
    phone: '',
    email: '',
    telegram_username: '',
    design_type: '',
    style: '',
    area: '',
    color_scheme: '',
    budget: '',
    features: '',
    comment: '',
    start_date: '',
    end_date: '',
    sketches: []
  };
  const [formProject, setFormProject] = useState(emptyProject);
  const [editingId, setEditingId] = useState(null);

  // ─── REF for export ─────────────────────────────────────────────────────────
  const exportRef = useRef(null);

  // ─── UNIQUE OPTION SETS for dropdown filters ───────────────────────────────
  const designTypeOptions = [...new Set(projects.map(p => p.design_type).filter(Boolean))];
  const styleOptions = [...new Set(projects.map(p => p.style).filter(Boolean))];

  // ─── FETCH PROJECTS ON MOUNT ────────────────────────────────────────────────
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/design/projects/`);
      const normalized = data.map(p => ({
        ...p,
        sketches: Array.isArray(p.sketches) ? p.sketches : []
      }));
      setProjects(normalized);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  // ─── APPLY FILTERS ──────────────────────────────────────────────────────────
  const applyFilters = useCallback(() => {
    let result = [...projects];

    if (filterText.trim()) {
      const q = filterText.trim().toLowerCase();
      result = result.filter(
        p =>
          (p.features || '').toLowerCase().includes(q) ||
          (p.comment || '').toLowerCase().includes(q)
      );
    }
    if (designTypeFilter) {
      result = result.filter(p => p.design_type === designTypeFilter);
    }
    if (styleFilter) {
      result = result.filter(p => p.style === styleFilter);
    }
    if (areaMin) {
      result = result.filter(p => parseFloat(p.area || 0) >= parseFloat(areaMin));
    }
    if (areaMax) {
      result = result.filter(p => parseFloat(p.area || 0) <= parseFloat(areaMax));
    }
    if (budgetMin) {
      result = result.filter(p => parseFloat(p.budget || 0) >= parseFloat(budgetMin));
    }
    if (budgetMax) {
      result = result.filter(p => parseFloat(p.budget || 0) <= parseFloat(budgetMax));
    }
    if (dateFromFilter) {
      result = result.filter(p => p.start_date >= dateFromFilter);
    }
    if (dateToFilter) {
      result = result.filter(p => p.end_date <= dateToFilter);
    }

    setFilteredProjects(result);
    setCurrentPage(1);
  }, [
    projects,
    filterText,
    designTypeFilter,
    styleFilter,
    areaMin,
    areaMax,
    budgetMin,
    budgetMax,
    dateFromFilter,
    dateToFilter
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ─── HANDLERS FOR FORM FIELDS ──────────────────────────────────────────────
  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ─── FILE UPLOAD HANDLER ───────────────────────────────────────────────────
  const handleSketchUpload = e => {
    const uploads = Array.from(e.target.files).map((file, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      file,
      preview: URL.createObjectURL(file)
    }));
    setFormProject(prev => ({
      ...prev,
      sketches: [...(prev.sketches || []), ...uploads]
    }));
  };

  // ─── DRAG & DROP REORDER ───────────────────────────────────────────────────
  const handleDragEnd = result => {
    if (!result.destination) return;
    const list = Array.from(formProject.sketches || []);
    const [moved] = list.splice(result.source.index, 1);
    list.splice(result.destination.index, 0, moved);
    setFormProject(prev => ({ ...prev, sketches: list }));
  };

  // ─── START EDITING AN EXISTING PROJECT ─────────────────────────────────────
  const startEditing = async proj => {
    setFormProject({
      name: proj.name || '',
      phone: proj.phone || '',
      email: proj.email || '',
      telegram_username: proj.telegram_username || '',
      design_type: proj.design_type || '',
      style: proj.style || '',
      area: proj.area || '',
      color_scheme: proj.color_scheme || '',
      budget: proj.budget || '',
      features: proj.features || '',
      comment: proj.comment || '',
      start_date: proj.start_date || '',
      end_date: proj.end_date || '',
      sketches: []
    });
    setEditingId(proj.id);
    setView('form');

    // Fetch existing sketches
    try {
      const { data: filesList } = await axios.get(`${API_URL}/files/design/${proj.id}`);
      const existingSketches = filesList.map(f => ({
        id: f.id,
        file_path: f.file_path,
        filename: f.filename
      }));
      setFormProject(prev => ({ ...prev, sketches: existingSketches }));
    } catch (err) {
      console.error('Could not fetch existing sketches:', err);
    }
  };

  const cancelForm = () => {
    formProject.sketches.forEach(item => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
    setFormProject(emptyProject);
    setEditingId(null);
    setView('list');
    setError('');
  };

  // ─── DELETE A SKETCH ───────────────────────────────────────────────────────
  const handleDeleteSketch = async sketchItem => {
    if (sketchItem.id && typeof sketchItem.id === 'number') {
      try {
        await axios.delete(`${API_URL}/files/${sketchItem.id}`);
      } catch (err) {
        console.error('Failed to delete sketch on server:', err);
      }
    }
    if (sketchItem.preview) {
      URL.revokeObjectURL(sketchItem.preview);
    }
    setFormProject(prev => ({
      ...prev,
      sketches: prev.sketches.filter(s => s.id !== sketchItem.id)
    }));
  };

  // ─── SAVE (CREATE or UPDATE) A DESIGN PROJECT ─────────────────────────────
  const saveProject = async e => {
    e.preventDefault();

    const payload = {
      name: formProject.name,
      phone: formProject.phone,
      email: formProject.email || null,
      telegram_username: formProject.telegram_username || null,
      design_type: formProject.design_type,
      style: formProject.style,
      area: formProject.area || null,
      color_scheme: formProject.color_scheme || null,
      budget: formProject.budget || null,
      start_date: formProject.start_date || null,
      end_date: formProject.end_date || null,
      features: formProject.features || null,
      comment: formProject.comment || null
    };

    try {
      let savedProj;
      if (editingId) {
        const { data: updated } = await axios.put(
          `${API_URL}/design/projects/${editingId}/`,
          payload
        );
        savedProj = updated;
        setProjects(prev =>
          prev.map(p => (p.id === editingId ? updated : p))
        );
      } else {
        const { data: created } = await axios.post(
          `${API_URL}/design/projects/`,
          payload
        );
        savedProj = created;
        setProjects(prev => [...prev, created]);
        setEditingId(created.id);
      }

      const projectId = savedProj.id;
      const toUpload = formProject.sketches.filter(s => s.file);
      for (let sketchItem of toUpload) {
        const formData = new FormData();
        formData.append('file', sketchItem.file);
        await axios.post(
          `${API_URL}/files/design/${projectId}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }

      try {
        const { data: freshFiles } = await axios.get(`${API_URL}/files/design/${projectId}`);
        const existingSketches = freshFiles.map(f => ({
          id: f.id,
          file_path: f.file_path,
          filename: f.filename
        }));
        setFormProject(prev => ({ ...prev, sketches: existingSketches }));
      } catch (err) {
        console.error('Failed to re-fetch sketches:', err);
      }

      cancelForm();
      setError('');
    } catch (err) {
      console.error('Error saving project:', err);
      setError('Error saving project.');
    }
  };

  // ─── DELETE ENTIRE PROJECT ─────────────────────────────────────────────────
  const deleteProject = async id => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API_URL}/design/projects/${id}/`);
      setProjects(prev => prev.filter(p => p.id !== id));
      setError('');
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Failed to delete.');
    }
  };

  // ─── EXPORT SINGLE PROJECT AS PNG ──────────────────────────────────────────
  const makePoster = async proj => {
    const container = document.createElement('div');
    Object.assign(container.style, {
      padding: '20px',
      background: '#fff',
      color: '#000',
      fontFamily: 'Arial'
    });
    container.innerHTML = `
      <h1>${proj.design_type} - ${proj.style}</h1>
      <p><strong>Name:</strong> ${proj.name}</p>
      <p><strong>Phone:</strong> ${proj.phone}</p>
      <p><strong>Email:</strong> ${proj.email || '–'}</p>
      <p><strong>Telegram:</strong> ${proj.telegram_username || '–'}</p>
      <hr/>
      <p><strong>Area:</strong> ${proj.area || '–'}</p>
      <p><strong>Budget:</strong> ${proj.budget || '–'}</p>
      <p><strong>Dates:</strong> ${proj.start_date} to ${proj.end_date}</p>
      <p><strong>Features:</strong> ${proj.features || '–'}</p>
      <p><strong>Comment:</strong> ${proj.comment || '–'}</p>
    `;
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { useCORS: true, scale: 2 });
      const link = document.createElement('a');
      link.download = `project-${proj.id}.png`;
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
        category="Дизайн"
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
      <h2>Design Projects</h2>

      {/* ─── TOOLBAR ───────────────────────────────────────────────────────────── */}
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
            html2canvas(exportRef.current).then(canvas => {
              const link = document.createElement('a');
              link.download = `design-projects-${view}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
            });
          }}
        >
          Export View
        </button>
      </div>

      {/* ─── FILTERS ────────────────────────────────────────────────────────────── */}
      <section className="filters card" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search features or comments..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <select
          value={designTypeFilter}
          onChange={e => setDesignTypeFilter(e.target.value)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        >
          <option value="">All Types</option>
          {designTypeOptions.map(dt => (
            <option key={dt} value={dt}>{dt}</option>
          ))}
        </select>
        <select
          value={styleFilter}
          onChange={e => setStyleFilter(e.target.value)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        >
          <option value="">All Styles</option>
          {styleOptions.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min Area"
          value={areaMin}
          onChange={e => setAreaMin(e.target.value)}
          className="filter-input animated"
          style={{ width: 100, marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Max Area"
          value={areaMax}
          onChange={e => setAreaMax(e.target.value)}
          className="filter-input animated"
          style={{ width: 100, marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Min Budget"
          value={budgetMin}
          onChange={e => setBudgetMin(e.target.value)}
          className="filter-input animated"
          style={{ width: 100, marginRight: 8 }}
        />
        <input
          type="number"
          placeholder="Max Budget"
          value={budgetMax}
          onChange={e => setBudgetMax(e.target.value)}
          className="filter-input animated"
          style={{ width: 100, marginRight: 8 }}
        />
        <label style={{ marginRight: 4 }}>Date From:</label>
        <input
          type="date"
          value={dateFromFilter}
          onChange={e => setDateFromFilter(e.target.value)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
        <label style={{ marginRight: 4 }}>Date To:</label>
        <input
          type="date"
          value={dateToFilter}
          onChange={e => setDateToFilter(e.target.value)}
          className="filter-input animated"
          style={{ marginRight: 8 }}
        />
      </section>

      {/* ─── ROW‐BASED TABLE LIST VIEW ───────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error" style={{ color: 'red' }}>{error}</p>
          ) : (
            <section className="list-view card">
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="projects-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Phone</th>
                      <th style={thStyle}>Design Type</th>
                      <th style={thStyle}>Style</th>
                      <th style={thStyle}>Area</th>
                      <th style={thStyle}>Budget</th>
                      <th style={thStyle}>Start Date</th>
                      <th style={thStyle}>End Date</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProjects.map(proj => (
                      <tr key={proj.id} style={rowStyle}>
                        <td style={tdStyle}>{proj.id}</td>
                        <td style={tdStyle}>{proj.name}</td>
                        <td style={tdStyle}>{proj.phone}</td>
                        <td style={tdStyle}>{proj.design_type}</td>
                        <td style={tdStyle}>{proj.style}</td>
                        <td style={tdStyle}>{proj.area || '–'}</td>
                        <td style={tdStyle}>{proj.budget || '–'}</td>
                        <td style={tdStyle}>{proj.start_date}</td>
                        <td style={tdStyle}>{proj.end_date}</td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => {
                              setSelectedProject(proj);
                              setView('calendar');
                            }}
                            title="Calendar"
                            style={actionBtnStyle}
                          >
                            📅
                          </button>
                          <button
                            onClick={() => startEditing(proj)}
                            title="Edit"
                            style={actionBtnStyle}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => deleteProject(proj.id)}
                            title="Delete"
                            style={actionBtnStyle}
                          >
                            🗑
                          </button>
                          <button
                            onClick={() => makePoster(proj)}
                            title="Export"
                            style={actionBtnStyle}
                          >
                            📤
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pageCount > 1 && (
                <div className="pagination" style={{ marginTop: 16 }}>
                  <button
                    onClick={() => setCurrentPage(cp => Math.max(cp - 1, 1))}
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
                    onClick={() => setCurrentPage(cp => Math.min(cp + 1, pageCount))}
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

      {/* ─── FORM VIEW ──────────────────────────────────────────────────────────── */}
      {view === 'form' && (
        <section
          className="project-form card"
          style={{
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: 16,
            marginTop: 16
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {editingId ? 'Edit Project' : 'Add Project'}
          </h3>
          <form onSubmit={saveProject}>
            {/* ─── NAME & PHONE ─────────────────────────────────────────────────── */}
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

            {/* ─── EMAIL & TELEGRAM ──────────────────────────────────────────────── */}
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

            {/* ─── DESIGN‐SPECIFIC FIELDS ───────────────────────────────────────── */}
            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Design Type</label>
              <input
                name="design_type"
                value={formProject.design_type}
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
              <label style={{ width: 120 }}>Style</label>
              <input
                name="style"
                value={formProject.style}
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
              <label style={{ width: 120 }}>Area</label>
              <input
                name="area"
                type="number"
                value={formProject.area}
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
              <label style={{ width: 120 }}>Color Scheme</label>
              <input
                name="color_scheme"
                value={formProject.color_scheme}
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
              <label style={{ width: 120 }}>Budget</label>
              <input
                name="budget"
                type="number"
                value={formProject.budget}
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
              <label style={{ width: 120, marginTop: 8 }}>Features</label>
              <textarea
                name="features"
                value={formProject.features}
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
                type="date"
                name="start_date"
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
                type="date"
                name="end_date"
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

            {/* ─── SKETCH FILE UPLOAD ─────────────────────────────────────────────── */}
            <div
              className="form-row"
              style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
            >
              <label style={{ width: 120 }}>Sketches</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleSketchUpload}
                style={{
                  flex: 1,
                  padding: 4
                }}
              />
            </div>

            {/* ─── SKETCH PREVIEWS ─────────────────────────────────────────────────── */}
            {formProject.sketches && formProject.sketches.length > 0 && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sketches" direction="horizontal">
                  {provided => (
                    <div
                      className="sketches-list"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        display: 'flex',
                        gap: 12,
                        overflowX: 'auto',
                        padding: '8px 0',
                        marginBottom: 16
                      }}
                    >
                      {formProject.sketches.map((sk, idx) => {
                        const src = sk.file_path
                          ? `${sk.file_path}`
                          : sk.preview;
                        return (
                          <Draggable
                            key={sk.id}
                            draggableId={`${sk.id}`}
                            index={idx}
                          >
                            {prov => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                style={{
                                  position: 'relative',
                                  minWidth: 80,
                                  height: 80,
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                  ...prov.draggableProps.style
                                }}
                              >
                                <img
                                  src={`${API_URL}${src}`}
                                  alt="sketch"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSketch(sk)}
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
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

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

// ─────── STYLES USED INTERNALLY ───────────────────────────────────────────────
const thStyle = {
  padding: '8px 12px',
  borderBottom: '1px solid #ddd',
  textAlign: 'left',
  background: '#f7f7f7'
};
const tdStyle = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee'
};
const rowStyle = {
  background: '#fff'
};
const actionBtnStyle = {
  marginRight: 6,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem'
};

export default DesignProjectsControl;
