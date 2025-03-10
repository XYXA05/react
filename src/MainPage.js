// src/MainPage.js
import React, { useState, useEffect } from 'react';
import * as ApartmentService from './ApartmentService';
import RentalCalendar from './RentalCalendar'; // Make sure you have this component
import Navigation from './Navigation';

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
  // Added missing state variables for filter options:
  const [typeDealOptions, setTypeDealOptions] = useState([]);
  const [typeObjectOptions, setTypeObjectOptions] = useState([]);
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filterById, setFilterById] = useState(null);
  const [verificationApartments, setVerificationApartments] = useState([]);
  const [newTrapWord, setNewTrapWord] = useState('');
  const [newStopWord, setNewStopWord] = useState('');

  // State for free days filter (for calendar search)
  const [freeFrom, setFreeFrom] = useState('');
  const [freeTo, setFreeTo] = useState('');

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

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

  // (Other functions such as startParser, stopParser, auto-posting, watermark, etc. remain unchanged.)
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
                  <div className="image-gallery">
                    {ad.files &&
                      ad.files.map(image => (
                        <div key={image.id}>
                          <img src={image.file_path} alt={ad.title} className="gallery-image" />
                          {(userRole === "admin" || userRole === "team_leader") && (
                            <>
                              <button className="advanced" onClick={() => applyWatermark(image.id, ad.id)}>Apply Watermark</button>
                              <button className="advanced" onClick={() => removeWatermarkAI(image.id, ad.id)}>Remove Watermark (AI)</button>
                            </>
                          )}
                          <button className="advanced" onClick={() => deleteImage(image.id)}>Delete</button>
                          {/* Fix: use the current ad object instead of "prop" */}
                          <button onClick={() => setSelectedProperty(ad)}>View Calendar</button>
                        </div>
                      ))}
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
                      user_fix: ad.user_fix,
                      phone_fix: ad.phone_fix,
                    };
                    updateFixFields(ad.id, updateData);
                  }}>
                    <div className="apartment-info">
                      <label>Title (Fixed):</label>
                      <input
                        type="text"
                        value={ad.title_fix || ''}
                        onChange={(e) => {
                          ad.title_fix = e.target.value;
                          setApartments([...apartments]);
                        }}
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
  );
};

export default MainPage;
