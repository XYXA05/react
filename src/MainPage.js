// src/MainPage.js
import React, { useState, useEffect } from 'react';
import * as ApartmentService from './ApartmentService';
import RentalCalendar from './RentalCalendar'; // Ensure this component exists
import Navigation from './Navigation';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import html2canvas from 'html2canvas';


const MainPage = () => {
  // For demonstration we hard-code the user role.
  const [userRole, setUserRole] = useState("admin");
  // Maintain a view state for internal view switching.
  const [view, setView] = useState("dashboard");
  // State for selected property (to show its calendar)
  const [selectedProperty, setSelectedProperty] = useState(null);

  // State variables for templates, apartments and filters
  const [templates, setTemplates] = useState([]);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [typeObject, setTypeObject] = useState('');
  const [apartments, setApartments] = useState([]);
  const [filteredApartments, setFilteredApartments] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [citiesByDistrict, setCitiesByDistrict] = useState({});
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [typeDeal, setTypeDeal] = useState('');
  const [priceMin, setPriceMin] = useState(null);
  const [priceMax, setPriceMax] = useState(null);
  const [owner, setOwner] = useState('');
  const [rooms, setRooms] = useState('');
  const UAH_TO_USD_RATE = 41.5;
  // Filter options
  const [typeDealOptions, setTypeDealOptions] = useState([]);
  const [typeObjectOptions, setTypeObjectOptions] = useState([]);
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filterById, setFilterById] = useState(null);
  const [verificationApartments, setVerificationApartments] = useState([]);
  const [newTrapWord, setNewTrapWord] = useState('');
  const [newStopWord, setNewStopWord] = useState('');
  // Free days filter (for calendar search)
  const [freeFrom, setFreeFrom] = useState('');
  const [freeTo, setFreeTo] = useState('');

  // Define status options similar to Angular code
  const statusOptions = ['new', 'activation_soon', 'inactive', 'successful', 'spam'];

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  // Helper to update a field for an apartment in state
  const handleChangeField = (apartmentId, field, value) => {
    setApartments(prevApts =>
      prevApts.map(apartment =>
        apartment.id === apartmentId ? { ...apartment, [field]: value } : apartment
      )
    );
  };
  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };
    // Drag & Drop handler
    const handleDragEnd = (result) => {
      const { source, destination } = result;
      if (!destination) return;
      const aptId = parseInt(source.droppableId.split('-')[1], 10);
      setApartments(prev => prev.map(ap => {
        if (ap.id !== aptId) return ap;
        return { ...ap, files: reorder(ap.files, source.index, destination.index) };
      }));
    };
