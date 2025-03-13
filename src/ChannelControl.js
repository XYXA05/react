// ChannelControl.js
import React, { useState, useEffect } from 'react';

const ChannelControl = () => {
  // Templates state and modal controls
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState({ id: null, category: '', typeDeal: '', typeObject: '', templateText: '' });
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Channels state and modal controls
  const [channels, setChannels] = useState([]);
  const [editingChannel, setEditingChannel] = useState({ id: null, category: '', type_deal: '', type_object: '', channel_id: '', price_from: '', price_to: '', location_type: 'all' });
  const [showChannelModal, setShowChannelModal] = useState(false);

  // Dropdown arrays – adjust as needed
  const categories = ['good', 'bad', 'owner', 'sent to telegram channel', 'successful'];
  const typeDeals = ['kvartiry', 'doma', 'posutochno-pochasovo'];
  const typeObjects = ['prodazha-kvartir', 'prodazha-domov', 'dolgosrochnaya-arenda-kvartir', 'posutochno-pochasovo-kvartiry'];

  const apiUrl = 'http://127.0.0.1:8000';

  useEffect(() => {
    getChannels();
    getTemplates();
  }, []);

  const getChannels = async () => {
    try {
      const res = await fetch(`${apiUrl}/telegram_channels`);
      const data = await res.json();
      setChannels(data);
      console.log("Fetched Channels:", data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const getTemplates = async () => {
    try {
      const res = await fetch(`${apiUrl}/templates`);
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // ---- Channel Functions ----

  const openChannelModal = (channel) => {
    if (channel) {
      setEditingChannel({ ...channel });
    } else {
      setEditingChannel({ id: null, category: '', type_deal: '', type_object: '', channel_id: '', price_from: '', price_to: '', location_type: 'all' });
    }
    setShowChannelModal(true);
  };

  const closeChannelModal = () => {
    setShowChannelModal(false);
  };

  const saveChannel = async () => {
    try {
      if (editingChannel.id) {
        const res = await fetch(`${apiUrl}/telegram_channels/${editingChannel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingChannel)
        });
        if (res.ok) {
          alert('Channel updated successfully!');
          getChannels();
          closeChannelModal();
        } else {
          const errorData = await res.json();
          alert("Error updating channel: " + JSON.stringify(errorData));
        }
      } else {
        const res = await fetch(`${apiUrl}/telegram_channels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingChannel)
        });
        if (res.ok) {
          alert('Channel added successfully!');
          getChannels();
          closeChannelModal();
        } else {
          const errorData = await res.json();
          alert("Error adding channel: " + JSON.stringify(errorData));
        }
      }
    } catch (error) {
      console.error('Error saving channel:', error);
    }
  };

  const deleteChannel = async (channelIdToDelete) => {
    try {
      const res = await fetch(`${apiUrl}/telegram_channels/${channelIdToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Channel deleted successfully!');
        getChannels();
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  // ---- Template Functions ----

  const openTemplateModal = (template) => {
    if (template) {
      setSelectedTemplate({ 
        id: template.id, 
        category: template.category, 
        typeDeal: template.type_deal || template.typeDeal, 
        typeObject: template.type_object || template.typeObject, 
        templateText: template.template_text || template.templateText 
      });
    } else {
      setSelectedTemplate({ id: null, category: '', typeDeal: '', typeObject: '', templateText: '' });
    }
    setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
  };

  const saveTemplate = async () => {
    const formattedTemplate = {
      category: selectedTemplate.category,
      type_object: selectedTemplate.typeObject,
      type_deal: selectedTemplate.typeDeal,
      template_text: selectedTemplate.templateText
    };

    try {
      if (selectedTemplate.id) {
        const res = await fetch(`${apiUrl}/templates/${selectedTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedTemplate)
        });
        if (res.ok) {
          alert('Template updated successfully!');
          getTemplates();
          closeTemplateModal();
        }
      } else {
        const res = await fetch(`${apiUrl}/templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedTemplate)
        });
        if (res.ok) {
          alert('Template added successfully!');
          getTemplates();
          closeTemplateModal();
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      const res = await fetch(`${apiUrl}/templates/${templateId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Template deleted successfully!');
        getTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  return (
    <div className="container">
      <h3 className="animated-heading">Channel Control</h3>
      
      {/* Channel Section */}
      <div>
        <h3>Channels</h3>
        <button className="advanced" onClick={() => openChannelModal(null)}>Add Channel</button>
        <ul>
          {channels.map(channel => (
            <li key={channel.id} className="channel-item">
              {channel.category} - {channel.type_deal} {channel.type_object} (<em>{channel.channel_id}</em>) [Price: {channel.price_from} - {channel.price_to}, Location: {channel.location_type}]
              <button className="advanced" onClick={() => openChannelModal(channel)}>Edit</button>
              <button className="advanced" onClick={() => deleteChannel(channel.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Template Section */}
      <div>
        <h3>Manage Message Templates</h3>
        <button className="advanced" onClick={() => openTemplateModal(null)}>Add New Template</button>
        <ul>
          {templates.map(template => (
            <li key={template.id}>
              <strong>{template.category} - {template.type_deal} - {template.type_object}</strong>
              <p>{template.template_text}</p>
              <button className="advanced" onClick={() => openTemplateModal(template)}>Edit</button>
              <button className="advanced" onClick={() => deleteTemplate(template.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedTemplate.id ? 'Edit Template' : 'Add New Template'}</h3>
            <div>
              <label>Category:</label>
              <select value={selectedTemplate.category} onChange={(e) => setSelectedTemplate({ ...selectedTemplate, category: e.target.value })}>
                {categories.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Type Deal:</label>
              <select value={selectedTemplate.typeDeal} onChange={(e) => setSelectedTemplate({ ...selectedTemplate, typeDeal: e.target.value })}>
                {typeDeals.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Type Object:</label>
              <select value={selectedTemplate.typeObject} onChange={(e) => setSelectedTemplate({ ...selectedTemplate, typeObject: e.target.value })}>
                {typeObjects.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Template Text:</label>
              <textarea 
                value={selectedTemplate.templateText} 
                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, templateText: e.target.value })}
              ></textarea>
            </div>
            {/* Hint Block for Placeholders */}
            <div className="template-hint">
              <h5>Hint: Available Placeholders</h5>
              <ul>
                <li><code>{'{id}'}</code> - айді оголошення</li>
                <li><code>{'{title}'}</code> - тайтл оголошення</li>
                <li><code>{'{price}'}</code> - ціна</li>
                <li><code>{'{location_date}'}</code> - адрес (місто район)</li>
                <li><code>{'{description}'}</code> - опис оголошення від першоначального джерела</li>
                <li><code>{'{features}'}</code> - вивід всіх особливостей оголошення</li>
                <li><code>{'{owner}'}</code> - бізнес чи власник</li>
                <li><code>{'{square}'}</code> - кількість квадратних метрів</li>
                <li><code>{'{room}'}</code> - кількість кімнат</li>
                <li><code>{'{residential_complex}'}</code> - ЖК</li>
                <li><code>{'{floor}'}</code> - етаж</li>
                <li><code>{'{superficiality}'}</code> - поверховість</li>
                <li><code>{'{classs}'}</code> - клас життя</li>
                <li><code>{'{url}'}</code> - URL</li>
                <li><code>{'{on_map}'}</code> - на карті</li>
                <li><code>{'{user}'}</code> - імʼя клієнта</li>
                <li><code>{'{phone}'}</code> - номер телефону клієнта</li>
                <li><code>{'{id_olx}'}</code> - ід самого ресурсу</li>
                <li><code>[імʼя силки вводимо тут](http://www.example.com/)</code></li>
                <li><code>{'{price_per_sq}'}</code> - ціна за метр кВ</li>
              </ul>
            </div>
            <div className="template-preview">
              <h4>Template Preview:</h4>
              <p>{selectedTemplate.templateText}</p>
            </div>
            <button className="advanced" onClick={saveTemplate}>Save</button>
            <button className="advanced" onClick={closeTemplateModal}>Cancel</button>
          </div>
        </div>
      )}

      {/* Channel Modal */}
      {showChannelModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingChannel.id ? 'Edit Channel' : 'Add Channel'}</h3>
            <div>
              <label>Category:</label>
              <select
                value={editingChannel.category}
                onChange={(e) => setEditingChannel({ ...editingChannel, category: e.target.value })}
              >
                {categories.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Type Deal:</label>
              <select
                value={editingChannel.type_deal}
                onChange={(e) => setEditingChannel({ ...editingChannel, type_deal: e.target.value })}
              >
                {typeDeals.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Type Object:</label>
              <select
                value={editingChannel.type_object}
                onChange={(e) => setEditingChannel({ ...editingChannel, type_object: e.target.value })}
              >
                {typeObjects.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Channel IDs (comma-separated):</label>
              <input
                type="text"
                value={editingChannel.channel_id}
                onChange={(e) => setEditingChannel({ ...editingChannel, channel_id: e.target.value })}
              />
            </div>
            <div>
              <label>Price From:</label>
              <input
                type="number"
                value={editingChannel.price_from || ''}
                onChange={(e) => setEditingChannel({ ...editingChannel, price_from: e.target.value })}
              />
            </div>
            <div>
              <label>Price To:</label>
              <input
                type="number"
                value={editingChannel.price_to || ''}
                onChange={(e) => setEditingChannel({ ...editingChannel, price_to: e.target.value })}
              />
            </div>
            <div>
              <label>Location Type:</label>
              <select
                value={editingChannel.location_type}
                onChange={(e) => setEditingChannel({ ...editingChannel, location_type: e.target.value })}
              >
                <option value="all">All</option>
                <option value="city">City</option>
                <option value="outskirts_of_the_city">околиці міста</option>
                <option value="region">Region</option>
              </select>
            </div>
            <button className="advanced" onClick={saveChannel}>Save</button>
            <button className="advanced" onClick={closeChannelModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelControl;
