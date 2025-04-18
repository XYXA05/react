import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminOrdersPanel({ token, onBack }) {
  const [orders, setOrders]     = useState([]);
  const [realtors, setRealtors] = useState([]);
  const [leaders, setLeaders]   = useState([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    axios.get('/orders/', { headers })
      .then(r => setOrders(r.data))
      .catch();
    axios.get('/realtors', { headers })
      .then(r => setRealtors(r.data))
      .catch();
    axios.get('/team_leaders', { headers })
      .then(r => setLeaders(r.data))
      .catch();
  }, [token]);

  const save = (ord) => {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    axios.patch(
      `/orders/${ord.id}/assign`,
      {
        realtor_id:     ord.realtor_id,
        team_leader_id: ord.team_leader_id
      },
      { headers }
    )
    .then(() => alert('✅ Saved'))
    .catch(() => alert('❌ Save failed'));
  };

  return (
    <div>
      <h3>Admin: Assign Orders</h3>
      <button onClick={onBack}>← Back</button>
      <table border="1" cellPadding="4">
        <thead>
          <tr>
            <th>ID</th><th>Client</th>
            <th>Realtor</th><th>TeamLeader</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.name}</td>
              <td>
                <select
                  value={o.realtor_id || ''}
                  onChange={e => {
                    o.realtor_id = e.target.value ? parseInt(e.target.value) : null;
                    setOrders([...orders]);
                  }}
                >
                  <option value="">— none —</option>
                  {realtors.map(r => (
                    <option key={r.id} value={r.id}>{r.username}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={o.team_leader_id || ''}
                  onChange={e => {
                    o.team_leader_id = e.target.value ? parseInt(e.target.value) : null;
                    setOrders([...orders]);
                  }}
                >
                  <option value="">— none —</option>
                  {leaders.map(l => (
                    <option key={l.id} value={l.id}>{l.username}</option>
                  ))}
                </select>
              </td>
              <td>
                <button onClick={() => save(o)}>Save</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
