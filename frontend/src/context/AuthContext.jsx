// ============================================================
// src/context/AuthContext.jsx
// Estado global de autenticación accesible desde cualquier componente
// Usa React Context + localStorage para persistir la sesión
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Crear el contexto de autenticación
const AuthContext = createContext(null);

/**
 * Provider que envuelve toda la app y provee el estado de auth
 * Uso: <AuthProvider><App /></AuthProvider>
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null);
  const [cargando, setCargando] = useState(true); // true mientras verifica el token guardado

  // Al iniciar la app, verificar si hay un token guardado en localStorage
  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem('cl_token');

      if (!token) {
        setCargando(false);
        return;
      }

      try {
        // Verificar que el token sigue siendo válido con el servidor
        const { data } = await api.get('/auth/me');
        setUsuario(data.usuario);
      } catch {
        // Token inválido o expirado: limpiar localStorage
        localStorage.removeItem('cl_token');
        localStorage.removeItem('cl_usuario');
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, []);

  /**
   * Inicia sesión: guarda token y datos del usuario
   */
  const login = useCallback((token, datosUsuario) => {
    localStorage.setItem('cl_token', token);
    localStorage.setItem('cl_usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  }, []);

  /**
   * Cierra sesión: limpia todo el estado y localStorage
   */
  const logout = useCallback(() => {
    localStorage.removeItem('cl_token');
    localStorage.removeItem('cl_usuario');
    setUsuario(null);
  }, []);

  /**
   * Actualiza datos del usuario sin hacer logout
   * Útil cuando el usuario actualiza su perfil
   */
  const actualizarUsuario = useCallback((nuevosDatos) => {
    const usuarioActualizado = { ...usuario, ...nuevosDatos };
    localStorage.setItem('cl_usuario', JSON.stringify(usuarioActualizado));
    setUsuario(usuarioActualizado);
  }, [usuario]);

  // Helpers de rol para simplificar las condiciones en los componentes
  const esAdmin   = usuario?.rol === 'admin';
  const esAbogado = usuario?.rol === 'abogado';
  const esCliente = usuario?.rol === 'cliente';
  const estaAutenticado = !!usuario;

  const valor = {
    usuario,
    cargando,
    estaAutenticado,
    esAdmin,
    esAbogado,
    esCliente,
    login,
    logout,
    actualizarUsuario,
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar el contexto de autenticación en cualquier componente
 * Uso: const { usuario, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