// Poster generation (fixed container sizing + off‑screen placement)
// Make a slick poster just like your example
const makePoster = async (ad) => {
  // 1) Build container
  const container = document.createElement('div');
  Object.assign(container.style, {
    width: '1080px',
    margin: '0 auto',
    background: '#1f3a1f',      // dark-green
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
    fontFamily: 'sans-serif',
  });

  // 2) Top hero image (first file)
  const hero = new Image();
  hero.crossOrigin = 'anonymous';
  hero.src = ad.files[0]?.file_path || '';
  Object.assign(hero.style, {
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
  });
  await new Promise(r => (hero.onload = r)); 
  container.appendChild(hero);

  // 3) Title + Price strip
  const strip = document.createElement('div');
  Object.assign(strip.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    fontSize: '48px',
    fontWeight: 'bold',
  });
  const title = document.createElement('div');
  title.innerText = 'ОРЕНДА';
  const price = document.createElement('div');
  // you could store USD separately, or parse from ad.price
  const num = parseFloat(ad.price.replace(/[^\d.]/g, '')) || '';
  price.innerText = `$${num}`;
  strip.append(title, price);
  container.appendChild(strip);

  // 4) Two columns of details
  const details = document.createElement('div');
  Object.assign(details.style, {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 20px 20px',
    fontSize: '24px',
    lineHeight: '1.2',
  });

  // left column
  const leftCol = document.createElement('div');
  leftCol.innerHTML = `
    <div>🏠 1 КІМ. КВАРТИРА</div>
    <div>📍 ${ad.location_date.split(', ')[1] || ''}</div>
  `;
  // right column
  const rightCol = document.createElement('div');
  rightCol.innerHTML = `
    <div>🏢 ${ad.residential_complex || ''}</div>
    <div>🆔 КОД ${ad.id}</div>
  `;

  details.append(leftCol, rightCol);
  container.appendChild(details);

  // 5) Thumbnail rail (up to 3)
  const thumbs = document.createElement('div');
  Object.assign(thumbs.style, {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    padding: '0 20px 20px',
  });

  // only show at most 3
  await Promise.all(
    ad.files.slice(0, 3).map(img => new Promise((res) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.src = img.file_path;
      Object.assign(el.style, {
        width: 'calc((100% - 20px)/3)',
        height: 'auto',
        objectFit: 'cover',
      });
      el.onload = () => { thumbs.appendChild(el); res(); };
      el.onerror = () => res();
    }))
  );
  container.appendChild(thumbs);

  // 6) Snapshot & download
  document.body.appendChild(container);
  const canvas = await html2canvas(container, { useCORS: true });
  const link = document.createElement('a');
  link.download = `poster-${ad.id}.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
  document.body.removeChild(container);
};




  // Handle status change from the select element
  const onStatusChange = (e, apartmentId) => {
    const newStatus = e.target.value;
    ApartmentService.updateApartmentStatus(apartmentId, newStatus)
      .then(() => {
        setFilteredApartments(prev =>
          prev.map(ap => (ap.id === apartmentId ? { ...ap, ad_status: newStatus } : ap))
        );
      })
      .catch(err => console.error('Error updating status:', err));
  };

  const fetchInitialData = async () => {
    try {
      if (userRole === "admin") {
        const verif = await ApartmentService.getVerificationAds();
        setVerificationApartments(verif);
      }
      const data = await ApartmentService.getApartments();
      const modifiedData = data.map(ad => ({ ...ad, expanded: false }));
      setApartments(modifiedData);
      setFilteredApartments(modifiedData);
      fetchTemplates();
      setTypeDealOptions(getUniqueValues(modifiedData, 'type_deal'));
      setTypeObjectOptions(getUniqueValues(modifiedData, 'type_object'));
      setOwnerOptions(getUniqueValues(modifiedData, 'owner'));
      populateDistrictsAndCities(modifiedData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const temps = await ApartmentService.getTemplates();
      setTemplates(temps);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const getUniqueValues = (data, key) => {
    return [...new Set(data.map(item => item[key]).filter(Boolean))];
  };

  const populateDistrictsAndCities = (data) => {
    const districtsSet = new Set();
    const citiesTemp = {};
    data.forEach(ad => {
      const parts = ad.location_date.split(', ');
      const district = parts[0];
      const city = parts[1] || '';
      districtsSet.add(district);
      if (!citiesTemp[district]) {
        citiesTemp[district] = [];
      }
      if (city && !citiesTemp[district].includes(city)) {
        citiesTemp[district].push(city);
      }
    });
    setDistricts(Array.from(districtsSet));
    setCitiesByDistrict(citiesTemp);
  };

  const onFilterChange = () => {
    const filtered = apartments.filter(ad => {
      const priceUSD = convertToUSD(ad.price);
      const parts = ad.location_date.split(', ');
      const district = parts[0];
      const city = parts[1] || '';
      const matchesDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(district);
      const matchesCity = selectedCities.length === 0 || selectedCities.includes(city);
      return (
        (filterText === '' ||
          ad.title.toLowerCase().includes(filterText.toLowerCase()) ||
          ad.description.toLowerCase().includes(filterText.toLowerCase())) &&
        (typeDeal === '' || ad.type_deal === typeDeal) &&
        (typeObject === '' || ad.type_object === typeObject) &&
        (owner === '' || ad.owner.toLowerCase().includes(owner.toLowerCase())) &&
        (rooms === '' || ad.room === rooms) &&
        (filterById === null || ad.id === filterById) &&
        (priceMin === null || priceUSD >= priceMin) &&
        (priceMax === null || priceUSD <= priceMax) &&
        matchesDistrict &&
        matchesCity
      );
    });
    setFilteredApartments(filtered);
  };

  const isHryvnia = (price) => price.includes('грн');
  const convertToUSD = (price) => {
    const cleanPrice = parseFloat(price.replace(/[^\d]/g, '')) || 0;
    return isHryvnia(price) ? cleanPrice / UAH_TO_USD_RATE : cleanPrice;
  };

  // Other functions (startParser, stopParser, auto-posting, watermark, etc.)
  const startParser = async () => {
    try {
      await ApartmentService.runParser();
      alert('Parser started');
    } catch (error) {
      console.error('Error starting parser:', error);
    }
  };

  const stopParser = async () => {
    try {
      await fetch(`${ApartmentService.BASE_URL}/stop_scraping/`);
      alert('Parser stopped');
    } catch (error) {
      console.error('Error stopping parser:', error);
    }
  };

  const startAutoPosting = async () => {
    try {
      await ApartmentService.runAutoPosting();
      alert('Auto posting started');
    } catch (error) {
      console.error('Error starting auto posting:', error);
    }
  };

  const stopAutoPosting = async () => {
    try {
      await fetch(`${ApartmentService.BASE_URL}/stop_autoposting/`);
      alert('Auto posting stopped');
    } catch (error) {
      console.error('Error stopping auto posting:', error);
    }
  };

  const applyWatermark = async (imageId, apartmentId) => {
    try {
      await fetch(`${ApartmentService.BASE_URL}/apartments/${apartmentId}/apply_watermark/${imageId}`, { method: 'PUT' });
      alert('Watermark applied successfully!');
      fetchInitialData();
    } catch (error) {
      console.error('Error applying watermark:', error);
    }
  };

  const removeWatermarkAI = async (imageId, apartmentId) => {
    try {
      await fetch(`${ApartmentService.BASE_URL}/apartments/${apartmentId}/remove_watermark_ai/${imageId}`, { method: 'PUT' });
      alert('Watermark removed successfully using AI!');
      fetchInitialData();
    } catch (error) {
      console.error('Error removing watermark using AI:', error);
    }
  };

  const uploadImages = async (e, apartmentId) => {
    const files = e.target.files;
    if (files) {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));
      try {
        await fetch(`${ApartmentService.BASE_URL}/apartments/${apartmentId}/upload_images`, {
          method: 'POST',
          body: formData
        });
        fetchInitialData();
      } catch (error) {
        console.error('Error uploading images:', error);
      }
    }
  };

  const deleteImage = async (imageId) => {
    try {
      await ApartmentService.deleteImage(imageId);
      fetchInitialData();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Admin functions for trap/stop words
  const addTrapWord = async () => {
    try {
      await ApartmentService.addTrapWord(newTrapWord);
      fetchInitialData();
      setNewTrapWord('');
    } catch (error) {
      console.error('Error adding trap word:', error);
    }
  };

  const addStopWord = async () => {
    try {
      await ApartmentService.addStopWord(newStopWord);
      fetchInitialData();
      setNewStopWord('');
    } catch (error) {
      console.error('Error adding stop word:', error);
    }
  };

  const approveApartment = async (apartmentId) => {
    try {
      await ApartmentService.approveApartment(apartmentId);
      fetchInitialData();
    } catch (error) {
      console.error('Error approving apartment:', error);
    }
  };

  const rejectApartment = async (apartmentId) => {
    try {
      await ApartmentService.rejectApartment(apartmentId);
      fetchInitialData();
    } catch (error) {
      console.error('Error rejecting apartment:', error);
    }
  };

  const updateFixFields = async (apartmentId, updateData) => {
    try {
      await ApartmentService.updateApartmentFixFields(apartmentId, updateData);
      console.log("Apartment information updated successfully.");
      fetchInitialData();
    } catch (error) {
      console.error("Error updating apartment fix fields:", error);
    }
  };

  // Template management
  const saveTemplate = async () => {
    const templateData = {
      category: 'telegram_channel',
      type_object: 'apartment',
      type_deal: 'sale',
      template_text: templateContent
    };
    try {
      if (selectedTemplate) {
        await ApartmentService.updateTemplate(selectedTemplate.id, templateData);
      } else {
        await ApartmentService.createTemplate(templateData);
      }
      fetchTemplates();
      clearForm();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const editTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateTitle(template.name);
    setTemplateContent(template.template_text);
  };

  const deleteTemplate = async (templateId) => {
    try {
      await ApartmentService.deleteTemplate(templateId);
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const clearForm = () => {
    setTemplateTitle('');
    setTemplateContent('');
    setSelectedTemplate(null);
  };

  const autoAssign = async () => {
    try {
      const response = await ApartmentService.autoAssignApartments();
      alert(response.message);
      fetchInitialData();
    } catch (error) {
      console.error('Error distributing apartments:', error);
    }
  };

  const publishToChannel = async (apartmentId) => {
    try {
      await ApartmentService.publishToChannel(apartmentId, selectedTemplateName);
      alert('The ad has been published to the Telegram channel.');
    } catch (error) {
      console.error('Error publishing apartment:', error);
      alert('An error occurred while publishing the ad to the channel.');
    }
  };

  // Filter handlers for districts and cities
  const onDistrictChange = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedDistricts(options);
    const cities = options.flatMap(district => citiesByDistrict[district] || []);
    setAvailableCities(Array.from(new Set(cities)));
    onFilterChange();
  };

  const onCityChange = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedCities(options);
    onFilterChange();
  };

  // If a property is selected, show the RentalCalendar view
  if (selectedProperty) {
    return (
      <RentalCalendar 
        propertyId={selectedProperty.id} 
        onBack={() => setSelectedProperty(null)} 
      />
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>

    <div className="container admin-panel">
      <h1 className="animated-heading">Dashboard - Apartments</h1>

      {/* Filters Section */}
      <section className="filters card">
        <h2>Filter Apartments</h2>
        <input
          type="text"
          value={filterText}
          onChange={(e) => { setFilterText(e.target.value); onFilterChange(); }}
          placeholder="Filter by title or description"
          className="filter-input animated"
        />
        <select
          value={owner}
          onChange={(e) => { setOwner(e.target.value); onFilterChange(); }}
          className="filter-input animated"
        >
          <option value="">All Owners</option>
          {ownerOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          value={typeDeal}
          onChange={(e) => { setTypeDeal(e.target.value); onFilterChange(); }}
          className="filter-input animated"
        >
          <option value="">All Deals</option>
          {typeDealOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          value={typeObject}
          onChange={(e) => { setTypeObject(e.target.value); onFilterChange(); }}
          className="filter-input animated"
        >
          <option value="">All Types</option>
          {typeObjectOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <h3>Select District(s):</h3>
        <select multiple value={selectedDistricts} onChange={onDistrictChange}>
          {districts.map(district => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>
        <h3>Select City/Cities:</h3>
        <select multiple value={selectedCities} onChange={onCityChange}>
          {availableCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <input
          type="number"
          value={priceMin || ''}
          onChange={(e) => { setPriceMin(e.target.value ? parseFloat(e.target.value) : null); onFilterChange(); }}
          placeholder="Min Price"
          className="filter-input animated"
        />
        <input
          type="number"
          value={priceMax || ''}
          onChange={(e) => { setPriceMax(e.target.value ? parseFloat(e.target.value) : null); onFilterChange(); }}
          placeholder="Max Price"
          className="filter-input animated"
        />
        <input
          type="number"
          value={filterById || ''}
          onChange={(e) => { setFilterById(e.target.value ? parseInt(e.target.value) : null); onFilterChange(); }}
          placeholder="Filter by ID"
          className="filter-input animated"
        />
        <input
          type="text"
          value={rooms}
          onChange={(e) => { setRooms(e.target.value); onFilterChange(); }}
          placeholder="Filter by Rooms"
          className="filter-input animated"
        />
        <div className="status-buttons">
          <button className="advanced" onClick={fetchInitialData}>All Ads</button>
          <button className="advanced" onClick={() => ApartmentService.getApartmentsByStatus('new').then(ads => setFilteredApartments(ads))}>New Ads</button>
          <button className="advanced" onClick={() => ApartmentService.getApartmentsByStatus('activation_soon').then(ads => setFilteredApartments(ads))}>Activation Soon</button>
          <button className="advanced" onClick={() => ApartmentService.getApartmentsByStatus('inactive').then(ads => setFilteredApartments(ads))}>Inactive Ads</button>
          <button className="advanced" onClick={() => ApartmentService.getApartmentsByStatus('successful').then(ads => setFilteredApartments(ads))}>Successful Ads</button>
          <button className="advanced" onClick={() => ApartmentService.getApartmentsByStatus('spam').then(ads => setFilteredApartments(ads))}>Spam</button>
          {(userRole === "admin" || userRole === "team_leader") && (
            <button className="advanced" onClick={autoAssign}>Distribute Apartments</button>
          )}
        </div>
      </section>

      {/* Apartments List Section */}
      <section className="apartments-list card">
        <h2>Apartments</h2>
        {filteredApartments.length === 0 ? (
          <div className="no-apartments">No apartments found.</div>
        ) : (
          filteredApartments.map(ad => (
            <div key={ad.id} className="apartment-item">
              <div
                className="apartment-header"
                onClick={() => {
                  ad.expanded = !ad.expanded;
                  setApartments([...apartments]);
                }}
              >
                <p><strong>{ad.title}</strong></p>
                <p>ID: {ad.id}</p>
                <p>Deal: {ad.type_deal}</p>
                <p>Object: {ad.type_object}</p>
                <p>Status: {ad.ad_status}</p>
                <button onClick={() => setSelectedProperty(ad)}>
                  View Calendar
                </button>
                <button className="advanced">{ad.expanded ? 'Collapse' : 'Expand'}</button>
              </div>
              {ad.expanded && (
                <div className="apartment-details">
                  <input type="file" multiple onChange={(e) => uploadImages(e, ad.id)} className="animated" />
                  <button onClick={()=>makePoster(ad)}>Make Poster</button>
                  <Droppable droppableId={`gallery-${ad.id}`} direction="horizontal" isDropDisabled={false}>
                    {provided => (
                      <div className="image-gallery" ref={provided.innerRef} {...provided.droppableProps}>
                        {ad.files.map((img,i)=>(
                          <Draggable key={img.id} draggableId={`${img.id}`} index={i}>
                            {(prov,snap)=>(
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className={snap.isDragging?'dragging':''}>
                                <img src={new URL(img.file_path).pathname} alt={ad.title} />
                                <button onClick={()=>applyWatermark(img.id,ad.id)}>Watermark</button>
                                <button onClick={()=>removeWatermarkAI(img.id,ad.id)}>Remove AI</button>
                                <button onClick={()=>deleteImage(img.id)}>Delete</button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  {/* Apartment Info and Edit Form */}
                  <div className="apartment-info">
                    <p>ID: {ad.id}</p>
                    <p>Deal: {ad.type_deal}</p>
                    <p>Object: {ad.type_object}</p>
                    <p>Status: {ad.ad_status}</p>
                    <label htmlFor={`statusSelect_${ad.id}`}>Update Status:</label>
                    <select
                      id={`statusSelect_${ad.id}`}
                      value={ad.ad_status}
                      onChange={(e) => onStatusChange(e, ad.id)}
                    >
                      {statusOptions.map((status, idx) => (
                        <option key={idx} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const updateData = {
                      title_fix: ad.title_fix,
                      price_fix: ad.price_fix,
                      location_date_fix: ad.location_date_fix,
                      features_fix: ad.features_fix,
                      owner_fix: ad.owner_fix,
                      square_fix: ad.square_fix,
                      room_fix: ad.room_fix,
                      residential_complex_fix: ad.residential_complex_fix,
                      floor_fix: ad.floor_fix,
                      superficiality_fix: ad.superficiality_fix,
                      classs_fix: ad.classs_fix,
                      url_fix: ad.url_fix,
                      on_map_fix: ad.on_map_fix,
                      user_fix: ad.user_fix,
                      phone_fix: ad.phone_fix,
                      id_olx_fix: ad.id_olx_fix,
                      comment_fix: ad.comment_fix,
                    };
                    updateFixFields(ad.id, updateData);
                  }}>
                    <div className="apartment-info">
                      <p>{ad.title}</p>
                      <label>Title (Fixed):</label>
                      <input
                        type="text"
                        value={ad.title_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'title_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.price}</p>
                      <label>Price (Fixed):</label>
                      <input
                        type="text"
                        value={ad.price_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'price_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.location_date}</p>
                      <label>Location Date (Fixed):</label>
                      <input
                        type="text"
                        value={ad.location_date_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'location_date_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.features}</p>
                      <label>Features (Fixed):</label>
                      <input
                        type="text"
                        value={ad.features_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'features_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.owner}</p>
                      <label>Owner (Fixed):</label>
                      <input
                        type="text"
                        value={ad.owner_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'owner_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.square}</p>
                      <label>Square (Fixed):</label>
                      <input
                        type="text"
                        value={ad.square_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'square_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.rooms}</p>
                      <label>Room (Fixed):</label>
                      <input
                        type="text"
                        value={ad.room_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'room_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.residential_complex}</p>
                      <label>Residential Complex (Fixed):</label>
                      <input
                        type="text"
                        value={ad.residential_complex_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'residential_complex_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.floor}</p>
                      <label>Floor (Fixed):</label>
                      <input
                        type="text"
                        value={ad.floor_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'floor_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.superficiality}</p>
                      <label>Superficiality (Fixed):</label>
                      <input
                        type="text"
                        value={ad.superficiality_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'superficiality_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.classs}</p>
                      <label>Class (Fixed):</label>
                      <input
                        type="text"
                        value={ad.classs_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'classs_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.url}</p>
                      <label>URL (Fixed):</label>
                      <input
                        type="text"
                        value={ad.url_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'url_fix', e.target.value)}
                        className="animated"
                      />

                      <label>On Map (Fixed):</label>
                      <input
                        type="text"
                        value={ad.on_map_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'on_map_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.user}</p>
                      <label>User (Fixed):</label>
                      <input
                        type="text"
                        value={ad.user_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'user_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.phone}</p>
                      <label>Phone (Fixed):</label>
                      <input
                        type="text"
                        value={ad.phone_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'phone_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.id_olx}</p>
                      <label>OLX ID (Fixed):</label>
                      <input
                        type="text"
                        value={ad.id_olx_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'id_olx_fix', e.target.value)}
                        className="animated"
                      />

                      <p>{ad.comment}</p>
                      <label>Comment (Fixed):</label>
                      <input
                        type="text"
                        value={ad.comment_fix || ''}
                        onChange={(e) => handleChangeField(ad.id, 'comment_fix', e.target.value)}
                        className="animated"
                      />
                    </div>
                    <button type="submit" className="advanced">Save</button>
                    {ad.ad_status === 'successful' && userRole === "admin" && (
                      <button type="button" className="advanced" onClick={() => publishToChannel(ad.id)}>
                        Publish to Channel
                      </button>
                    )}
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* Template Management Section for Admin */}
      {userRole === "admin" && (
        <section className="template-management card">
          <h2>Manage Templates</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            saveTemplate();
          }}>
            <input
              type="text"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              name="title"
              placeholder="Template Title"
              required
              className="animated"
            />
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              name="content"
              placeholder="Template Content"
              required
              className="animated"
            ></textarea>
            <button type="submit" className="advanced">{selectedTemplate ? "Update" : "Add"} Template</button>
          </form>
          <ul>
            {templates.map(template => (
              <li key={template.id}>
                <h3>{template.name}</h3>
                <p>{template.template_text}</p>
                <button className="advanced" onClick={() => editTemplate(template)}>Edit</button>
                <button className="advanced" onClick={() => deleteTemplate(template.id)}>Delete</button>
              </li>
            ))}
          </ul>
          <div className="publish-section">
            <label htmlFor="templateSelect">Select Template for Publishing:</label>
            <select
              id="templateSelect"
              value={selectedTemplateName}
              onChange={(e) => setSelectedTemplateName(e.target.value)}
              className="animated"
            >
              {templates.map(template => (
                <option key={template.id} value={template.name}>{template.name}</option>
              ))}
            </select>
            <button className="advanced" onClick={() => publishToChannel(/* Provide an apartment id as needed */)}>
              Publish to Channel
            </button>
          </div>
        </section>
      )}
    </div>
    </DragDropContext>

  );
};
export default MainPage;
