import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import RentalCalendar from './RentalCalendar';
import html2canvas from 'html2canvas';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Backend endpoint base
const API_URL = 'http://localhost:8000';

// MediaBuyer Admin Panel component
const MediaBuyerAdminPanel = () => {
  // View state: 'list' | 'form' | 'calendar'
  const [view, setView] = useState('list');
  // Selected link for calendar view
  const [selectedLink, setSelectedLink] = useState(null);

  // Data states
  const [links, setLinks] = useState([]);
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Form state
  const initialForm = {
    resource_url: '',
    telegram_bot_key: '',
    category: '',
    link_name: '',
    created_date: '',
    description: ''
  };
  const [formLink, setFormLink] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch links from API
  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/mediabuyer/links/`);
      const data = res.data.map(link => ({
        ...link,
        created_date: link.created_date?.substring(0,10) || ''
      }));
      setLinks(data);
      setError('');
    } catch (err) {
      console.error('Error fetching links:', err);
      setError('Failed to load links.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Filtering logic
  const applyFilters = useCallback(() => {
    let list = [...links];
    // Text search
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(l =>
        l.link_name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    }
    // Category filter
    if (categoryFilter) {
      list = list.filter(l => l.category === categoryFilter);
    }
    // Date range filter
    if (dateFrom) {
      list = list.filter(l => l.created_date >= dateFrom);
    }
    if (dateTo) {
      list = list.filter(l => l.created_date <= dateTo);
    }
    setFilteredLinks(list);
  }, [links, searchText, categoryFilter, dateFrom, dateTo]);

  useEffect(() => {
    applyFilters();
    // Reset to first page on filter change
    setCurrentPage(1);
  }, [applyFilters]);

  // Drag-and-drop reorder
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };
  const handleDragEnd = result => {
    if (!result.destination) return;
    const newList = reorder(filteredLinks, result.source.index, result.destination.index);
    setLinks(newList);
  };

  // Pagination helpers
  const totalPages = Math.ceil(filteredLinks.length / pageSize);
  const pageData = filteredLinks.slice((currentPage-1)*pageSize, currentPage*pageSize);
  const goToPage = page => setCurrentPage(page);

  // Handlers
  const handleFilterChange = setter => e => setter(e.target.value);
  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormLink(prev => ({ ...prev, [name]: value }));
  };

  const startEditing = link => {
    setFormLink(link);
    setEditingId(link.id);
    setView('form');
  };
  const cancelForm = () => {
    setFormLink(initialForm);
    setEditingId(null);
    setView('list');
  };

  const saveLink = async e => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await axios.put(
          `${API_URL}/mediabuyer/links/${editingId}/`,
          formLink
        );
        setLinks(prev => prev.map(l => l.id===editingId?res.data:l));
      } else {
        const res = await axios.post(
          `${API_URL}/mediabuyer/links/`,
          formLink
        );
        setLinks(prev => [...prev, res.data]);
      }
      cancelForm();
    } catch (err) {
      console.error('Error saving link:', err);
      setError('Error saving link.');
    }
  };

  const deleteLink = async id => {
    if (!window.confirm('Delete this link?')) return;
    try {
      await axios.delete(`${API_URL}/mediabuyer/links/${id}/`);
      setLinks(prev => prev.filter(l => l.id!==id));
    } catch (err) {
      console.error('Error deleting link:', err);
      setError('Failed to delete.');
    }
  };

  // Export link as image
  const exportLink = async link => {
    const cont = document.createElement('div');
    Object.assign(cont.style, { padding:'20px', background:'#fff', fontFamily:'Arial' });
    cont.innerHTML = `
      <h1>Link #${link.id}: ${link.link_name}</h1>
      <p><strong>Category:</strong> ${link.category}</p>
      <p><strong>URL:</strong> ${link.resource_url}</p>
      <p><strong>Bot Key:</strong> ${link.telegram_bot_key}</p>
      <p><strong>Created Date:</strong> ${link.created_date}</p>
      <p><strong>Description:</strong> ${link.description}</p>
    `;
    document.body.appendChild(cont);
    const canvas = await html2canvas(cont, { useCORS:true, scale:2 });
    const a = document.createElement('a');
    a.download = `link-${link.id}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    document.body.removeChild(cont);
  };

  // Calendar view
  if (view==='calendar' && selectedLink) {
    return (
      <RentalCalendar
        propertyId={selectedLink.id}
        category="MediaBuyer"
        onBack={()=>setView('list')}
      />
    );
  }

  // Main render
  return (
    <div className="container">
      <h2>MediaBuyer Admin Panel</h2>

      {/* Filters */}
      <section className="filters">
        <input
          placeholder="Search by name/category/description"
          value={searchText}
          onChange={handleFilterChange(setSearchText)}
        />
        <input
          placeholder="Filter by Category"
          value={categoryFilter}
          onChange={handleFilterChange(setCategoryFilter)}
        />
        <label>
          From Date:
          <input type="date" value={dateFrom} onChange={handleFilterChange(setDateFrom)} />
        </label>
        <label>
          To Date:
          <input type="date" value={dateTo} onChange={handleFilterChange(setDateTo)} />
        </label>
        <button onClick={()=>{setFormLink(initialForm);setEditingId(null);setView('form');}}>+ New Link</button>
      </section>

      {loading ? (
        <p>Loading links...</p>
      ) : error ? (
        <p style={{color:'red'}}>{error}</p>
      ) : view==='list' ? (
        <>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="link-list">
              {provided => (
                <ul ref={provided.innerRef} {...provided.droppableProps} className="link-list">
                  {pageData.map((link, idx) => (
                    <Draggable key={link.id} draggableId={`${link.id}`} index={idx}>
                      {prov => (
                        <li
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className="link-item"
                        >
                          <span>#{link.id}: {link.link_name} [{link.category}]</span>
                          <div className="actions">
                            <button onClick={()=>{setSelectedLink(link);setView('calendar');}}>📅</button>
                            <button onClick={()=>startEditing(link)}>Edit</button>
                            <button onClick={()=>deleteLink(link.id)}>Delete</button>
                            <button onClick={()=>exportLink(link)}>Export</button>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
          {/* Pagination controls */}
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i+1}
                onClick={()=>goToPage(i+1)}
                disabled={currentPage===i+1}
              >{i+1}</button>
            ))}
          </div>
        </>
      ) : (
        // Form view
        <form className="link-form" onSubmit={saveLink}>
          <h3>{editingId?'Edit':'Add'} Link</h3>
          <label>
            Link Name:
            <input name="link_name" value={formLink.link_name} onChange={handleFormChange} required />
          </label>
          <label>
            Category:
            <input name="category" value={formLink.category} onChange={handleFormChange} />
          </label>
          <label>
            Resource URL:
            <input name="resource_url" type="url" value={formLink.resource_url} onChange={handleFormChange} required />
          </label>
          <label>
            Telegram Bot Key:
            <input name="telegram_bot_key" value={formLink.telegram_bot_key} onChange={handleFormChange} />
          </label>
          <label>
            Created Date:
            <input name="created_date" type="date" value={formLink.created_date} onChange={handleFormChange} />
          </label>
          <label>
            Description:
            <textarea name="description" value={formLink.description} onChange={handleFormChange} />
          </label>
          <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MediaBuyerAdminPanel;
