import axios from 'axios';
import getConfig from 'next/config';

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig() || {};

const API_BASE_URL =
  typeof window === 'undefined'
    ? serverRuntimeConfig?.apiUrl || publicRuntimeConfig?.apiUrl || 'http://localhost:3000'
    : publicRuntimeConfig?.apiUrl || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Intercepteur
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export default apiClient;
