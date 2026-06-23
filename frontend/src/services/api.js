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
// Maneja errores de autenticación de forma global.
// Distingue entre dos tipos de cierre de sesión para mostrar
// el mensaje correcto en la pantalla de login:
//
//   SESSION_INVALIDADA → el usuario inició sesión en otro dispositivo
//   (cualquier otro 401) → el JWT expiró o es inválido
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar storage en cualquier caso de 401
      localStorage.removeItem('cl_token');
      localStorage.removeItem('cl_usuario');

      // Solo redirigir si no estamos ya en login (evitar loops)
      if (!window.location.pathname.includes('/login')) {
        const codigo = error.response?.data?.codigo;

        if (codigo === 'SESSION_INVALIDADA') {
          // El mismo usuario inició sesión desde otro dispositivo
          window.location.href = '/login?sesion_cerrada=otro_dispositivo';
        } else {
          // JWT expirado normalmente
          window.location.href = '/login?sesion_expirada=1';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
