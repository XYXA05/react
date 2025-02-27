import React, { useState, useEffect } from 'react';
import * as ApartmentService from './ApartmentService';

const MainPage = () => {
  // State variables
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
  const [typeDealOptions, setTypeDealOptions] = useState([]);
  const [typeObjectOptions, setTypeObjectOptions] = useState([]);
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filterById, setFilterById] = useState(null);
  const [verificationApartments, setVerificationApartments] = useState([]);
  const [newTrapWord, setNewTrapWord] = useState('');
  const [newStopWord, setNewStopWord] = useState('');

  // useEffect acts like Angular's ngOnInit
  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    try {
      const verif = await ApartmentService.getVerificationAds();
      setVerificationApartments(verif);
      const data = await ApartmentService.getApartments();
      const modifiedData = data.map(apartment => ({ ...apartment, expanded: false }));
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
    data.forEach(apartment => {
      const parts = apartment.location_date.split(', ');
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
    const filtered = apartments.filter(apartment => {
      const priceUSD = convertToUSD(apartment.price);
      const parts = apartment.location_date.split(', ');
      const district = parts[0];
      const city = parts[1] || '';
      const matchesDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(district);
      const matchesCity = selectedCities.length === 0 || selectedCities.includes(city);
      return (
        (filterText === '' ||
          apartment.title.toLowerCase().includes(filterText.toLowerCase()) ||
          apartment.description.toLowerCase().includes(filterText.toLowerCase())) &&
        (typeDeal === '' || apartment.type_deal === typeDeal) &&
        (typeObject === '' || apartment.type_object === typeObject) &&
        (owner === '' || apartment.owner.toLowerCase().includes(owner.toLowerCase())) &&
        (rooms === '' || apartment.room === rooms) &&
        (filterById === null || apartment.id === filterById) &&
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

  // Parser and auto-posting methods
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

  // Watermark methods
  const addWatermarkToCanvas = (imagePath, imageId) => {
    const canvas = document.getElementById(`canvas_${imageId}`);
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagePath;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      ctx.font = `${img.width * 0.1}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Watermark: CompanyName', img.width / 2, img.height / 2);
    };
  };

  const applyWatermark = async (imageId, apartmentId) => {
    try {
      await fetch(`${ApartmentService.BASE_URL}/apartments/${apartmentId}/apply_watermark/${imageId}`, { method: 'PUT' });
      alert('Watermark applied successfully!');
      getAllAds();
    } catch (error) {
      console.error('Error applying watermark:', error);
    }
  };

  const removeWatermarkAI = async (imageId, apartmentId) => {
    try {
      await fetch(`${ApartmentService.BASE_URL}/apartments/${apartmentId}/remove_watermark_ai/${imageId}`, { method: 'PUT' });
      alert('Watermark removed successfully using AI!');
      getAllAds();
    } catch (error) {
      console.error('Error removing watermark using AI:', error);
    }
  };

  // File upload handling
  const onFileSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
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
        getAllAds();
      } catch (error) {
        console.error('Error uploading images:', error);
      }
    }
  };

  const deleteImage = async (imageId) => {
    try {
      await ApartmentService.deleteImage(imageId);
      getAllAds();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  // Functions for trap and stop words
  const addTrapWord = async () => {
    try {
      await ApartmentService.addTrapWord(newTrapWord);
      getAllAds();
      setNewTrapWord('');
    } catch (error) {
      console.error('Error adding trap word:', error);
    }
  };

  const removeTrapWord = async (word) => {
    try {
      await ApartmentService.removeTrapWord(word);
      getAllAds();
    } catch (error) {
      console.error('Error removing trap word:', error);
    }
  };

  const addStopWord = async () => {
    try {
      await ApartmentService.addStopWord(newStopWord);
      getAllAds();
      setNewStopWord('');
    } catch (error) {
      console.error('Error adding stop word:', error);
    }
  };

  const removeStopWord = async (word) => {
    try {
      await ApartmentService.removeStopWord(word);
      getAllAds();
    } catch (error) {
      console.error('Error removing stop word:', error);
    }
  };

  const approveApartment = async (apartmentId) => {
    try {
      await ApartmentService.approveApartment(apartmentId);
      getAllAds();
    } catch (error) {
      console.error('Error approving apartment:', error);
    }
  };

  const rejectApartment = async (apartmentId) => {
    try {
      await ApartmentService.rejectApartment(apartmentId);
      getAllAds();
    } catch (error) {
      console.error('Error rejecting apartment:', error);
    }
  };

  const getAllAds = () => {
    fetchInitialData();
  };

  const getAdsByStatus = async (status) => {
    try {
      const ads = await ApartmentService.getApartmentsByStatus(status);
      setFilteredApartments(ads);
    } catch (error) {
      console.error('Error getting ads by status:', error);
    }
  };

  // updateFixFields function
  const updateFixFields = async (apartmentId, updateData) => {
    try {
      await ApartmentService.updateApartmentFixFields(apartmentId, updateData);
      console.log("Apartment information updated successfully.");
      getAllAds();
    } catch (error) {
      console.error("Error updating apartment fix fields:", error);
    }
  };

  // Template methods
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

  // Handlers for multi-select inputs
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

  return (
    <div className="container admin-panel">
      <h1 className="animated-heading">Admin Panel - Apartments</h1>

      {/* Blacklist Management Section */}
      <section className="admin-section card">
        <h2>Blacklist Words (Trap)</h2>
        <input
          type="text"
          value={newTrapWord}
          onChange={(e) => setNewTrapWord(e.target.value)}
          placeholder="Enter trap word"
          className="animated"
        />
        <button className="advanced" onClick={addTrapWord}>Add to Blacklist</button>
      </section>

      {/* Stop Word Management Section */}
      <section className="admin-section card">
        <h2>Stop Words (Flag for Review)</h2>
        <input
          type="text"
          value={newStopWord}
          onChange={(e) => setNewStopWord(e.target.value)}
          placeholder="Enter stop word"
          className="animated"
        />
        <button className="advanced" onClick={addStopWord}>Add Stop Word</button>
      </section>

      {/* Ads Requiring Verification Section */}
      <section className="admin-section card">
        <h2>Ads Requiring Verification</h2>
        {verificationApartments.length === 0 ? (
          <div>No ads requiring verification.</div>
        ) : (
          verificationApartments.map(apartment => (
            <div key={apartment.id} className="apartment-item">
              <p>
                <strong>{apartment.title}</strong> (ID: {apartment.id})
              </p>
              <p>Status: {apartment.ad_status}</p>
              <p>Reason: Stop words detected</p>
              <button className="advanced" onClick={() => approveApartment(apartment.id)}>Approve</button>
              <button className="advanced" onClick={() => rejectApartment(apartment.id)}>Reject</button>
            </div>
          ))
        )}
      </section>

      {/* Parser and Auto-Posting Controls */}
      <section className="controls card">
        <h3>Parser Controls</h3>
        <button className="advanced" onClick={startParser}>Start Parser</button>
        <button className="advanced" onClick={stopParser}>Stop Parser</button>
        <h3>Auto-Posting Controls</h3>
        <button className="advanced" onClick={startAutoPosting}>Start Auto Posting</button>
        <button className="advanced" onClick={stopAutoPosting}>Stop Auto Posting</button>
      </section>

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
          <button className="advanced" onClick={getAllAds}>All Ads</button>
          <button className="advanced" onClick={() => getAdsByStatus('new')}>New Ads</button>
          <button className="advanced" onClick={() => getAdsByStatus('activation_soon')}>Activation Soon</button>
          <button className="advanced" onClick={() => getAdsByStatus('inactive')}>Inactive Ads</button>
          <button className="advanced" onClick={() => getAdsByStatus('successful')}>Successful Ads</button>
          <button className="advanced" onClick={() => getAdsByStatus('spam')}>Spam</button>
          <button className="advanced" onClick={autoAssign}>Distribute Apartments</button>
        </div>
      </section>

      {/* Apartments List Section */}
      <section className="apartments-list card">
        <h2>Apartments</h2>
        {filteredApartments.length === 0 ? (
          <div className="no-apartments">No apartments found.</div>
        ) : (
          filteredApartments.map(apartment => (
            <div key={apartment.id} className="apartment-item">
              <div
                className="apartment-header"
                onClick={() => {
                  apartment.expanded = !apartment.expanded;
                  setApartments([...apartments]);
                }}
              >
                <p><strong>{apartment.title}</strong></p>
                <p>ID: {apartment.id}</p>
                <p>Type Deal: {apartment.type_deal}</p>
                <p>Type Object: {apartment.type_object}</p>
                <p>Status: {apartment.ad_status}</p>
                <button className="advanced">{apartment.expanded ? 'Collapse' : 'Expand'}</button>
              </div>
              {apartment.expanded && (
                <div className="apartment-details">
                  <input type="file" multiple onChange={(e) => uploadImages(e, apartment.id)} className="animated"/>
                  <div className="image-gallery">
                    {apartment.files &&
                      apartment.files.map(image => (
                        <div key={image.id}>
                          <img src={image.file_path} alt={apartment.title} className="gallery-image" />
                          <button className="advanced" onClick={() => applyWatermark(image.id, apartment.id)}>Apply Watermark</button>
                          <button className="advanced" onClick={() => removeWatermarkAI(image.id, apartment.id)}>Remove Watermark (AI)</button>
                          <button className="advanced" onClick={() => deleteImage(image.id)}>Delete</button>
                        </div>
                      ))}
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const updateData = {
                      title_fix: apartment.title_fix,
                      price_fix: apartment.price_fix,
                      location_date_fix: apartment.location_date_fix,
                      features_fix: apartment.features_fix,
                      owner_fix: apartment.owner_fix,
                      square_fix: apartment.square_fix,
                      room_fix: apartment.room_fix,
                      residential_complex_fix: apartment.residential_complex_fix,
                      floor_fix: apartment.floor_fix,
                      superficiality_fix: apartment.superficiality_fix,
                      classs_fix: apartment.classs_fix,
                      url_fix: apartment.url_fix,
                      user_fix: apartment.user_fix,
                      phone_fix: apartment.phone_fix,
                      id_olx_fix: apartment.id_olx_fix,
                      comment_fix: apartment.comment_fix
                    };
                    updateFixFields(apartment.id, updateData);
                  }}>
                    <div className="apartment-info">
                      <label>Title (Fixed):</label>
                      <input
                        type="text"
                        value={apartment.title_fix || ''}
                        onChange={(e) => {
                          apartment.title_fix = e.target.value;
                          setApartments([...apartments]);
                        }}
                        className="animated"
                      />
                      {/* Repeat similar input blocks for other fix fields */}
                    </div>
                    <button type="submit" className="advanced">Save</button>
                    {apartment.ad_status === 'successful' && (
                      <button type="button" className="advanced" onClick={() => publishToChannel(apartment.id)}>
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

      {/* Template Management Section */}
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
          <button className="advanced" onClick={() => publishToChannel(/* Provide apartment id if needed */)}>
            Publish to Channel
          </button>
        </div>
      </section>
    </div>
  );
};

export default MainPage;
