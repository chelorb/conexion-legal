import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export function useNotificaciones(usuario) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas,       setNoLeidas]       = useState(0);
  const socketRef  = useRef(null);
  const usuarioId  = usuario?.id;

  // ── Carga inicial desde la API ───────────────────────────────
  const cargar = useCallback(async () => {
    if (!usuarioId) return;
    try {
      const { data } = await api.get('/notificaciones');
      const lista   = data.notificaciones || [];
      setNotificaciones(lista);
      // Calcular no leídas directamente del array (más confiable)
      setNoLeidas(lista.filter(n => !n.leida).length);
    } catch {}
  }, [usuarioId]);

  // ── Cargar cuando el usuario cambia (login/logout) ───────────
  useEffect(() => {
    cargar();
  }, [cargar]);

  // ── Conectar socket cuando hay usuario ───────────────────────
  useEffect(() => {
    if (!usuarioId) {
      // Limpiar estado si el usuario se desloguea
      setNotificaciones([]);
      setNoLeidas(0);
      return;
    }

    const token = localStorage.getItem('cl_token');
    if (!token) return;

    // Desconectar socket anterior si existe
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SOCKET_URL, {
      auth:              { token },
      transports:        ['polling', 'websocket'],
      reconnection:      true,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔔 Socket conectado, cargando notificaciones...');
      cargar();
    });

    socket.on('connect_error', (err) => {
      console.warn('🔔 Socket error:', err.message);
    });

    // Nueva notificación en tiempo real
    socket.on('notificacion', (notif) => {
      setNotificaciones(prev => [notif, ...prev].slice(0, 30));
      setNoLeidas(prev => prev + 1);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [usuarioId]); // Solo reconectar si cambia el usuario

  // ── Marcar una como leída ─────────────────────────────────────
  const marcarLeida = useCallback(async (id) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`);
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  // ── Marcar todas como leídas ──────────────────────────────────
  const marcarTodasLeidas = useCallback(async () => {
    try {
      await api.patch('/notificaciones/leer-todas');
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch {}
  }, []);

  return { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, cargar };
}

