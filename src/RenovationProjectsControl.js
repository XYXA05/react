// src/RenovationProjectsControl.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RentalCalendar from './RentalCalendar';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import html2canvas from 'html2canvas';
import './control.css';

const API_URL = 'http://localhost:8000'; // Adjust backend URL as needed

const RenovationProjectsControl = () => {
  // Role and view state
  const [userRole] = useState('admin'); // Replace with auth context
  const [view, setView] = useState('list');
  const [selectedProject, setSelectedProject] = useState(null);

  // Data and UI states
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [durationMax, setDurationMax] = useState('');
  const [costMin, setCostMin] = useState('');
  const [costMax, setCostMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Form state for adding/editing
  const initialForm = {
    address: '',
    work_type: '',
    materials: '',
    duration: '',
    cost: '',
    photos: [],
    execution_stages: '',
    comment: '',
    start_date: '',
    end_date: ''
  };
  const [formProject, setFormProject] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Re-apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [projects, searchText, addressFilter, workTypeFilter, durationMin, durationMax, costMin, costMax, dateFrom, dateTo]);

  // Fetch all renovation projects
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/renovation/projects/`);
      // Normalize photos array
      const normalized = data.map(p => ({
        ...p,
        photos: Array.isArray(p.photos) ? p.photos : []
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

  // Apply filter criteria
  const applyFilters = useCallback(() => {
    let result = [...projects];

    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(p =>
        (p.comment || '').toLowerCase().includes(q) ||
        (p.execution_stages || '').toLowerCase().includes(q)
      );
    }
    if (addressFilter) {
      result = result.filter(p => p.address.toLowerCase().includes(addressFilter.toLowerCase()));
    }
    if (workTypeFilter) {
      result = result.filter(p => p.work_type === workTypeFilter);
    }
    if (durationMin) {
      result = result.filter(p => parseFloat(p.duration) >= parseFloat(durationMin));
    }
    if (durationMax) {
      result = result.filter(p => parseFloat(p.duration) <= parseFloat(durationMax));
    }
    if (costMin) {
      result = result.filter(p => parseFloat(p.cost) >= parseFloat(costMin));
    }
    if (costMax) {
      result = result.filter(p => parseFloat(p.cost) <= parseFloat(costMax));
    }
    if (dateFrom) {
      result = result.filter(p => p.start_date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(p => p.end_date <= dateTo);
    }

    setFilteredProjects(result);
  }, [projects, searchText, addressFilter, workTypeFilter, durationMin, durationMax, costMin, costMax, dateFrom, dateTo]);

  // Handle changes in filter inputs
  const handleFilterChange = setter => e => setter(e.target.value);

  // Handle form input changes
  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormProject(prev => ({ ...prev, [name]: value }));
  };

  // Handle photo uploads
  const handlePhotoUpload = e => {
    const files = Array.from(e.target.files).map(f => ({
      id: `${Date.now()}-${f.name}`,
      file: f,
      preview: URL.createObjectURL(f)
    }));
    setFormProject(prev => ({
      ...prev,
      photos: [...(Array.isArray(prev.photos) ? prev.photos : []), ...files]
    }));
  };

  // Initialize form for editing
  const startEditing = proj => {
    setFormProject({
      ...proj,
      photos: Array.isArray(proj.photos) ? proj.photos : []
    });
    setEditingId(proj.id);
    setView('form');
  };

  // Cancel add/edit form
  const cancelForm = () => {
    setFormProject(initialForm);
    setEditingId(null);
    setView('list');
  };

  // Save new or updated project
  const saveProject = async e => {
    e.preventDefault();
    try {
      let normalized;
      if (editingId) {
        const { data: updated } = await axios.put(
          `${API_URL}/renovation/projects/${editingId}/`,
          formProject
        );
        normalized = {
          ...updated,
          photos: Array.isArray(updated.photos) ? updated.photos : []
        };
        setProjects(prev => prev.map(p => p.id === editingId ? normalized : p));
      } else {
        const { data: created } = await axios.post(
          `${API_URL}/renovation/projects/`,
          formProject
        );
        normalized = {
          ...created,
          photos: Array.isArray(created.photos) ? created.photos : []
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

  // Delete a project
  const deleteProject = async id => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await axios.delete(`${API_URL}/renovation/projects/${id}/`);
      setProjects(prev => prev.filter(p => p.id !== id));
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to delete.');
    }
  };

  // Placeholder for photo reordering
  const handleDragEnd = ({ source, destination }) => {
    if (!destination) return;
    // implement reorder of formProject.photos if desired
  };

  // Export project summary as image
  const exportPoster = async proj => {
    const container = document.createElement('div');
    Object.assign(container.style, {
      padding: '20px',
      background: '#fff',
      color: '#000',
      fontFamily: 'Arial'
    });
    container.innerHTML = `
      <h1>Renovation: ${proj.work_type}</h1>
      <p>Address: ${proj.address}</p>
      <p>Materials: ${proj.materials}</p>
      <p>Duration: ${proj.duration}</p>
      <p>Cost: ${proj.cost}</p>
      <p>Dates: ${proj.start_date} to ${proj.end_date}</p>
      <p>${proj.comment}</p>
    `;
    document.body.appendChild(container);
    const canvas = await html2canvas(container, { useCORS: true, scale: 2 });
    const link = document.createElement('a');
    link.download = `renovation-${proj.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    document.body.removeChild(container);
  };

  // Calendar view
  if (view === 'calendar' && selectedProject) {
    return (
      <RentalCalendar
        propertyId={selectedProject.id}
        category="Ремонт"
        onBack={() => { setSelectedProject(null); setView('list'); }}
      />
    );
  }

  // Main render
  return (
    <div className="container">
      <h2>Renovation Projects</h2>

      {/* Filters */}
      <section className="filters card">
        <input
          type="text"
          placeholder="Search comments or stages"
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
          placeholder="Filter by Work Type"
          value={workTypeFilter}
          onChange={handleFilterChange(setWorkTypeFilter)}
          className="filter-input animated"
        />
        <input
          type="number"
          placeholder="Min Duration"
          value={durationMin}
          onChange={handleFilterChange(setDurationMin)}
          className="filter-input animated"
        />
        <input
          type="number"
          placeholder="Max Duration"
          value={durationMax}
          onChange={handleFilterChange(setDurationMax)}
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
        <button
          onClick={() => {
            setFormProject(initialForm);
            setEditingId(null);
            setSelectedProject(null);
            setView('form');
          }}
          className="advanced"
        >
          + New Project
        </button>
      </section>

      {/* List View */}
      {loading ? (
        <div>Loading projects...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <section className="projects-list card">
          {filteredProjects.map(proj => (
            <article key={proj.id} className="project-card">
              <header>
                <h3>{proj.work_type} @ {proj.address}</h3>
                <div className="actions">
                  <button onClick={() => { setSelectedProject(proj); setView('calendar'); }}>📅</button>
                  <button onClick={() => startEditing(proj)}>Edit</button>
                  <button onClick={() => deleteProject(proj.id)}>Delete</button>
                  <button onClick={() => exportPoster(proj)}>Export</button>
                </div>
              </header>
              <div className="details">
                <p><strong>Materials:</strong> {proj.materials}</p>
                <p><strong>Duration:</strong> {proj.duration}</p>
                <p><strong>Cost:</strong> {proj.cost}</p>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Form View */}
      {view === 'form' && (
        <form className="project-form card" onSubmit={saveProject}>
          <h3>{editingId ? 'Edit' : 'Add'} Renovation Project</h3>
          <label>
            Address:
            <input
              name="address"
              value={formProject.address}
              onChange={handleFormChange}
              required
            />
          </label>
          <label>
            Work Type:
            <input
              name="work_type"
              value={formProject.work_type}
              onChange={handleFormChange}
              required
            />
          </label>
          <label>
            Materials:
            <input
              name="materials"
              value={formProject.materials}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Duration:
            <input
              name="duration"
              value={formProject.duration}
              onChange={handleFormChange}
            />
          </label>
          <label>
            Cost:
            <input
              name="cost"
              value={formProject.cost}
              onChange={handleFormChange}
            />
          </label>
          <textarea
            name="execution_stages"
            value={formProject.execution_stages}
            onChange={handleFormChange}
            placeholder="Execution Stages"
          />
          <textarea
            name="comment"
            value={formProject.comment}
            onChange={handleFormChange}
            placeholder="Comment"
          />
          <label>
            Start Date:
            <input
              type="date"
              name="start_date"
              value={formProject.start_date}
              onChange={handleFormChange}
              required
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              name="end_date"
              value={formProject.end_date}
              onChange={handleFormChange}
              required
            />
          </label>
          <label>
            Photos:
            <input type="file" multiple onChange={handlePhotoUpload} />
          </label>
          <div className="photos-preview">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="photos" direction="horizontal">
                {provided => {
                  const list = Array.isArray(formProject.photos) ? formProject.photos : [];
                  return (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="photos-list">
                      {list.map((ph, idx) => (
                        <Draggable key={ph.id} draggableId={`${ph.id}`} index={idx}>
                          {prov => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className="photo-item"
                            >
                              <img
                                src={ph.preview || ph.file_path}
                                alt="photo"
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  );
                }}
              </Droppable>
            </DragDropContext>
          </div>
          <div className="form-actions">
            <button type="submit" className="advanced">Save</button>
            <button type="button" onClick={cancelForm} className="advanced">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RenovationProjectsControl;
