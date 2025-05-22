// AdminUsersPanel.js
import React, { useEffect, useState } from "react";
import axios from "axios";

// point all requests at your FastAPI backend:
const api = axios.create({ baseURL: "http://localhost:8000" });

// your deal/object translations (or just import them)
const DEAL_TYPE_TRANSLATIONS = { /* … */ };
const PROPERTY_TYPE_TRANSLATIONS = { /* … */ };
const dealTypes   = Object.keys(DEAL_TYPE_TRANSLATIONS);
const objectTypes = Object.keys(PROPERTY_TYPE_TRANSLATIONS);

export default function AdminUsersPanel({ token, onBack }) {
  const [admins,   setAdmins]   = useState([]);
  const [leaders,  setLeaders]  = useState([]);
  const [realtors, setRealtors]= useState([]);
  const [error,    setError]    = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    // fetch each list, tacking on a `newPassword` field so we can
    // bind an empty password input (never showing the hash!)
    api.get("/admins",      { headers })
       .then(r => setAdmins   (r.data.map(u => ({ ...u, newPassword: "" }))))
       .catch(() => setError("Failed loading admins"));

    api.get("/team_leaders",{ headers })
       .then(r => setLeaders  (r.data.map(u => ({ ...u, newPassword: "" }))))
       .catch(() => setError("Failed loading leaders"));

    api.get("/realtors",    { headers })
       .then(r => setRealtors(r.data.map(u => ({ ...u, newPassword: "" }))))
       .catch(() => setError("Failed loading realtors"));
  }, [token]);

  function saveUser(u, role) {
    const base =
      role === "admin"       ? "admins"       :
      role === "team_leader" ? "team_leaders" :
                              "realtors";

    // build the minimal payload — only send `password` if it's non-empty
    const payload = {
      username: u.username,
      name:     u.name,
      chat_id:  u.chat_id || null,
      ...(role === "team_leader" && {
        admin_id:             u.admin_id,
        allowed_type_object:  u.allowed_type_object,
        allowed_type_deal:    u.allowed_type_deal,
      }),
      ...(role === "realtor" && {
        team_leader_id:       u.team_leader_id,
        allowed_type_object:  u.allowed_type_object,
        allowed_type_deal:    u.allowed_type_deal,
      }),
      ...(u.newPassword && { password: u.newPassword }),
    };

    api.patch(`/${base}/${u.id}`, payload, { headers })
      .then(() => alert("✅ Saved"))
      .catch(() => alert("❌ Save failed"));
  }

  const MultiSelect = ({ options, selected, onChange }) => (
    <select
      multiple
      size={Math.min(options.length, 5)}
      value={selected || []}
      onChange={e =>
        onChange(
          Array.from(e.target.selectedOptions).map(o => o.value)
        )
      }
    >
      {options.map(o => (
        <option key={o} value={o}>
          {(PROPERTY_TYPE_TRANSLATIONS[o] || DEAL_TYPE_TRANSLATIONS[o]).uk}
        </option>
      ))}
    </select>
  );

  // helper to immutably update a single row in a list
  const updateRow = (list, setList, id, patch) =>
    setList(
      list.map(row => (row.id === id ? { ...row, ...patch } : row))
    );

  return (
    <div style={{ padding: 20 }}>
      <h3>User & Role Management</h3>
      <button onClick={onBack}>← Back</button>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ── Admins ─────────────────────────────────────────────────────── */}
      <section>
        <h4>Admins</h4>
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>New Password</th>
              <th>Name</th>
              <th>Chat ID</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  <input
                    value={u.username}
                    onChange={e =>
                      updateRow(admins, setAdmins, u.id, { username: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="password"
                    placeholder="••••••"
                    value={u.newPassword}
                    onChange={e =>
                      updateRow(admins, setAdmins, u.id, { newPassword: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={u.name || ""}
                    onChange={e =>
                      updateRow(admins, setAdmins, u.id, { name: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={u.chat_id || ""}
                    onChange={e =>
                      updateRow(admins, setAdmins, u.id, { chat_id: e.target.value })
                    }
                  />
                </td>
                <td>
                  <button onClick={() => saveUser(u, "admin")}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Team Leaders ─────────────────────────────────────────────── */}
      <section>
        <h4>Team Leaders</h4>
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>New Password</th>
              <th>Name</th>
              <th>Chat ID</th>
              <th>Admin</th>
              <th>Objects</th>
              <th>Deals</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  <input
                    value={u.username}
                    onChange={e =>
                      updateRow(leaders, setLeaders, u.id, { username: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="password"
                    placeholder="••••••"
                    value={u.newPassword}
                    onChange={e =>
                      updateRow(leaders, setLeaders, u.id, { newPassword: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={u.name || ""}
                    onChange={e =>
                      updateRow(leaders, setLeaders, u.id, { name: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={u.chat_id || ""}
                    onChange={e =>
                      updateRow(leaders, setLeaders, u.id, { chat_id: e.target.value })
                    }
                  />
                </td>
                <td>
                  <select
                    value={u.admin_id || ""}
                    onChange={e =>
                      updateRow(leaders, setLeaders, u.id, {
                        admin_id: e.target.value ? +e.target.value : null,
                      })
                    }
                  >
                    <option value="">— none —</option>
                    {admins.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.username}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <MultiSelect
                    options={objectTypes}
                    selected={u.allowed_type_object}
                    onChange={vals =>
                      updateRow(leaders, setLeaders, u.id, { allowed_type_object: vals })
                    }
                  />
                </td>
                <td>
                  <MultiSelect
                    options={dealTypes}
                    selected={u.allowed_type_deal}
                    onChange={vals =>
                      updateRow(leaders, setLeaders, u.id, { allowed_type_deal: vals })
                    }
                  />
                </td>
                <td>
                  <button onClick={() => saveUser(u, "team_leader")}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Realtors ───────────────────────────────────────────────────── */}
      <section>
        <h4>Realtors</h4>
        <table border="1" cellPadding="4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>New Password</th>
              <th>Name</th>
              <th>Chat ID</th>
              <th>Team Lead</th>
              <th>Objects</th>
              <th>Deals</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {realtors.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  <input
                    value={u.username}
                    onChange={e =>
                      updateRow(realtors, setRealtors, u.id, { username: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    type="password"
                    placeholder="••••••"
                    value={u.newPassword}
                    onChange={e =>
                      updateRow(realtors, setRealtors, u.id, { newPassword: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={u.name || ""}
                    onChange={e =>
                      updateRow(realtors, setRealtors, u.id, { name: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={u.chat_id || ""}
                    onChange={e =>
                      updateRow(realtors, setRealtors, u.id, { chat_id: e.target.value })
                    }
                  />
                </td>
                <td>
                  <select
                    value={u.team_leader_id || ""}
                    onChange={e =>
                      updateRow(realtors, setRealtors, u.id, {
                        team_leader_id: e.target.value ? +e.target.value : null,
                      })
                    }
                  >
                    <option value="">— none —</option>
                    {leaders.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.username}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <MultiSelect
                    options={objectTypes}
                    selected={u.allowed_type_object}
                    onChange={vals =>
                      updateRow(realtors, setRealtors, u.id, { allowed_type_object: vals })
                    }
                  />
                </td>
                <td>
                  <MultiSelect
                    options={dealTypes}
                    selected={u.allowed_type_deal}
                    onChange={vals =>
                      updateRow(realtors, setRealtors, u.id, { allowed_type_deal: vals })
                    }
                  />
                </td>
                <td>
                  <button onClick={() => saveUser(u, "realtor")}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
