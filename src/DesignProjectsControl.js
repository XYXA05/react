import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RentalCalendar from './RentalCalendar'; // Ensure this component is available
const API_URL = 'http://localhost:8000'; // Change this if necessary

const DesignProjectsControl = () => {
  // State to hold project list, loading, and error messages
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // State for filtering by design type or style
  const [filter, setFilter] = useState('');
  // State for new project form
  const [newProject, setNewProject] = useState({
    design_type: '',
    style: '',
    area: '',
    color_scheme: '',
    budget: '',
    sketches: '',
    features: '',
    comment: '',
    start_date: '',
    end_date: ''
  });
  // State for project being edited
  const [editProject, setEditProject] = useState(null);
  // State to control whether RentalCalendar is shown for a given project
  const [calendarInfo, setCalendarInfo] = useState(null);

  // Opens the calendar view; sets calendarInfo with project id and fixed category "Дизайн"
  const openCalendar = (id, category) => {
    setCalendarInfo({ id, category });
  };

  // Fetch all design projects from the backend
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/design/projects/`);
      setProjects(response.data);
      setError('');
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError('Error fetching projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handler for new project input changes
  const handleNewProjectChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handler for filter input changes
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Handler to add a new project
  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/design/projects/`, newProject);
      setProjects(prev => [...prev, response.data]);
      // Clear the new project form
      setNewProject({
        design_type: '',
        style: '',
        area: '',
        color_scheme: '',
        budget: '',
        sketches: '',
        features: '',
        comment: '',
        start_date: '',
        end_date: ''
      });
      setError('');
    } catch (err) {
      console.error("Error adding project:", err);
      setError('Error adding project.');
    }
  };

  // Set project for editing
  const startEditing = (project) => {
    setEditProject(project);
  };

  // Handler for changes when editing
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update project via PUT
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/design/projects/${editProject.id}`, editProject);
      setProjects(prev =>
        prev.map(proj => (proj.id === editProject.id ? response.data : proj))
      );
      setEditProject(null);
      setError('');
    } catch (err) {
      console.error("Error updating project:", err);
      setError('Error updating project.');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditProject(null);
  };

  // Delete a project
  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await axios.delete(`${API_URL}/design/projects/${id}`);
      setProjects(prev => prev.filter(proj => proj.id !== id));
      setError('');
    } catch (err) {
      console.error("Error deleting project:", err);
      setError('Error deleting project.');
    }
  };

  // Filter projects based on design_type or style
  const filteredProjects = projects.filter(project =>
    project.design_type.toLowerCase().includes(filter.toLowerCase()) ||
    project.style.toLowerCase().includes(filter.toLowerCase())
  );

  // If calendarInfo exists, render RentalCalendar with the proper props.
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
      <h2>Design Projects Control</h2>
      {/* Filter Input */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Filter projects by design type or style..." 
          value={filter} 
          onChange={handleFilterChange}
          style={{ padding: '8px', width: '300px' }}
        />
      </div>
      {/* List of Projects */}
      {loading ? (
        <div>Loading projects...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Design Type</th>
              <th>Style</th>
              <th>Area</th>
              <th>Budget</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map(project => (
              <tr key={project.id}>
                <td>{project.id}</td>
                <td>
                  {editProject && editProject.id === project.id ? (
                    <input 
                      name="design_type"
                      value={editProject.design_type}
                      onChange={handleEditChange}
                    />
                  ) : (
                    project.design_type
                  )}
                </td>
                <td>
                  {editProject && editProject.id === project.id ? (
                    <input 
                      name="style"
                      value={editProject.style}
                      onChange={handleEditChange}
                    />
                  ) : (
                    project.style
                  )}
                </td>
                <td>{project.area}</td>
                <td>{project.budget}</td>
                <td>{project.start_date}</td>
                <td>{project.end_date}</td>
                <td>
                  {editProject && editProject.id === project.id ? (
                    <>
                      <button onClick={handleUpdateProject}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openCalendar(project.id, 'Дизайн')}>Calendar</button>
                      <button onClick={() => startEditing(project)}>Edit</button>
                      <button onClick={() => handleDeleteProject(project.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Form to Add New Project */}
      <h3>Add New Project</h3>
      <form onSubmit={handleAddProject}>
        <div>
          <input
            type="text"
            name="design_type"
            placeholder="Design Type"
            value={newProject.design_type}
            onChange={handleNewProjectChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="style"
            placeholder="Style"
            value={newProject.style}
            onChange={handleNewProjectChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="area"
            placeholder="Area"
            value={newProject.area}
            onChange={handleNewProjectChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="color_scheme"
            placeholder="Color Scheme"
            value={newProject.color_scheme}
            onChange={handleNewProjectChange}
          />
        </div>
        <div>
          <input
            type="text"
            name="budget"
            placeholder="Budget"
            value={newProject.budget}
            onChange={handleNewProjectChange}
          />
        </div>
        <div>
          <input
            type="text"
            name="sketches"
            placeholder="Sketches (file path)"
            value={newProject.sketches}
            onChange={handleNewProjectChange}
          />
        </div>
        <div>
          <textarea
            name="features"
            placeholder="Features"
            value={newProject.features}
            onChange={handleNewProjectChange}
          />
        </div>
        <div>
          <textarea
            name="comment"
            placeholder="Comment"
            value={newProject.comment}
            onChange={handleNewProjectChange}
          />
        </div>
        <div>
          <input
            type="date"
            name="start_date"
            value={newProject.start_date}
            onChange={handleNewProjectChange}
            required
          />
        </div>
        <div>
          <input
            type="date"
            name="end_date"
            value={newProject.end_date}
            onChange={handleNewProjectChange}
            required
          />
        </div>
        <button type="submit">Add Project</button>
      </form>
    </div>
  );
};

export default DesignProjectsControl;
