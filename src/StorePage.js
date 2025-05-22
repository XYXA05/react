// src/StorePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export default function StorePage({ token, onBack }) {
  const emptyForm = {
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
  };

  const [apartments, setApartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const size = 10;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // attach auth header
  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  // fetch list
  useEffect(() => {
    fetchApartments();
  }, [page]);

  async function fetchApartments() {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API_URL}/apartments`, {
        params: { page, size },
      });
      setApartments(data);
    } catch (e) {
      console.error(e);
      setError('Could not load apartments.');
    }
    setLoading(false);
  }

  // create or update
  async function saveApartment(e) {
    e.preventDefault();
    try {
      if (editingId) {
        // update
        await axios.put(`${API_URL}/apartments/${editingId}`, form);
      } else {
        // create
        await axios.post(`${API_URL}/apartments`, form);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchApartments();
    } catch (e) {
      console.error(e);
      setError('Save failed.');
    }
  }

  // delete
  async function deleteApartment(id) {
    if (!window.confirm('Delete this apartment?')) return;
    try {
      await axios.delete(`${API_URL}/apartments/${id}`);
      fetchApartments();
    } catch {
      setError('Delete failed.');
    }
  }

  // load into form for editing
  function editApartment(apt) {
    setForm({
      unique_id: apt.unique_id,
      type_deal: apt.type_deal,
      type_object: apt.type_object,
      title: apt.title,
      price: apt.price,
      location: apt.location,
      description: apt.description || '',
      features: apt.features || '',
      owner: apt.owner || '',
      phone: apt.phone || '',
    });
    setEditingId(apt.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div style={{ padding: 20 }}>
      <header style={{ marginBottom: 20 }}>
        <button onClick={onBack}>← Back</button>
        <h2>Manage Apartments</h2>
      </header>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Form */}
      <form onSubmit={saveApartment} style={{ marginBottom: 20 }}>
        <h3>{editingId ? 'Edit Apartment' : 'New Apartment'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {['unique_id','type_deal','type_object','title','location','owner','phone'].map(key => (
            <input
              key={key}
              placeholder={key.replace('_',' ')}
              value={form[key]}
              onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
              required
            />
          ))}
          <input
            placeholder="price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={e => setForm(f => ({...f, price: e.target.value}))}
            required
          />
          <textarea
            placeholder="description"
            value={form.description}
            onChange={e => setForm(f => ({...f, description: e.target.value}))}
          />
          <textarea
            placeholder="features"
            value={form.features}
            onChange={e => setForm(f => ({...f, features: e.target.value}))}
          />
        </div>
        <button type="submit" style={{ marginTop: 10 }}>
          {editingId ? 'Update' : 'Create'}
        </button>{' '}
        {editingId && (
          <button
            type="button"
            onClick={() => { setForm(emptyForm); setEditingId(null); }}
            style={{ marginTop: 10 }}
          >Cancel</button>
        )}
      </form>

      {/* List */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {apartments.map(apt => (
              <div key={apt.id} style={{ border: '1px solid #ccc', padding: 10 }}>
                <h4>{apt.title}</h4>
                <p><b>{apt.price} грн</b> — {apt.type_object}/{apt.type_deal}</p>
                <p>{apt.location}</p>
                <button onClick={() => editApartment(apt)}>Edit</button>{' '}
                <button onClick={() => deleteApartment(apt.id)}>Delete</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>{' '}
            <span>Page {page}</span>{' '}
            <button disabled={apartments.length<size} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
