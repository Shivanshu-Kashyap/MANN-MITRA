import { useState } from 'react';
import { API_BASE_URL } from '../utils/api';

const BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async (endpoint, method = 'GET', data = null, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const token = localStorage.getItem('Mann-Mitra_token') || sessionStorage.getItem('Mann-Mitra_token') || localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        config.body = JSON.stringify(data);
      }

      const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
      
      const response = await fetch(url, config);
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      setLoading(false);
      return {
        success: true,
        data: responseData.data || responseData,
        message: responseData.message,
        status: response.status,
      };
    } catch (err) {
      console.error('API call error:', err);
      setError(err.message);
      setLoading(false);
      return {
        success: false,
        error: err.message,
        data: null,
      };
    }
  };

  return { callApi, loading, error };
};