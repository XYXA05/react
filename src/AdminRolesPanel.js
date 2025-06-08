import React, { useEffect, useState } from 'react'
import axios from 'axios'

// ─── Translations ──────────────────────────────────────────────────────────────
const DEAL_TYPE_TRANSLATIONS = {
  'posutochno-pochasovo': { uk: 'Погодинна/Подобова оренда' },
  'kvartiry':           { uk: 'Квартири' },
  'doma':               { uk: 'Будинки' },
}

const PROPERTY_TYPE_TRANSLATIONS = {
  'posutochno-pochasovo-doma':     { uk: 'Подобова оренда будинку' },
  'posutochno-pochasovo-kvartiry': { uk: 'Подобова оренда квартири' },
  'dolgosrochnaya-arenda-kvartir': { uk: 'Довгострокова оренда квартири' },
  'arenda-domov':                  { uk: 'Оренда будинків' },
  'prodazha-kvartir':              { uk: 'Продаж квартир' },
  'prodazha-domov':                { uk: 'Продаж будинків' },
}

const dealTypes   = Object.keys(DEAL_TYPE_TRANSLATIONS)
const objectTypes = Object.keys(PROPERTY_TYPE_TRANSLATIONS)

export default function AdminUsersPanel({ token, onBack }) {
  const [admins,   setAdmins]    = useState([])
  const [leaders,  setLeaders]   = useState([])
  const [realtors, setRealtors]  = useState([])
  const [error,    setError]     = useState('')

  // We’ll pass this same header into EVERY request:
  const headers = { Authorization: `Bearer ${token}` }

  // ─── fetch all three lists on mount ─────────────────────────────────────────────
  useEffect(() => {
    // 1) GET /admins
    axios.get('http://localhost:8000/admins', { headers })
      .then(r => setAdmins(r.data))
      .catch(() => setError('Failed loading admins'))

    // 2) GET /team_leaders
    axios.get('http://localhost:8000/team_leaders', { headers })
      .then(r => setLeaders(r.data))
      .catch(() => setError('Failed loading leaders'))

    // 3) GET /realtors
    axios.get('http://localhost:8000/realtors', { headers })
      .then(r => setRealtors(r.data))
      .catch(() => setError('Failed loading realtors'))
  }, [token])


  // ─── pick the correct PATCH path for each role ─────────────────────────────────
  const saveUser = (u, role) => {
    // If you pass role = 'admin', use /admins/{id}
    // If role = 'team_leader', use /team_leaders/{id}
    // If role = 'realtor', use /realtors/{id}
    const base =
      role === 'admin'        ? 'admins' :
      role === 'team_leader'  ? 'team_leaders' :
      /* else */               'realtors'

    axios.patch(
      `http://localhost:8000/${base}/${u.id}`,
      u,
      { headers }
    )
    .then(() => alert('✅ Saved'))
    .catch(() => alert('❌ Save failed: maybe your token expired?'))
  }


  // ─── A simple multi-select for “allowed_type_object” etc ────────────────────────
  const MultiSelect = ({ options, selected, onChange }) => {
    const valueArray = Array.isArray(selected) ? selected : []

    return (
      <select
        multiple
        size={Math.min(options.length, 5)}
        value={valueArray}
        onChange={e => {
          const vals = Array.from(e.target.selectedOptions).map(o => o.value)
          onChange(vals)
        }}
      >
        {options.map(o => (
          <option key={o} value={o}>
            {(PROPERTY_TYPE_TRANSLATIONS[o] || DEAL_TYPE_TRANSLATIONS[o]).uk}
          </option>
        ))}
      </select>
    )
  }


  return (
    <div style={{ padding: 20 }}>
      <h3>User & Role Management</h3>
      <button onClick={onBack}>← Back</button>
      {error && <p style={{ color:'red' }}>{error}</p>}


      {/* ── Admins ─────────────────────────────────────────────────────────────── */}
      <section>
        <h4>Admins</h4>
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>New Password</th><th>Name</th><th>Chat ID</th><th>Save</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  <input
                    value={u.username || ''}
                    onChange={e => { u.username = e.target.value; setAdmins([...admins]) }}
                    placeholder="username"
                  />
                </td>
                <td>
                  {/* We never show the hash; leave password blank unless user types */}
                  <input
                    type="password"
                    placeholder="••••••"
                    value={''}
                    onChange={e => { u.password = e.target.value; setAdmins([...admins]) }}
                  />
                </td>
                <td>
                  <input
                    value={u.name || ''}
                    onChange={e => { u.name = e.target.value; setAdmins([...admins]) }}
                  />
                </td>
                <td>
                  <input
                    value={u.chat_id || ''}
                    onChange={e => { u.chat_id = e.target.value; setAdmins([...admins]) }}
                  />
                </td>
                <td>
                  <button onClick={() => saveUser(u, 'admin')}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>


      {/* ── Team Leaders ───────────────────────────────────────────────────────── */}
      <section>
        <h4>Team Leaders</h4>
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>New Password</th><th>Name</th><th>Chat ID</th>
              <th>Admin</th><th>Objects</th><th>Deals</th><th>Commission %</th><th>Save</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  <input
                    value={u.username || ''}
                    onChange={e => { u.username = e.target.value; setLeaders([...leaders]) }}
                    placeholder="username"
                  />
                </td>
                <td>
                  <input
                    type="password"
                    placeholder="••••••"
                    value={''}
                    onChange={e => { u.password = e.target.value; setLeaders([...leaders]) }}
                  />
                </td>
                <td>
                  <input
                    value={u.name || ''}
                    onChange={e => { u.name = e.target.value; setLeaders([...leaders]) }}
                  />
                </td>
                <td>
                  <input
                    value={u.chat_id || ''}
                    onChange={e => { u.chat_id = e.target.value; setLeaders([...leaders]) }}
                  />
                </td>
                <td>
                  <select
                    value={u.admin_id || ''}
                    onChange={e => {
                      u.admin_id = e.target.value ? +e.target.value : null
                      setLeaders([...leaders])
                    }}
                  >
                    <option value="">— none —</option>
                    {admins.map(a => (
                      <option key={a.id} value={a.id}>{a.username}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <MultiSelect
                    options={objectTypes}
                    selected={u.allowed_type_object}
                    onChange={vals => { u.allowed_type_object = vals; setLeaders([...leaders]) }}
                  />
                </td>
                <td>
                  <MultiSelect
                    options={dealTypes}
                    selected={u.allowed_type_deal}
                    onChange={vals => { u.allowed_type_deal = vals; setLeaders([...leaders]) }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={u.commission_percent || ''}
                    onChange={e => { u.commission_percent = +e.target.value; setLeaders([...leaders]) }}
                    placeholder="%"
                  />
                </td>
                <td>
                  <button onClick={() => saveUser(u, 'team_leader')}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>


      {/* ── Realtors ────────────────────────────────────────────────────────────── */}
      <section>
        <h4>Realtors</h4>
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>New Password</th><th>Name</th><th>Chat ID</th>
              <th>Team Lead</th><th>Objects</th><th>Deals</th><th>Commission %</th><th>Save</th>
            </tr>
          </thead>
          <tbody>
            {realtors.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  <input
                    value={u.username || ''}
                    onChange={e => { u.username = e.target.value; setRealtors([...realtors]) }}
                    placeholder="username"
                  />
                </td>
                <td>
                  <input
                    type="password"
                    placeholder="••••••"
                    value={''}
                    onChange={e => { u.password = e.target.value; setRealtors([...realtors]) }}
                  />
                </td>
                <td>
                  <input
                    value={u.name || ''}
                    onChange={e => { u.name = e.target.value; setRealtors([...realtors]) }}
                  />
                </td>
                <td>
                  <input
                    value={u.chat_id || ''}
                    onChange={e => { u.chat_id = e.target.value; setRealtors([...realtors]) }}
                  />
                </td>
                <td>
                  <select
                    value={u.team_leader_id || ''}
                    onChange={e => {
                      u.team_leader_id = e.target.value ? +e.target.value : null
                      setRealtors([...realtors])
                    }}
                  >
                    <option value="">— none —</option>
                    {leaders.map(l => (
                      <option key={l.id} value={l.id}>{l.username}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <MultiSelect
                    options={objectTypes}
                    selected={u.allowed_type_object}
                    onChange={vals => { u.allowed_type_object = vals; setRealtors([...realtors]) }}
                  />
                </td>
                <td>
                  <MultiSelect
                    options={dealTypes}
                    selected={u.allowed_type_deal}
                    onChange={vals => { u.allowed_type_deal = vals; setRealtors([...realtors]) }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={u.commission_percent || ''}
                    onChange={e => { u.commission_percent = +e.target.value; setRealtors([...realtors]) }}
                    placeholder="%"
                  />
                </td>
                <td>
                  <button onClick={() => saveUser(u, 'realtor')}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
