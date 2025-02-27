// src/ChannelControl.js
import React, { useState, useEffect } from 'react';

const ChannelControl = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState({ id: null, category: '', typeDeal: '', typeObject: '', templateText: '' });
  const [showModal, setShowModal] = useState(false);
  const [channels, setChannels] = useState([]);
  const [category, setCategory] = useState('');
  const [typeDeal, setTypeDeal] = useState('');
  const [channelId, setChannelId] = useState('');
  const [typeObject, setTypeObject] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [locationType, setLocationType] = useState('all');

  // Змініть значення у масиві, щоб зберігати потрібні вам дані (наприклад, "good" замість "owner")
  const categories = ['good', 'bad', 'owner', 'sent to telegram channel', 'successful'];
  const typeDeals = ['kvartiry', 'doma', 'posutochno-pochasovo'];
  const typeObjects = ['prodazha-kvartir', 'prodazha-domov', 'posutochno-pochasovo-doma', 'posutochno-pochasovo-kvartiry'];

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

  const addChannel = async () => {
    // Перевірка: якщо необхідні поля порожні, виводимо повідомлення
    if (!category || !typeDeal || !channelId) {
      alert('All fields are required!');
      return;
    }
    // Переконайтеся, що дані відповідають вашим вимогам
    // Наприклад: щоб зберегти категорію "good", ціни: 0 і 10000000
    const newChannel = {
      category,
      type_deal: typeDeal,
      type_object: typeObject,
      channel_id: channelId,
      price_from: priceFrom ? Number(priceFrom) : null,
      price_to: priceTo ? Number(priceTo) : null,
      location_type: locationType || 'all'
    };

    try {
      const res = await fetch(`${apiUrl}/telegram_channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel)
      });
      if (res.ok) {
        alert('Channel added successfully!');
        getChannels();
        clearForm();
      } else {
        // Виводимо помилку, якщо статус не OK
        const errorData = await res.json();
        alert("Error: " + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Error adding channel:', error);
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

  const clearForm = () => {
    setCategory('');
    setTypeDeal('');
    setTypeObject('');
    setChannelId('');
    setPriceFrom('');
    setPriceTo('');
    setLocationType('all');
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

  const openModal = (template) => {
    if (template) {
      setSelectedTemplate({ ...template });
    } else {
      setSelectedTemplate({ id: null, category: '', typeDeal: '', typeObject: '', templateText: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Функція збереження шаблону
  const saveTemplate = async () => {
    // Оголошуємо formattedTemplate перед використанням
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
          closeModal();
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
          closeModal();
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
      <div>
        <label htmlFor="category">Category:</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
          {categories.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="typeDeal">Type Deal:</label>
        <select id="typeDeal" value={typeDeal} onChange={(e) => setTypeDeal(e.target.value)} required>
          {typeDeals.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="typeObject">Type Object:</label>
        <select id="typeObject" value={typeObject} onChange={(e) => setTypeObject(e.target.value)} required>
          {typeObjects.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="channelId">Channel IDs (comma-separated):</label>
        <input type="text" id="channelId" value={channelId} onChange={(e) => setChannelId(e.target.value)} required placeholder="e.g. -1002332017028, -1002258804849" />
      </div>
      <div>
        <label htmlFor="priceFrom">Price From:</label>
        <input type="number" id="priceFrom" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} placeholder="0" />
      </div>
      <div>
        <label htmlFor="priceTo">Price To:</label>
        <input type="number" id="priceTo" value={priceTo} onChange={(e) => setPriceTo(e.target.value)} placeholder="10000000" />
      </div>
      <div>
        <label htmlFor="locationType">Location Type:</label>
        <select id="locationType" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
          <option value="all">All</option>
          <option value="city">City</option>
          <option value="outskirts_of_the_city">околиці міста</option>
          <option value="region">Region</option>
        </select>
      </div>
      <button className="advanced" onClick={addChannel}>Add Channel</button>

      <h3>Existing Channels</h3>
      <ul>
        {channels.map(channel => (
          <li key={channel.id}>
            {channel.category} - {channel.type_deal} {channel.type_object} ({channel.channel_id}) {channel.price_from} {channel.price_to} {channel.location_type}
            <button className="advanced" onClick={() => deleteChannel(channel.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <div>
        <h3>Manage Message Templates</h3>
        <button className="advanced" onClick={() => openModal()}>Add New Template</button>
        <ul>
          {templates.map(template => (
            <li key={template.id}>
              <strong>{template.category} - {template.typeDeal} - {template.typeObject}</strong>
              <p>{template.templateText}</p>
              <button className="advanced" onClick={() => openModal(template)}>Edit</button>
              <button className="advanced" onClick={() => deleteTemplate(template.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal for Editing Template */}
      {showModal && (
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
              <textarea value={selectedTemplate.templateText} onChange={(e) => setSelectedTemplate({ ...selectedTemplate, templateText: e.target.value })}></textarea>
            </div>
            <button className="advanced" onClick={saveTemplate}>Save</button>
            <button className="advanced" onClick={closeModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelControl;
