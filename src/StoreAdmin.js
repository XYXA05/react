import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CalendarView.css';
import RentalCalendar from './RentalCalendar'; // Import RentalCalendar component
import { BASE_URL } from './ApartmentService';  // Ensure BASE_URL is properly set

const API_URL = 'http://localhost:8000'; // Adjust if needed

const StoreAdmin = () => {
  // State for list of store apartments, loading, and error
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // State for filtering (by title, deal type, location)
  const [filter, setFilter] = useState('');
  // State for new apartment form
  const [newApartment, setNewApartment] = useState({
    unique_id: '',
    type_deal: '',
    type_object: '',
    title: '',
    price: '',
    location: '',
    description: '',
    features: '',
    owner: '',
    phone: ''
  });
  // State for editing an apartment
  const [editApartment, setEditApartment] = useState(null);
  // State to store calendar info (object with id and category) when admin wants to view a calendar
  const [calendarInfo, setCalendarInfo] = useState(null);

  // Function to open calendar by setting calendarInfo
  const openCalendar = (id, category) => {
    setCalendarInfo({ id, category });
  };

  // Fetch store apartments from backend
  const fetchApartments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/store/apartments/`);
      setApartments(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching store apartments:', err);
      setError('Error fetching store apartments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, []);

  // Handle changes for new apartment form
  const handleNewApartmentChange = (e) => {
    const { name, value } = e.target;
    setNewApartment(prev => ({ ...prev, [name]: value }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Add a new apartment (POST)
  const handleAddApartment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/store/apartments/`, newApartment);
      setApartments(prev => [...prev, response.data]);
      // Reset the new apartment form
      setNewApartment({
        unique_id: '',
        type_deal: '',
        type_object: '',
        title: '',
        price: '',
        location: '',
        description: '',
        features: '',
        owner: '',
        phone: ''
      });
      setError('');
    } catch (err) {
      console.error('Error adding store apartment:', err);
      setError('Error adding store apartment.');
    }
  };

  // Start editing an apartment
  const startEditing = (apt) => {
    setEditApartment(apt);
  };

  // Handle editing form change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditApartment(prev => ({ ...prev, [name]: value }));
  };

  // Update an apartment (PUT)
  const handleUpdateApartment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/store/apartments/${editApartment.id}`, editApartment);
      setApartments(prev => prev.map(apt => (apt.id === editApartment.id ? response.data : apt)));
      setEditApartment(null);
      setError('');
    } catch (err) {
      console.error('Error updating store apartment:', err);
      setError('Error updating store apartment.');
    }
  };

  // Cancel editing mode
  const cancelEdit = () => {
    setEditApartment(null);
  };

  // Delete an apartment (DELETE)
  const handleDeleteApartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this apartment?')) return;
    try {
      await axios.delete(`${API_URL}/store/apartments/${id}`);
      setApartments(prev => prev.filter(apt => apt.id !== id));
      setError('');
    } catch (err) {
      console.error('Error deleting store apartment:', err);
      setError('Error deleting store apartment.');
    }
  };

  // Filter apartments by title, deal type, or location
  const filteredApartments = apartments.filter(apt =>
    apt.title.toLowerCase().includes(filter.toLowerCase()) ||
    apt.type_deal.toLowerCase().includes(filter.toLowerCase()) ||
    apt.location.toLowerCase().includes(filter.toLowerCase())
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
      <h2>Інтернет-магазин Адмінка</h2>
      
      {/* Filter Input */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          placeholder="Filter by title, deal type or location..."
          value={filter}
          onChange={handleFilterChange}
          style={{ padding: '8px', width: '300px' }}
        />
      </div>

      {/* Store Apartments List */}
      {loading ? (
        <div>Loading store apartments...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Unique ID</th>
              <th>Deal Type</th>
              <th>Object Type</th>
              <th>Title</th>
              <th>Price</th>
              <th>Location</th>
              <th>Description</th>
              <th>Features</th>
              <th>Owner</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApartments.map((apt) => (
              <tr key={apt.id}>
                <td>{apt.id}</td>
                <td>{apt.unique_id}</td>
                <td>{apt.type_deal}</td>
                <td>{apt.type_object}</td>
                <td>
                  {editApartment && editApartment.id === apt.id ? (
                    <input 
                      name="title"
                      value={editApartment.title}
                      onChange={handleEditChange}
                    />
                  ) : (
                    apt.title
                  )}
                </td>
                <td>{apt.price}</td>
                <td>{apt.location}</td>
                <td>{apt.description}</td>
                <td>{apt.features}</td>
                <td>{apt.owner}</td>
                <td>{apt.phone}</td>
                <td>
                  {editApartment && editApartment.id === apt.id ? (
                    <>
                      <button onClick={handleUpdateApartment}>Save</button>
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(apt)}>Edit</button>
                      <button onClick={() => handleDeleteApartment(apt.id)}>Delete</button>
                      <button onClick={() => openCalendar(apt.id, 'Інтернет-магазин')}>
                        Calendar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Form to add a new store apartment */}
      <h3>Add New Apartment</h3>
      <form onSubmit={handleAddApartment}>
        <div>
          <input
            type="text"
            name="unique_id"
            placeholder="Unique ID"
            value={newApartment.unique_id}
            onChange={handleNewApartmentChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="type_deal"
            placeholder="Deal Type"
            value={newApartment.type_deal}
            onChange={handleNewApartmentChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="type_object"
            placeholder="Object Type"
            value={newApartment.type_object}
            onChange={handleNewApartmentChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={newApartment.title}
            onChange={handleNewApartmentChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="price"
            placeholder="Price"
            value={newApartment.price}
            onChange={handleNewApartmentChange}
            required
          />
        </div>
        <div>
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={newApartment.location}
            onChange={handleNewApartmentChange}
            required
          />
        </div>
        <div>
          <textarea
            name="description"
            placeholder="Description"
            value={newApartment.description}
            onChange={handleNewApartmentChange}
          />
        </div>
        <div>
          <textarea
            name="features"
            placeholder="Features"
            value={newApartment.features}
            onChange={handleNewApartmentChange}
          />
        </div>
        <div>
          <input
            type="text"
            name="owner"
            placeholder="Owner"
            value={newApartment.owner}
            onChange={handleNewApartmentChange}
          />
        </div>
        <div>
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={newApartment.phone}
            onChange={handleNewApartmentChange}
          />
        </div>
        <button type="submit">Add Apartment</button>
      </form>
    </div>
  );
};

export default StoreAdmin;
