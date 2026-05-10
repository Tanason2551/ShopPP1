import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessing via localhost, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Otherwise use the IP or hostname of the current URL
    return `http://${hostname}:5000/api`;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
});

// DEFAULT DEBUG TOKEN (Matches DEBUG_AUTH in backend)
api.defaults.headers.common['Authorization'] = `Bearer debug-token`;

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const getProducts = () => api.get('/products');
export const getCategories = () => api.get('/categories');
export const getProductByBarcode = (barcode: string) => api.get(`/products/barcode/${barcode}`);
export const createTransaction = (data: any) => api.post('/transactions', data);
export const getTransactions = () => api.get('/transactions');
export const cancelTransaction = (id: string, password: string) => api.delete(`/transactions/${id}`, { data: { password } });
export const getShopConfig = () => api.get('/shop');

export default api;
