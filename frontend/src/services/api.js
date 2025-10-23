import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
};

// Agents API
export const agentsAPI = {
  getAgents: () => api.get('/agents'),
  createAgent: (agentData) => api.post('/agents', agentData),
};

// Lists API
export const listsAPI = {
  uploadCSV: (formData) => api.post('/lists/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDistributions: () => api.get('/lists'),
  getBatchDetails: (batchId) => api.get(`/lists/batch/${batchId}`),
  getMyLists: () => api.get('/lists/agent/my-lists'),
};

export default api;