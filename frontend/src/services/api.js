import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
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

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/') {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        // Clear any existing tokens but don't redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// Authentication APIs - Admin only
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Donor APIs
export const donorAPI = {
  // Public endpoints (no auth required)
  getDonors: async (params = {}) => {
    const response = await api.get('/donors', { params });
    return response.data;
  },

  getDonorsByBloodType: async (bloodType, params = {}) => {
    const response = await api.get(`/donors/blood-type/${bloodType}`, { params });
    return response.data;
  },

  getDonorById: async (id) => {
    const response = await api.get(`/donors/${id}`);
    return response.data;
  },

  // Public statistics (no auth required)
  getPublicStats: async () => {
    const response = await api.get('/donors/public-stats');
    return response.data;
  },

  // Protected endpoints (auth required)
  createDonor: async (donorData) => {
    const response = await api.post('/donors', donorData);
    return response.data;
  },

  updateDonor: async (id, donorData) => {
    const response = await api.put(`/donors/${id}`, donorData);
    return response.data;
  },

  deleteDonor: async (id) => {
    const response = await api.delete(`/donors/${id}`);
    return response.data;
  },

  recordDonation: async (id, donationData) => {
    const response = await api.post(`/donors/${id}/donation`, donationData);
    return response.data;
  },

  deleteDonation: async (donorId, donationId) => {
    const response = await api.delete(`/donors/${donorId}/donation/${donationId}`);
    return response.data;
  },

  // Statistics endpoint
  getStats: async () => {
    const response = await api.get('/donors/stats');
    return response.data;
  },
};

// Blood types constant
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Utility functions
export const handleAPIError = (error) => {
  if (error.response?.status === 401) {
    if (error.response?.data?.message?.includes('user not found')) {
      return 'Your session is invalid. Please log in again.';
    } else if (error.response?.data?.message?.includes('Invalid token')) {
      return 'Your session has expired. Please log in again.';
    } else {
      return 'Authentication failed. Please log in again.';
    }
  } else if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.response?.data?.errors) {
    return error.response.data.errors.join(', ');
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

export default api; 