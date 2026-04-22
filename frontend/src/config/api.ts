import axios from 'axios';

// Используем переменную окружения
const API_URL = import.meta.env.VITE_API_URL || '/api/';

console.log('API URL:', API_URL);
console.log('Environment:', import.meta.env.MODE);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;