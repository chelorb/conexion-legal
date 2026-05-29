// ============================================================
// src/services/api.js
// Instancia de Axios configurada para comunicarse con el backend
// Incluye interceptores para agregar el token y manejar errores 401
// ============================================================

import axios from 'axios';

// URL base de la API — viene de la variable de entorno de Vite
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000, // 15 segundos máximo de espera
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptor de REQUEST ──────────────────────────────────
// Agrega automáticamente el token JWT a cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cl_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Interceptor de RESPONSE ─────────────────────────────────
// Maneja errores de autenticación de forma global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el servidor devuelve 401 (no autorizado), cerrar sesión automáticamente
    if (error.response?.status === 401) {
      localStorage.removeItem('cl_token');
      localStorage.removeItem('cl_usuario');
      // Redirigir al login si no estamos ya ahí
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?sesion_expirada=true';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
