// src/OrdersList.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_URL = 'https://79cf-217-31-72-114.ngrok-free.app';
const token = localStorage.getItem('ACCESS_TOKEN');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const ENDPOINTS = {
  General:    { list: '/orders',               create: '/orders',               update: '/orders',               delete: '/orders'              },
  Cleaning:   { list: '/cleaning/orders',      create: '/cleaning/orders',      update: '/cleaning/orders',      delete: '/cleaning/orders'     },
  Store:      { list: '/store/orderss',        create: '/store/orders',         update: '/store/orders',         delete: '/store/orderss'       },
  Design:     { list: '/design/projects',      create: '/design/projects',      update: '/design/projects',      delete: '/design/projects'     },
  Renovation: { list: '/renovation/projects',  create: '/renovation/projects',  update: '/renovation/projects',  delete: '/renovation/projects' },
};

export default function OrdersList() {
  const [items, setItems]           = useState([]);
  const [error, setError]           = useState('');
  const [newOrder, setNewOrder]     = useState({ category: 'General', name: '', phone: '' });
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterSearch, setFilterSearch]     = useState('');

  // fetch all five lists:
  const fetchAll = async () => {
    try {
      const promises = Object.values(ENDPOINTS).map(ep =>
        axios.get(`${API_URL}${ep.list}`)
             .then(res => res.data)
             .catch(() => [])
      );
      const [gen, clean, store, design, ren] = await Promise.all(promises);

      const tagged = [
        ...gen   .map(o => ({ ...o, __category: 'General'   })),
        ...clean .map(o => ({ ...o, __category: 'Cleaning'  })),
        ...store .map(o => ({ ...o, __category: 'Store'     })),
        ...design.map(o => ({ ...o, __category: 'Design'    })),
        ...ren   .map(o => ({ ...o, __category: 'Renovation'})),
      ];

      tagged.sort((a,b)=>{
        const da = new Date(a.created_at||a.execution_date||a.start_date||0);
        const db = new Date(b.created_at||b.execution_date||b.start_date||0);
        return db - da;
      });

      setItems(tagged);
    } catch(err) {
      console.error(err);
      setError('Failed to load orders.');
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // CREATE
  const handleCreate = async e => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}${ENDPOINTS[newOrder.category].create}`,
        { name: newOrder.name, phone: newOrder.phone }
      );
      setNewOrder({ ...newOrder, name:'', phone:'' });
      fetchAll();
    } catch {
      alert('Create failed');
    }
  };

  // DELETE
  const handleDelete = async item => {
    if (!window.confirm(`Delete ${item.__category} #${item.id}?`)) return;
    try {
      await axios.delete(
        `${API_URL}${ENDPOINTS[item.__category].delete}/${item.id}`
      );
      fetchAll();
    } catch {
      alert('Delete failed');
    }
  };

  // EDIT (status)
  const handleEdit = async item => {
    const current = item.ed_status || item.status || '';
    const next    = prompt('New status:', current);
    if (!next) return;
    try {
      await axios.put(
        `${API_URL}${ENDPOINTS[item.__category].update}/${item.id}`,
        { new_status: next }
      );
      fetchAll();
    } catch {
      alert('Update failed');
    }
  };

  // apply filters to items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // category filter
      if (filterCategory !== 'All' && item.__category !== filterCategory) {
        return false;
      }
      // status filter
      const statusVal = (item.ed_status || item.status || '').toLowerCase();
      if (filterStatus && !statusVal.includes(filterStatus.toLowerCase())) {
        return false;
      }
      // search filter against name, phone, or details
      const term = filterSearch.toLowerCase();
      if (term) {
        const name  = (item.name || item.unique_id || '').toLowerCase();
        const phone = (item.phone || '').toLowerCase();
        let details = '';
        switch(item.__category) {
          case 'General':    details = `${item.ed_status}`; break;
          case 'Cleaning':   details = `${item.address} ${item.cleaning_type}`; break;
          case 'Store':      details = `${item.region} ${item.city}`; break;
          case 'Design':     details = `${item.design_type} ${item.style}`; break;
          case 'Renovation': details = `${item.address} ${item.work_type}`; break;
        }
        details = details.toLowerCase();
        if (!name.includes(term) && !phone.includes(term) && !details.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [items, filterCategory, filterStatus, filterSearch]);

  if (error) return <p style={{ color:'red' }}>{error}</p>;
  if (!items.length) return <p>Loading orders…</p>;

  return (
    <div className="unified-orders-list">
      {/* ─── Create Form ──────────────────────────────────────────────────── */}
      <h2>Add New Order</h2>
      <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
        <select
          value={newOrder.category}
          onChange={e=>setNewOrder({ ...newOrder, category: e.target.value })}
        >
          {Object.keys(ENDPOINTS).map(cat =>
            <option key={cat} value={cat}>{cat}</option>
          )}
        </select>{' '}
        <input
          required placeholder="Name"
          value={newOrder.name}
          onChange={e=>setNewOrder({ ...newOrder, name: e.target.value })}
        />{' '}
        <input
          required placeholder="Phone"
          value={newOrder.phone}
          onChange={e=>setNewOrder({ ...newOrder, phone: e.target.value })}
        />{' '}
        <button type="submit">Create</button>
      </form>

      {/* ─── Filters ───────────────────────────────────────────────────────── */}
      <h2>Filters</h2>
      <div style={{ marginBottom: 20 }}>
        <label>
          Category:{' '}
          <select
            value={filterCategory}
            onChange={e=>setFilterCategory(e.target.value)}
          >
            <option>All</option>
            {Object.keys(ENDPOINTS).map(cat =>
              <option key={cat}>{cat}</option>
            )}
          </select>
        </label>{' '}
        <label>
          Status:{' '}
          <input
            placeholder="e.g. Pending"
            value={filterStatus}
            onChange={e=>setFilterStatus(e.target.value)}
          />
        </label>{' '}
        <label>
          Search:{' '}
          <input
            placeholder="Name, phone, details…"
            value={filterSearch}
            onChange={e=>setFilterSearch(e.target.value)}
          />
        </label>
      </div>

      {/* ─── Orders Table ─────────────────────────────────────────────────── */}
      <h2>All Orders</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Cat</th><th>ID</th><th>Client</th><th>Phone</th>
            <th>Details</th><th>Created</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map(item => {
            const cat = item.__category;
            const name  = item.name ?? item.unique_id ?? '—';
            const phone = item.phone ?? '—';
            const created = new Date(
              item.created_at || item.execution_date || item.start_date || Date.now()
            ).toLocaleString();
            let details = '';
            switch(cat) {
              case 'General':    details = `Status: ${item.ed_status}`; break;
              case 'Cleaning':   details = `${item.address} (${item.cleaning_type})`; break;
              case 'Store':      details = `${item.region}, ${item.city}`; break;
              case 'Design':     details = `${item.design_type} / ${item.style}`; break;
              case 'Renovation': details = `${item.address} / ${item.work_type}`; break;
            }

            return (
              <tr key={`${cat}-${item.id}`}>
                <td>{cat}</td>
                <td>{item.id}</td>
                <td>{name}</td>
                <td>{phone}</td>
                <td>{details}</td>
                <td>{created}</td>
                <td>
                  <button onClick={()=>handleEdit(item)}>Edit</button>{' '}
                  <button onClick={()=>handleDelete(item)}>Delete</button>
                </td>
              </tr>
            );
          })}
          {filteredItems.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign:'center' }}>
                No orders match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
