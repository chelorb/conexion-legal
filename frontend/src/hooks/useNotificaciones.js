import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export function useNotificaciones(usuario) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas,       setNoLeidas]       = useState(0);
  const socketRef = useRef(null);

  const cargar = useCallback(async () => {
    if (!usuario) return;
    try {
      const { data } = await api.get('/notificaciones');
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas || 0);
    } catch {}
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth:         { token },
      transports:   ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('connect', () => cargar());
    socket.on('notificacion', (notif) => {
      setNotificaciones(prev => [notif, ...prev].slice(0, 30));
      setNoLeidas(prev => prev + 1);
    });

    socketRef.current = socket;
    cargar();
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [usuario?.id]);

  const marcarLeida = useCallback(async (id) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`);
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    try {
      await api.patch('/notificaciones/leer-todas');
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch {}
  }, []);

  return { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, cargar };
}
