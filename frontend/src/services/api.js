import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request Interceptor: inject authorization token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ems_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: standardize error responses
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        success: false,
        message: 'Network error or server unreachable. Please check backend connection.',
        statusCode: 0
      });
    }

    // Standardized server error response
    const { status, data } = error.response;

    if (status === 401) {
      // Optional: Clear token or notify auth context on unauthorized
      localStorage.removeItem('ems_auth_token');
    }

    return Promise.reject({
      success: false,
      statusCode: status,
      message: data?.message || 'An unexpected error occurred',
      errors: data?.errors || []
    });
  }
);

export default api;
