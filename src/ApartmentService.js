// src/ApartmentService.js
const BASE_URL = 'http://127.0.0.1:8000';
const apiUrl = `${BASE_URL}/get_orders_and_photo_all/`;

export const getVerificationAds = async () => {
  const response = await fetch(`${BASE_URL}/admin/verification_ads`);
  return response.json();
};

export const getUniqueValues = (data, key) => {
  return [...new Set(data.map(item => item[key]))];
};

export const addTrapWord = async (word) => {
  const response = await fetch(`${BASE_URL}/admin/add_trap/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word })
  });
  return response.json();
};

export const removeTrapWord = async (word) => {
  const response = await fetch(`${BASE_URL}/admin/remove_trap/${word}`, {
    method: 'DELETE'
  });
  return response.json();
};

export const approveApartment = async (id) => {
  const response = await fetch(`${BASE_URL}/admin/verify_ad/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: "relevant" })
  });
  return response.json();
};

export const rejectApartment = async (id) => {
  const response = await fetch(`${BASE_URL}/admin/verify_ad/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: "spam" })
  });
  return response.json();
};

export const runParser = async () => {
  const response = await fetch(`${BASE_URL}/admin/run_parser/`, { method: 'POST' });
  return response.json();
};

export const runAutoPosting = async () => {
  const response = await fetch(`${BASE_URL}/admin/start_auto_posting/`, { method: 'POST' });
  return response.json();
};

export const getApartments = async () => {
  const response = await fetch(apiUrl);
  return response.json();
};

export const autoAssignApartments = async () => {
  const response = await fetch(`${BASE_URL}/assign_apartments/auto`, { method: 'POST' });
  return response.json();
};

export const getApartmentsByStatus = async (status) => {
  const response = await fetch(`${BASE_URL}/apartments/${status}`);
  return response.json();
};

// ── New: applyWatermark & removeWatermarkAI ──────────────────────────────
export const applyWatermark = async (imageId, apartmentId) => {
  const response = await fetch(
    `${BASE_URL}/apartments/${apartmentId}/apply_watermark/${imageId}`,
    { method: 'PUT' }
  );
  if (!response.ok) {
    throw new Error('Failed to apply watermark');
  }
  return response.json();
};

export const removeWatermarkAI = async (imageId, apartmentId) => {
  const response = await fetch(
    `${BASE_URL}/apartments/${apartmentId}/remove_watermark_ai/${imageId}`,
    { method: 'PUT' }
  );
  if (!response.ok) {
    throw new Error('Failed to remove watermark using AI');
  }
  return response.json();
};
// ─────────────────────────────────────────────────────────────────────────

export const deleteImage = async (imageId) => {
  // point at /apartments/images/{imageId} instead of /images/{imageId}
  const response = await fetch(`${BASE_URL}/apartments/images/${imageId}`, {
       method: 'DELETE'
  });
  return response.json();
};

export const uploadImage = async (apartmentId, formData) => {
  const response = await fetch(`${apiUrl}${apartmentId}/upload_image`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};

export const updateImageOrder = async (imageId, order) => {
  const response = await fetch(`${BASE_URL}/images/${imageId}/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order })
  });
  return response.json();
};

export const reorderImages = async (apartmentId, orderUpdates) => {
  const response = await fetch(`${BASE_URL}/apartments/${apartmentId}/reorder_images`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderUpdates)
  });
  return response.json();
};

export const updateApartmentFixFields = async (apartmentId, updateData) => {
  const response = await fetch(`${BASE_URL}/apartments/${apartmentId}/update_fix_fields`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  return response.json();
};

export const updateApartmentStatus = async (apartmentId, newStatus) => {
  const response = await fetch(
    `${BASE_URL}/get_orders_and_photo_all/${apartmentId}/status?new_status=${newStatus}`,
    { method: 'PUT' }
  );
  return response.json();
};

export const getTemplates = async () => {
  const response = await fetch(`${BASE_URL}/templates`);
  return response.json();
};

export const createTemplate = async (data) => {
  const response = await fetch(`${BASE_URL}/templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const updateTemplate = async (templateId, data) => {
  const response = await fetch(`${BASE_URL}/templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const deleteTemplate = async (templateId) => {
  const response = await fetch(`${BASE_URL}/templates/${templateId}`, {
    method: 'DELETE'
  });
  return response.json();
};

export const publishToChannel = async (apartmentId, templateName) => {
  const url = `${BASE_URL}/get_orders_and_photo/publish_to_channel/${apartmentId}?template_name=${templateName}`;
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    throw new Error("Failed to publish to channel.");
  }
  return response.json();
};

export const getDistrictsAndCities = async () => {
  const data = await getApartments();
  const districtsSet = new Set();
  const citiesByDistrict = {};

  data.forEach(apartment => {
    const locationParts = apartment.location_date.split(', ');
    const district = locationParts[0];
    const city = locationParts[1] || '';
    districtsSet.add(district);

    if (!citiesByDistrict[district]) {
      citiesByDistrict[district] = [];
    }
    if (city && !citiesByDistrict[district].includes(city)) {
      citiesByDistrict[district].push(city);
    }
  });

  return {
    districts: Array.from(districtsSet),
    citiesByDistrict
  };
};

export const addStopWord = async (word) => {
  const response = await fetch(`${BASE_URL}/admin/add_stop_word/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word })
  });
  return response.json();
};

export const removeStopWord = async (word) => {
  const response = await fetch(`${BASE_URL}/admin/remove_stop_word/${word}`, {
    method: 'DELETE'
  });
  return response.json();
};

// (Optional) Export BASE_URL if you need it elsewhere
export { BASE_URL };
