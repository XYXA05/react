import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminMenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formState, setFormState] = useState({
    label: '',
    icon: '',
    route: '',
    order: 0,
    parentId: '', // NEW: parent item id (empty = top-level)
  });

  // Load menu items
  useEffect(() => {
    fetchMenu();
  }, []);

  function fetchMenu() {
    axios
      .get('/api/admin/menu')
      .then(res => setMenuItems(res.data))
      .catch(err => console.error(err));
  }

  function openNew(parentId = '') {
    setEditing(null);
    setFormState({ label: '', icon: '', route: '', order: 0, parentId });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item.id);
    setFormState({
      label: item.label,
      icon: item.icon,
      route: item.route,
      order: item.order,
      parentId: item.parentId || '',
    });
    setShowForm(true);
  }

  function handleDelete(id) {
    if (!window.confirm('Really delete this menu item?')) return;
    axios.delete(`/api/admin/menu/${id}`)
      .then(fetchMenu)
      .catch(err => console.error(err));
  }

  function handleChange(e) {
    let { name, value } = e.target;
    if (name === 'order') value = Number(value);
    setFormState(s => ({ ...s, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...formState };
    // Convert empty string to null on backend
    if (!payload.parentId) delete payload.parentId;

    const req = editing
      ? axios.put(`/api/admin/menu/${editing}`, payload)
      : axios.post('/api/admin/menu', payload);

    req
      .then(() => {
        setShowForm(false);
        fetchMenu();
      })
      .catch(err => console.error(err));
  }

  // Build a tree for display: top-levels then children
  const tree = menuItems
    .filter(item => !item.parentId)
    .sort((a, b) => a.order - b.order)
    .map(parent => ({
      ...parent,
      children: menuItems
        .filter(child => child.parentId === parent.id)
        .sort((a, b) => a.order - b.order),
    }));

  return (
    <div className="admin-menu-manager">
      <h2>🔧 Menu Manager</h2>
      <button className="btn primary" onClick={() => openNew()}>+ New Top-Level</button>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h3>{editing ? 'Edit Item' : 'Create New Item'}</h3>

          <label>
            Parent (optional):<br/>
            <select name="parentId" value={formState.parentId} onChange={handleChange}>
              <option value="">— Top Level —</option>
              {menuItems
                .filter(i => !i.parentId)
                .sort((a, b) => a.order - b.order)
                .map(i => (
                  <option key={i.id} value={i.id}>
                    {i.icon} {i.label}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Label:<br/>
            <input
              name="label"
              value={formState.label}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Icon (emoji or CSS class):<br/>
            <input
              name="icon"
              value={formState.icon}
              onChange={handleChange}
            />
          </label>
          <label>
            Route Key:<br/>
            <input
              name="route"
              value={formState.route}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Order:<br/>
            <input
              name="order"
              type="number"
              value={formState.order}
              onChange={handleChange}
              required
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn primary">
              {editing ? 'Save Changes' : 'Create'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Icon</th>
            <th>Label</th>
            <th>Route</th>
            <th>Parent</th>
            <th style={{ width: '160px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tree.map(parent => (
            <React.Fragment key={parent.id}>
              <tr className="parent-row">
                <td>{parent.order}</td>
                <td>{parent.icon}</td>
                <td><strong>{parent.label}</strong></td>
                <td>{parent.route}</td>
                <td>—</td>
                <td>
                  <button className="btn small" onClick={() => openEdit(parent)}>Edit</button>
                  <button className="btn small destructive" onClick={() => handleDelete(parent.id)}>Del</button>
                  <button className="btn small" onClick={() => openNew(parent.id)}>+Sub</button>
                </td>
              </tr>
              {parent.children.map(child => (
                <tr key={child.id} className="child-row">
                  <td>{child.order}</td>
                  <td>{child.icon}</td>
                  <td>↳ {child.label}</td>
                  <td>{child.route}</td>
                  <td>{parent.label}</td>
                  <td>
                    <button className="btn small" onClick={() => openEdit(child)}>Edit</button>
                    <button className="btn small destructive" onClick={() => handleDelete(child.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
