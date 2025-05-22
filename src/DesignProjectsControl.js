// src/DesignProjectsControl.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import html2canvas from 'html2canvas';
import RentalCalendar from './RentalCalendar';
import './control.css';

const API_URL = 'http://localhost:8000'; // update if necessary
const PAGE_SIZE = 10;

const DesignProjectsControl = () => {
  // --- VIEW STATE ---
  const [view, setView] = useState('list');            // 'list' | 'form' | 'calendar'
  const [selectedProject, setSelectedProject] = useState(null);

  // --- DATA STATE ---
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // --- LOADING & ERROR ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- FILTERS ---
  const [filterText, setFilterText] = useState('');
  const [designTypeFilter, setDesignTypeFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // --- FORM STATE ---
  const empty = {
    design_type: '',
    style: '',
    area: '',
    color_scheme: '',
    budget: '',
    sketches: [],
    features: '',
    comment: '',
    start_date: '',
    end_date: ''
  };
  const [formProject, setFormProject] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  // --- REF for export ---
  const exportRef = useRef(null);

  // --- Unique options for filters ---
  const designTypeOptions = [...new Set(projects.map(p => p.design_type).filter(Boolean))];
  const styleOptions = [...new Set(projects.map(p => p.style).filter(Boolean))];

  // --- EFFECT: fetch initial data ---
  useEffect(() => {
    fetchProjects();
  }, []);

  // --- Fetch projects ---
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/design/projects/`);
      // ensure sketches is always an array
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

  // --- Apply filters ---
  const applyFilters = useCallback(() => {
    let result = [...projects];
    if (filterText) {
      const q = filterText.toLowerCase();
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
      result = result.filter(p => parseFloat(p.area) >= parseFloat(areaMin));
    }
    if (areaMax) {
      result = result.filter(p => parseFloat(p.area) <= parseFloat(areaMax));
    }
    if (budgetMin) {
      result = result.filter(p => parseFloat(p.budget) >= parseFloat(budgetMin));
    }
    if (budgetMax) {
      result = result.filter(p => parseFloat(p.budget) <= parseFloat(budgetMax));
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

  // --- Handlers for form fields ---
  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Handle file uploads for sketches ---
  const handleFileUpload = e => {
    const uploads = Array.from(e.target.files).map(file => ({
      id: `${Date.now()}-${file.name}`,
      file,
      preview: URL.createObjectURL(file)
    }));
    setFormProject(prev => ({
      ...prev,
      sketches: [...(prev.sketches || []), ...uploads]
    }));
  };

  // --- Reorder sketches via drag & drop ---
  const handleDragEnd = result => {
    if (!result.destination) return;
    const list = Array.from(formProject.sketches);
    const [moved] = list.splice(result.source.index, 1);
    list.splice(result.destination.index, 0, moved);
    setFormProject(prev => ({ ...prev, sketches: list }));
  };

  // --- CRUD operations ---
  const startEditing = proj => {
    setFormProject({
      ...proj,
      sketches: Array.isArray(proj.sketches) ? proj.sketches : []
    });
    setEditingId(proj.id);
    setView('form');
  };

  const cancelForm = () => {
    setFormProject(empty);
    setEditingId(null);
    setView('list');
  };

  const saveProject = async e => {
    e.preventDefault();
    try {
      let normalized;
      if (editingId) {
        const { data: updated } = await axios.put(
          `${API_URL}/design/projects/${editingId}/`,
          formProject
        );
        normalized = {
          ...updated,
          sketches: Array.isArray(updated.sketches) ? updated.sketches : []
        };
        setProjects(prev =>
          prev.map(p => (p.id === editingId ? normalized : p))
        );
      } else {
        const { data: created } = await axios.post(
          `${API_URL}/design/projects/`,
          formProject
        );
        normalized = {
          ...created,
          sketches: Array.isArray(created.sketches) ? created.sketches : []
        };
        setProjects(prev => [...prev, normalized]);
      }
      cancelForm();
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error saving project.');
    }
  };

  const deleteProject = async id => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API_URL}/design/projects/${id}/`);
      setProjects(prev => prev.filter(p => p.id !== id));
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to delete.');
    }
  };

  // --- Calendar view handler ---
  const openCalendar = proj => {
    setSelectedProject(proj);
    setView('calendar');
  };

  // --- Export to image (poster) ---
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
      <p>Area: ${proj.area}</p>
      <p>Budget: ${proj.budget}</p>
      <p>Dates: ${proj.start_date} to ${proj.end_date}</p>
      <p>${proj.comment}</p>
    `;
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { useCORS: true, scale: 2 });
    const link = document.createElement('a');
    link.download = `project-${proj.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    document.body.removeChild(container);
  };

  // --- Export current list/form to image ---
  const exportView = async () => {
    if (!exportRef.current) return;
    try {
      const canvas = await html2canvas(exportRef.current, { scale: 2 });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `design-projects-${view}.png`;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed.');
    }
  };

  // --- Render ---

  // Calendar view
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

  return (
    <div className="container" ref={exportRef}>
      <h2>Design Projects</h2>

      {/* Toolbar */}
      <div className="toolbar">
        <button onClick={() => { setFormProject(empty); setEditingId(null); setView('form'); }}>
          + New Project
        </button>
        <button onClick={exportView}>Export View</button>
      </div>

      {/* Filters */}
      <section className="filters card">
        <input
          type="text"
          placeholder="Search features or comments..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="filter-input animated"
        />
        <select
          value={designTypeFilter}
          onChange={e => setDesignTypeFilter(e.target.value)}
          className="filter-input animated"
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
        />
        <input
          type="number"
          placeholder="Max Area"
          value={areaMax}
          onChange={e => setAreaMax(e.target.value)}
          className="filter-input animated"
        />
        <input
          type="number"
          placeholder="Min Budget"
          value={budgetMin}
          onChange={e => setBudgetMin(e.target.value)}
          className="filter-input animated"
        />
        <input
          type="number"
          placeholder="Max Budget"
          value={budgetMax}
          onChange={e => setBudgetMax(e.target.value)}
          className="filter-input animated"
        />
        <label>Date From:</label>
        <input
          type="date"
          value={dateFromFilter}
          onChange={e => setDateFromFilter(e.target.value)}
          className="filter-input animated"
        />
        <label>Date To:</label>
        <input
          type="date"
          value={dateToFilter}
          onChange={e => setDateToFilter(e.target.value)}
          className="filter-input animated"
        />
      </section>

      {/* List View */}
      <section className="projects-list card">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <>
            {paginatedProjects.map(proj => (
              <div key={proj.id} className="project-card">
                <div className="header">
                  <h3>{proj.design_type} ({proj.style})</h3>
                  <div className="actions">
                    <button onClick={() => openCalendar(proj)}>📅</button>
                    <button onClick={() => startEditing(proj)}>Edit</button>
                    <button onClick={() => deleteProject(proj.id)}>Delete</button>
                    <button onClick={() => makePoster(proj)}>Export</button>
                  </div>
                </div>
                <p>Area: {proj.area}</p>
                <p>Budget: {proj.budget}</p>
              </div>
            ))}
            {/* Pagination */}
            {pageCount > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(cp => Math.max(cp - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ‹ Prev
                </button>
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i+1}
                    className={currentPage === i+1 ? 'active' : ''}
                    onClick={() => setCurrentPage(i+1)}
                  >
                    {i+1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(cp => Math.min(cp + 1, pageCount))}
                  disabled={currentPage === pageCount}
                >
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Form View */}
      {view === 'form' && (
        <section className="project-form card">
          <h3>{editingId ? 'Edit' : 'Add'} Project</h3>
          <form onSubmit={saveProject}>
            <div className="form-row">
              <label>Design Type</label>
              <input
                name="design_type"
                value={formProject.design_type}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-row">
              <label>Style</label>
              <input
                name="style"
                value={formProject.style}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-row">
              <label>Area</label>
              <input
                name="area"
                type="number"
                value={formProject.area}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-row">
              <label>Color Scheme</label>
              <input
                name="color_scheme"
                value={formProject.color_scheme}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-row">
              <label>Budget</label>
              <input
                name="budget"
                type="number"
                value={formProject.budget}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-row">
              <label>Features</label>
              <textarea
                name="features"
                value={formProject.features}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-row">
              <label>Comment</label>
              <textarea
                name="comment"
                value={formProject.comment}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-row">
              <label>Start Date</label>
              <input
                name="start_date"
                type="date"
                value={formProject.start_date}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-row">
              <label>End Date</label>
              <input
                name="end_date"
                type="date"
                value={formProject.end_date}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-row">
              <label>Sketches</label>
              <input type="file" multiple onChange={handleFileUpload} />
            </div>
            {formProject.sketches.length > 0 && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sketches" direction="horizontal">
                  {provided => (
                    <div className="sketches-list" ref={provided.innerRef} {...provided.droppableProps}>
                      {formProject.sketches.map((sk, idx) => (
                        <Draggable key={sk.id} draggableId={`${sk.id}`} index={idx}>
                          {prov => (
                            <div
                              className="sketch-item"
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                            >
                              <img
                                src={sk.preview || sk.file_path}
                                alt="sketch"
                              />
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
            <div className="form-actions">
              <button type="submit">Save</button>
              <button type="button" onClick={cancelForm}>Cancel</button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default DesignProjectsControl;
