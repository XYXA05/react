// src/AdminMenuManager.js
import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE  = process.env.REACT_APP_API_URL || 'https://79cf-217-31-72-114.ngrok-free.app'
const BOT_TYPES = ['cleaning','design','renovation']

export default function AdminMenuManager() {
  // ───────────── Bot + Menu state ─────────────
  const [botType,    setBotType]    = useState(BOT_TYPES[0])
  const [menuItems,  setMenuItems]  = useState([])
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [formState,  setFormState]  = useState({
    label:'', icon:'', route:'', order:0, parentId:''
  })

  // ───────────── Flow state ─────────────
  const [flowName,   setFlowName]   = useState('')
  const [steps,      setSteps]      = useState([])
  const [dirty,      setDirty]      = useState(false)

  // ───────────── Portfolio state ─────────────
  const [portfolioItems,   setPortfolioItems]   = useState([])
  const [editingPortfolio, setEditingPortfolio] = useState(null)
  const [showPortfolioForm, setShowPortfolioForm] = useState(false)
  const [beforeFiles,      setBeforeFiles]       = useState([])
  const [afterFiles,       setAfterFiles]        = useState([])
  const [portfolioForm,    setPortfolioForm]     = useState({
    title:'', description:''
  })

  // ─── load menu when botType changes ───
  useEffect(() => {
    fetchMenu()
    setFlowName('')
    setSteps([])
    setPortfolioItems([])
    setShowPortfolioForm(false)
  }, [botType])

  function fetchMenu(){
    axios
      .get(`${API_BASE}/api/admin/menu`, { params:{ bot_type:botType }})
      .then(r=>setMenuItems(r.data))
      .catch(console.error)
  }

  // ─── load flow steps ───
  useEffect(() => {
    if (!flowName || flowName === 'portfolio') {
      setSteps([])
      return
    }
    axios.get(`${API_BASE}/api/admin/flows`, {
      params:{ bot_type:botType, flow_name:flowName }
    })
    .then(r=>{ setSteps(r.data); setDirty(false) })
    .catch(console.error)
  }, [botType, flowName])

  // ─── load portfolio items ───
  useEffect(() => {
    if (flowName !== 'portfolio') return
    axios.get(`${API_BASE}/api/admin/portfolio`, {
      params:{ bot_type:botType }
    })
    .then(r=>setPortfolioItems(r.data))
    .catch(console.error)
  }, [botType, flowName])

  // ───────────── Menu handlers ─────────────
  function openNew(parentId='') {
    setEditing(null)
    setFormState({ label:'', icon:'', route:'', order:0, parentId })
    setShowForm(true)
  }
  function openEdit(item) {
    if (item.bot_type !== botType) {
      setBotType(item.bot_type)
    }
    setEditing(item.id)
    setFormState({
      label:    item.label,
      icon:     item.icon,
      route:    item.route,
      order:    item.order,
      parentId: item.parent_id || ''
    })
    setShowForm(true)
  }
  function handleMenuChange(e) {
    let { name, value } = e.target
    if (name === 'order') value = +value
    setFormState(s => ({ ...s, [name]: value }))
  }
  function handleMenuSubmit(e) {
    e.preventDefault()
    const payload = { ...formState, bot_type: botType }
    if (!payload.parentId) delete payload.parentId

    const req = editing
      ? axios.put(`${API_BASE}/api/admin/menu/${editing}`, payload)
      : axios.post(`${API_BASE}/api/admin/menu`, payload)

    req.then(fetchMenu)
       .then(() => setShowForm(false))
       .catch(console.error)
  }
  function handleMenuDelete(id) {
    if (!window.confirm('Really delete?')) return
    axios.delete(`${API_BASE}/api/admin/menu/${id}`, {
      params: { bot_type: botType }
    })
    .then(fetchMenu)
    .catch(console.error)
  }

  // ───────────── Flow handlers ─────────────
  function handleStepChange(i, field, value) {
    setSteps(s => {
      const copy = [...s]
      copy[i] = { ...copy[i], [field]: value }
      return copy
    })
    setDirty(true)
  }
  function addStep() {
    setSteps(s => [
      ...s,
      {
        bot_type:   botType,
        flow_name:  flowName,
        step:       s.length,
        type:       'text',
        question:   '',
        options:    [],
        fields:     [],
        max_count:  null,
        optional:   false,
      }
    ])
    setDirty(true)
  }
  function removeStep(i) {
    setSteps(s =>
      s
        .filter((_, idx) => idx !== i)
        .map((st, idx) => ({ ...st, step: idx }))
    )
    setDirty(true)
  }
  function saveAllSteps() {
    axios.post(
      `${API_BASE}/api/admin/flows/bulk_upsert`,
      steps,
      { params: { bot_type: botType } }
    )
    .then(() => { setDirty(false); alert('Steps saved!') })
    .catch(console.error)
  }

  // ───────────── Portfolio handlers ─────────────
  async function savePortfolio(e) {
    e.preventDefault()

    try {
      // 1) Create JSON record (only bot_type, title, description)
      const body = {
        bot_type:    botType,
        title:       portfolioForm.title,
        description: portfolioForm.description,
      }
      const { data: created } = editingPortfolio
        ? await axios.put(
            `${API_BASE}/api/admin/portfolio/${editingPortfolio}`,
            body
          )
        : await axios.post(
            `${API_BASE}/api/admin/portfolio`,
            body
          )

      // 2) Upload “before” files
      await Promise.all(
        beforeFiles.map(file => {
          const fd = new FormData()
          fd.append('file', file)
          return axios.post(
            // note module is always “portfolio” here
            `${API_BASE}/files/portfolio/${created.id}?section=before`,
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          )
        })
      )

      // 3) Upload “after” files
      await Promise.all(
        afterFiles.map(file => {
          const fd = new FormData()
          fd.append('file', file)
          return axios.post(
            `${API_BASE}/files/portfolio/${created.id}?section=after`,
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          )
        })
      )

      // 4) Refresh the list
      const { data: list } = await axios.get(
        `${API_BASE}/api/admin/portfolio`,
        { params: { bot_type: botType } }
      )
      setPortfolioItems(list)
      setShowPortfolioForm(false)
      setEditingPortfolio(null)

    } catch (err) {
      console.error(err.response?.data || err)
      alert('Failed: ' + JSON.stringify(err.response?.data || err.message))
    }
  }

  function openNewPortfolio() {
    setEditingPortfolio(null)
    setPortfolioForm({ title:'', description:'' })
    setBeforeFiles([])
    setAfterFiles([])
    setShowPortfolioForm(true)
  }
  function openEditPortfolio(item) {
    setEditingPortfolio(item.id)
    setPortfolioForm({
      title:       item.title,
      description: item.description,
    })
    setBeforeFiles([])
    setAfterFiles([])
    // ← ensure the form actually shows when editing:
    setShowPortfolioForm(true)
  }
  function deletePortfolio(id) {
    if (!window.confirm('Delete this entry?')) return
    axios.delete(`${API_BASE}/api/admin/portfolio/${id}`, {
      params:{ bot_type: botType }
    })
    .then(() =>
      axios.get(`${API_BASE}/api/admin/portfolio`, { params:{ bot_type: botType }})
           .then(r=>setPortfolioItems(r.data))
    )
    .catch(console.error)
  }

  function handlePortfolioField(e) {
    const { name, value } = e.target
    setPortfolioForm(f => ({ ...f, [name]: value }))
  }

  // ───────────── Build menu‐tree ─────────────
  const tree = menuItems
    .filter(i=>!i.parent_id)
    .sort((a,b)=>a.order - b.order)
    .map(p => ({
      ...p,
      children: menuItems
        .filter(c=>c.parent_id === p.id)
        .sort((a,b)=>a.order - b.order)
    }))

  return (
    <div className="admin-menu-manager">
      {/* ───────── Menu Manager ───────── */}
      <h2>🔧 Menu Manager</h2>
      <label>
        Bot Type:&nbsp;
        <select value={botType} onChange={e=>setBotType(e.target.value)}>
          {BOT_TYPES.map(bt=><option key={bt} value={bt}>{bt}</option>)}
        </select>
      </label>
      <button onClick={()=>openNew()}>+ New Top-Level</button>
      {showForm && (
        <form onSubmit={handleMenuSubmit} className="admin-form">
          <h3>{editing?'Edit':'Create'} Menu Item</h3>
          <label>
            Parent:<br/>
            <select
              name="parentId"
              value={formState.parentId}
              onChange={handleMenuChange}
            >
              <option value="">— Top Level —</option>
              {menuItems.filter(i=>!i.parent_id).map(i=>(
                <option key={i.id} value={i.id}>{i.icon} {i.label}</option>
              ))}
            </select>
          </label>
          <label>Label:<br/>
            <input name="label" value={formState.label}
                   onChange={handleMenuChange} required/>
          </label>
          <label>Icon:<br/>
            <input name="icon" value={formState.icon}
                   onChange={handleMenuChange}/>
          </label>
          <label>Route:<br/>
            <input name="route" value={formState.route}
                   onChange={handleMenuChange} required/>
          </label>
          <label>Order:<br/>
            <input name="order" type="number" value={formState.order}
                   onChange={handleMenuChange} required/>
          </label>
          <div className="form-actions">
            <button type="submit">{editing?'Save':'Create'}</button>
            <button type="button" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      <table className="admin-table">
        <thead><tr>
          <th>Ord</th><th>Icon</th><th>Label</th>
          <th>Route</th><th>Parent</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {tree.map(p=>(
            <React.Fragment key={p.id}>
              <tr className="parent-row">
                <td>{p.order}</td>
                <td>{p.icon}</td>
                <td><b>{p.label}</b></td>
                <td>{p.route}</td>
                <td>—</td>
                <td>
                  <button onClick={()=>openEdit(p)}>Edit</button>
                  <button onClick={()=>handleMenuDelete(p.id)}>Del</button>
                  <button onClick={()=>openNew(p.id)}>+Sub</button>
                </td>
              </tr>
              {p.children.map(c=>(
                <tr key={c.id} className="child-row">
                  <td>{c.order}</td>
                  <td>{c.icon}</td>
                  <td>↳ {c.label}</td>
                  <td>{c.route}</td>
                  <td>{p.label}</td>
                  <td>
                    <button onClick={()=>openEdit(c)}>Edit</button>
                    <button onClick={()=>handleMenuDelete(c.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ───────── Flow Steps ───────── */}
      <hr/>
      <h2>🛠 Flow Steps Manager</h2>
      <label>
        Flow Name:&nbsp;
        <select value={flowName} onChange={e=>setFlowName(e.target.value)}>
          <option value="">— pick a route —</option>
          {menuItems.map(i=>(
            <option key={i.route} value={i.route}>{i.route}</option>
          ))}
        </select>
      </label>
      {flowName && flowName !== 'portfolio' && (
        <>
          <button onClick={addStep}>+ Add Step</button>
          <table className="admin-table">
            <thead><tr>
              <th>#</th><th>Type</th><th>Question</th>
              <th>Options</th><th>Fields</th>
              <th>Max</th><th>Opt</th><th></th>
            </tr></thead>
            <tbody>
              {steps.map((st,i)=>(
                <tr key={i}>
                  <td>{st.step}</td>
                  <td>
                    <select
                      value={st.type}
                      onChange={e=>handleStepChange(i,'type',e.target.value)}
                    >
                      {['text','choice','multi_choice','manual_fields','photos','date','time','info']
                        .map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      value={st.question||''}
                      onChange={e=>handleStepChange(i,'question',e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={(st.options||[]).join(',')}
                      onChange={e=>handleStepChange(i,'options',e.target.value.split(',').filter(x=>x))}
                    />
                  </td>
                  <td>
                    <input
                      value={(st.fields||[]).join(',')}
                      onChange={e=>handleStepChange(i,'fields',e.target.value?e.target.value.split(','):[])}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={st.max_count||''}
                      onChange={e=>handleStepChange(i,'max_count', e.target.value?+e.target.value:null)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!st.optional}
                      onChange={e=>handleStepChange(i,'optional', e.target.checked)}
                    />
                  </td>
                  <td><button onClick={()=>removeStep(i)}>Del</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button disabled={!dirty} onClick={saveAllSteps}>Save All Steps</button>
        </>
      )}

      {/* ───────── Portfolio Manager ───────── */}
      {flowName === 'portfolio' && (
        <div className="portfolio-manager">
          <hr/>
          <h2>📷 Portfolio Items for “{botType}”</h2>
          <button onClick={openNewPortfolio}>+ New Entry</button>

          {showPortfolioForm && (
            <form onSubmit={savePortfolio} className="admin-form">
              <h3>{editingPortfolio ? 'Edit' : 'Create'} Portfolio Item</h3>
              <label>
                Title:<br/>
                <input
                  name="title"
                  value={portfolioForm.title}
                  onChange={e => setPortfolioForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </label>
              <label>
                Description:<br/>
                <textarea
                  name="description"
                  value={portfolioForm.description}
                  onChange={e => setPortfolioForm(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </label>
              <label>
                Before Photos:<br/>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => setBeforeFiles(Array.from(e.target.files))}
                />
              </label>
              <label>
                After Photos:<br/>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => setAfterFiles(Array.from(e.target.files))}
                />
              </label>
              <div className="form-actions">
                <button type="submit">{editingPortfolio ? 'Save' : 'Create'}</button>
                <button type="button" onClick={() => setShowPortfolioForm(false)}>Cancel</button>
              </div>
            </form>
          )}


          <table className="admin-table">
            <thead><tr>
              <th>Title</th><th>Description</th><th>Before</th><th>After</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {portfolioItems.map(item=>(
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td style={{ maxWidth:200, whiteSpace:'pre-wrap' }}>
                    {item.description}
                  </td>
                  <td>
                    {(item.before_photos || []).map((u,i)=>(
                      <img key={i} src={u} width={60} style={{ margin:2 }} alt="" />
                    ))}
                  </td>
                  <td>
                    {(item.after_photos || []).map((u,i)=>(
                      <img key={i} src={u} width={60} style={{ margin:2 }} alt="" />
                    ))}
                  </td>
                  <td>
                    <button onClick={()=>openEditPortfolio(item)}>Edit</button>
                    <button onClick={()=>deletePortfolio(item.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
