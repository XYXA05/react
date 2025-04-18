import React, { useEffect, useState } from 'react';
import axios from 'axios';

// ─── Static translations ────────────────────────────────────────────────────────
const DEAL_TYPE_TRANSLATIONS = {
  'posutochno-pochasovo': { uk: 'Погодинна/Подобова оренда' },
  'kvartiry':           { uk: 'Квартири' },
  'doma':               { uk: 'Будинки' },
};

const PROPERTY_TYPE_TRANSLATIONS = {
  'posutochno-pochasovo-doma':     { uk: 'Подобова оренда будинку' },
  'posutochno-pochasovo-kvartiry': { uk: 'Подобова оренда квартири' },
  'dolgosrochnaya-arenda-kvartir': { uk: 'Довгострокова оренда квартири' },
  'arenda-domov':                  { uk: 'Оренда будинків' },
  'prodazha-kvartir':              { uk: 'Продаж квартир' },
  'prodazha-domov':                { uk: 'Продаж будинків' },
};

// Flatten keys for use in selects
const dealTypes   = Object.keys(DEAL_TYPE_TRANSLATIONS);
const objectTypes = Object.keys(PROPERTY_TYPE_TRANSLATIONS);

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminUsersPanel({ token, onBack }) {
  const [admins,   setAdmins]   = useState([]);
  const [leaders,  setLeaders]  = useState([]);
  const [realtors, setRealtors]= useState([]);
  const [error,    setError]    = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  // fetch only users
  useEffect(() => {
    axios.get('http://localhost:8000/admins',   { headers })
      .then(r => setAdmins(r.data))
      .catch(() => setError('Failed loading admins'));

    axios.get('http://localhost:8000/team_leaders', { headers })
      .then(r => setLeaders(r.data))
      .catch(() => setError('Failed loading leaders'));

    axios.get('http://localhost:8000/realtors', { headers })
      .then(r => setRealtors(r.data))
      .catch(() => setError('Failed loading realtors'));
  }, [token]);

  const saveUser = (user, role) => {
    axios.patch(
      `http://localhost:8000/admin/${role}s/${user.id}`,
      user,
      { headers }
    )
    .then(() => alert('✅ Saved'))
    .catch(() => alert('❌ Save failed'));
  };

  // reusable multi‑select with Ukrainian labels
  const MultiSelect = ({ options, selected, onChange }) => (
    <select
      multiple
      size={Math.min(options.length, 5)}
      value={selected || []}
      onChange={e => {
        const vals = Array.from(e.target.selectedOptions).map(o => o.value);
        onChange(vals);
      }}
    >
      {options.map(o => (
        <option key={o} value={o}>
          {PROPERTY_TYPE_TRANSLATIONS[o]
            ? PROPERTY_TYPE_TRANSLATIONS[o].uk
            : DEAL_TYPE_TRANSLATIONS[o].uk}
        </option>
      ))}
    </select>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h3>User & Role Management</h3>
      <button onClick={onBack}>← Back</button>
      {error && <p style={{ color:'red' }}>{error}</p>}

      {/* ── Admins ───────────────────────────── */}
      <section>
        <h4>Admins</h4>
        <table border="1" cellPadding="4">
          <thead>
            <tr><th>ID</th><th>Username</th><th>Name</th><th>Chat ID</th><th>Save</th></tr>
          </thead>
          <tbody>
            {admins.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>
                  <input
                    value={u.name||''}
                    onChange={e=>{u.name=e.target.value; setAdmins([...admins]);}}
                  />
                </td>
                <td>
                  <input
                    value={u.chat_id||''}
                    onChange={e=>{u.chat_id=e.target.value; setAdmins([...admins]);}}
                  />
                </td>
                <td><button onClick={()=>saveUser(u,'admin')}>Save</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Team Leaders ─────────────────────── */}
      <section>
        <h4>Team Leaders</h4>
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>Name</th><th>Chat ID</th>
              <th>Admin</th><th>Objects</th><th>Deals</th><th>Commission %</th><th>Save</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>
                  <input
                    value={u.name||''}
                    onChange={e=>{u.name=e.target.value; setLeaders([...leaders]);}}
                  />
                </td>
                <td>
                  <input
                    value={u.chat_id||''}
                    onChange={e=>{u.chat_id=e.target.value; setLeaders([...leaders]);}}
                  />
                </td>
                <td>
                  <select
                    value={u.admin_id||''}
                    onChange={e=>{
                      u.admin_id = e.target.value ? +e.target.value : null;
                      setLeaders([...leaders]);
                    }}
                  >
                    <option value="">— none —</option>
                    {admins.map(a=>(
                      <option key={a.id} value={a.id}>{a.username}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <MultiSelect
                    options={objectTypes}
                    selected={u.allowed_type_object}
                    onChange={vals=>{u.allowed_type_object=vals; setLeaders([...leaders]);}}
                  />
                </td>
                <td>
                  <MultiSelect
                    options={dealTypes}
                    selected={u.allowed_type_deal}
                    onChange={vals=>{u.allowed_type_deal=vals; setLeaders([...leaders]);}}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={u.commission_percent||0}
                    onChange={e=>{u.commission_percent=+e.target.value; setLeaders([...leaders]);}}
                  />
                </td>
                <td><button onClick={()=>saveUser(u,'team_leader')}>Save</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Realtors ─────────────────────────── */}
      <section>
        <h4>Realtors</h4>
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>Name</th><th>Chat ID</th>
              <th>Team Lead</th><th>Objects</th><th>Deals</th><th>Commission %</th><th>Save</th>
            </tr>
          </thead>
          <tbody>
            {realtors.map(u=>(
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>
                  <input
                    value={u.name||''}
                    onChange={e=>{u.name=e.target.value; setRealtors([...realtors]);}}
                  />
                </td>
                <td>
                  <input
                    value={u.chat_id||''}
                    onChange={e=>{u.chat_id=e.target.value; setRealtors([...realtors]);}}
                  />
                </td>
                <td>
                  <select
                    value={u.team_leader_id||''}
                    onChange={e=>{
                      u.team_leader_id = e.target.value ? +e.target.value : null;
                      setRealtors([...realtors]);
                    }}
                  >
                    <option value="">— none —</option>
                    {leaders.map(l=>(
                      <option key={l.id} value={l.id}>{l.username}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <MultiSelect
                    options={objectTypes}
                    selected={u.allowed_type_object}
                    onChange={vals=>{u.allowed_type_object=vals; setRealtors([...realtors]);}}
                  />
                </td>
                <td>
                  <MultiSelect
                    options={dealTypes}
                    selected={u.allowed_type_deal}
                    onChange={vals=>{u.allowed_type_deal=vals; setRealtors([...realtors]);}}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={u.commission_percent||0}
                    onChange={e=>{u.commission_percent=+e.target.value; setRealtors([...realtors]);}}
                  />
                </td>
                <td><button onClick={()=>saveUser(u,'realtor')}>Save</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
