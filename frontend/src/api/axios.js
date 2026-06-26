import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { hostname, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    return `http://${hostname}:5000/api`;
  }
  return `${origin}/_/backend/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
});

// Attach JWT token and Tenant ID to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Extract tenant ID from subdomain or local storage
  const hostname = window.location.hostname;
  let tenantId = localStorage.getItem('tenant_id');
  
  if (!tenantId && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      tenantId = parts[0]; // e.g. "schoolname" from "schoolname.schoolsaas.com"
    }
  }
  
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  } else {
    // Fallback for local development if not set
    config.headers['x-tenant-id'] = 'default-tenant';
  }
  
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
