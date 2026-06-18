import axios from './axios';

const API_URL = '/api/upload';

// Helper to determine file type category from extension
const getFileTypeCategory = (file) => {
  if (!file || !file.name) return 'image';
  const ext = file.name.split('.').pop().toLowerCase();
  const cadExts = ['stl', 'step', 'stp', 'iges', 'igs', 'obj', '3mf', 'dxf', 'dwg'];
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'ppt', 'pptx'];
  
  if (cadExts.includes(ext)) return ext; // pass exact extension as type
  if (docExts.includes(ext)) return 'document';
  return 'image';
};

export const uploadSingleImage = async (file, folder = 'images', token) => {
  const formData = new FormData();
  formData.append('image', file);

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
    params: {
      folder: folder
    }
  };

  const response = await axios.post(`${API_URL}/single?folder=${folder}`, formData, config);
  return response.data;
};

export const uploadMultipleImages = async (files, folder = 'images', token) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('images', file);
  });

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  };

  const response = await axios.post(`${API_URL}/multiple?folder=${folder}`, formData, config);

  return {
    ...response.data,
    urls: response.data.urls || response.data.files.map(file => file.url)
  };
};

export const deleteImage = async (imageUrl, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  
  const response = await axios.delete(`${API_URL}/delete`, {
    ...config,
    data: { imageUrl }
  });
  return response.data;
};

export const uploadFile = async (formData, onUploadProgress, options = {}) => {
  // Determine type from the actual file if not already set
  let type = formData.get('type') || 'image';
  const file = formData.get('file');
  if (file && file.name) {
    type = getFileTypeCategory(file);
    formData.set('type', type);
  }

  const folder = options.folder || formData.get('folder');
  let requestUrl = `${API_URL}/single?type=${encodeURIComponent(type)}`;
  if (folder) {
    requestUrl += `&folder=${encodeURIComponent(folder)}`;
  }
  
  const config = {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0, // No timeout — CAD files can be up to 150MB
  };

  if (typeof onUploadProgress === 'function') {
    config.onUploadProgress = (progressEvent) => {
      const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
      onUploadProgress(percent);
    };
  }

  const response = await axios.post(requestUrl, formData, config);
  return response.data;
};

export const uploadAPI = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  uploadFile,
  getFileTypeCategory
};