// src/api/axiosConfig.js

import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach the token to headers
API.interceptors.request.use(
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

// Response interceptor to handle errors globally (optional)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized error - possibly token expired
      // Optionally, implement logout or token refresh
    }
    return Promise.reject(error);
  }
);

export default API;
