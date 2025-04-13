import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RentalCalendar from './RentalCalendar';
const API_URL = 'http://localhost:8000'; // Adjust as needed

const RenovationProjectsControl = () => {
  // State variables
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [newProject, setNewProject] = useState({
    address: '',
    work_type: '',
    materials: '',
    duration: '',
    cost: '',
    photo: '',
    execution_stages: '',
    comment: '',
    start_date: '',
    end_date: ''
  });
  const [editProject, setEditProject] = useState(null);
  const [calendarInfo, setCalendarInfo] = useState(null);

  // Open calendar for a given project.
  const openCalendar = (id, category) => {
    setCalendarInfo({ id, category });
  };

  // Fetch renovation projects from backend.
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/renovation/projects/`);
      setProjects(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching renovation projects:', err);
      setError('Error fetching renovation projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleNewProjectChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/renovation/projects/`, newProject);
      setProjects(prev => [...prev, response.data]);
      setNewProject({
        address: '',
        work_type: '',
        materials: '',
        duration: '',
        cost: '',
        photo: '',
        execution_stages: '',
        comment: '',
        start_date: '',
        end_date: ''
      });
      setError('');
    } catch (err) {
      console.error('Error adding renovation project:', err);
      setError('Error adding renovation project.');
    }
  };

  const startEditing = (project) => {
    setEditProject(project);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditProject(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/renovation/projects/${editProject.id}`, editProject);
      setProjects(prev =>
        prev.map(proj => (proj.id === editProject.id ? response.data : proj))
      );
      setEditProject(null);
      setError('');
    } catch (err) {
      console.error('Error updating renovation project:', err);
      setError('Error updating renovation project.');
    }
  };

  const cancelEdit = () => {
    setEditProject(null);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this renovation project?')) return;
    try {
      await axios.delete(`${API_URL}/renovation/projects/${id}`);
      setProjects(prev => prev.filter(proj => proj.id !== id));
      setError('');
    } catch (err) {
      console.error('Error deleting renovation project:', err);
      setError('Error deleting renovation project.');
    }
  };

  const filteredProjects = projects.filter(proj =>
    proj.address.toLowerCase().includes(filter.toLowerCase()) ||
    proj.work_type.toLowerCase().includes(filter.toLowerCase())
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
      <h2>Renovation Projects Control</h2>
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          placeholder="Filter by address or work type..."
          value={filter}
          onChange={handleFilterChange}
          style={{ padding: '8px', width: '300px' }}
        />
      </div>
      {loading ? (
        <div>Loading renovation projects...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Address</th>
              <th>Work Type</th>
              <th>Materials</th>
              <th>Duration</th>
              <th>Cost</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Comment</th>
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
                      name="address" 
                      value={editProject.address} 
                      onChange={handleEditChange} 
                    />
                  ) : (
                    project.address
                  )}
                </td>
                <td>
                  {editProject && editProject.id === project.id ? (
                    <input 
                      name="work_type" 
                      value={editProject.work_type} 
                      onChange={handleEditChange} 
                    />
                  ) : (
                    project.work_type
                  )}
                </td>
                <td>{project.materials}</td>
                <td>{project.duration}</td>
                <td>{project.cost}</td>
                <td>{project.start_date}</td>
                <td>{project.end_date}</td>
                <td>{project.comment}</td>
                <td>
                  {editProject && editProject.id === project.id ? (
                    <>
                      <button onClick={handleUpdateProject}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openCalendar(project.id, 'Ремонт/Будівництво')}>
                        Calendar
                      </button>
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

      <h3>Add New Renovation Project</h3>
      <form onSubmit={handleAddProject}>
        <div>
          <input 
            type="text"
            name="address"
            placeholder="Address"
            value={newProject.address}
            onChange={handleNewProjectChange}
            required
          />
        </div>
        <div>
          <input 
            type="text"
            name="work_type"
            placeholder="Work Type"
            value={newProject.work_type}
            onChange={handleNewProjectChange}
            required
          />
        </div>
        <div>
          <input 
            type="text"
            name="materials"
            placeholder="Materials"
            value={newProject.materials}
            onChange={handleNewProjectChange}
          />
        </div>
        <div>
          <input 
            type="text"
            name="duration"
            placeholder="Duration"
            value={newProject.duration}
            onChange={handleNewProjectChange}
          />
        </div>
        <div>
          <input 
            type="text"
            name="cost"
            placeholder="Cost"
            value={newProject.cost}
            onChange={handleNewProjectChange}
          />
        </div>
        <div>
          <input 
            type="text"
            name="photo"
            placeholder="Photo URL"
            value={newProject.photo}
            onChange={handleNewProjectChange}
          />
        </div>
        <div>
          <textarea 
            name="execution_stages"
            placeholder="Execution Stages"
            value={newProject.execution_stages}
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

export default RenovationProjectsControl;
