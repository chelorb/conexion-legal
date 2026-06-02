// ============================================================
// src/pages/abogado/DetalleConsulta.jsx
// Vista completa de una consulta para el abogado:
// - Lee la descripción del cliente
// - Puede confirmar, rechazar o cancelar
// - Puede enviar mensajes al cliente
// Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Check, X, Clock, Video,
  Building2, Send, Calendar, User,
  MessageSquare, AlertCircle, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Badge de estado
// ─────────────────────────────────────────────────────────────
function BadgeEstado({ estado }) {
  const mapa = {
    pendiente:   { label: 'Pendiente',   bg: 'rgba(245,158,11,0.1)',  color: '#b45309' },
    confirmada:  { label: 'Confirmada',  bg: 'rgba(59,130,246,0.1)',  color: '#1d4ed8' },
    completada:  { label: 'Completada',  bg: 'rgba(22,163,74,0.1)',   color: '#15803d' },
    cancelada:   { label: 'Cancelada',   bg: 'rgba(220,38,38,0.1)',   color: '#dc2626' },
    no_asistio:  { label: 'No asistió',  bg: 'rgba(100,116,139,0.1)', color: '#475569' },
  };
  const cfg = mapa[estado] || mapa.pendiente;
  return (
    <span className="font-body text-sm font-medium px-3 py-1.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Burbuja de mensaje
// ─────────────────────────────────────────────────────────────
function BurbujaMensaje({ mensaje, esPropio }) {
  return (
    <div className={`flex gap-3 ${esPropio ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-display font-bold"
        style={{ background: esPropio ? '#2C2B27' : '#B86030' }}
      >
        {mensaje.autor_nombre?.[0]}
      </div>

      {/* Contenido */}
      <div className={`max-w-[75%] ${esPropio ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className="px-4 py-3 rounded-2xl font-body text-sm leading-relaxed break-words overflow-hidden"
          style={esPropio
            ? { background: '#2C2B27', color: '#fff', borderBottomRightRadius: '4px' }
            : { background: '#fff', color: '#1C1B18', border: '1px solid #E8E6E3', borderBottomLeftRadius: '4px' }
          }
        >
          {mensaje.contenido}
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="font-body text-xs" style={{ color: '#8A8780' }}>
            {mensaje.autor_nombre}
          </span>
          <span className="font-body text-xs" style={{ color: '#B0AEA8' }}>
            {format(new Date(mensaje.creado_en), "d MMM · HH:mm", { locale: es })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: Sección de link de videollamada
// ─────────────────────────────────────────────────────────────
function LinkVideollamada({ consultaId, linkActual }) {
  const [link,     setLink]     = useState(linkActual || '');
  const [editando, setEditando] = useState(!linkActual); // abre directo si no tiene link
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    if (!link.trim()) { toast.error('Pegá la URL de la videollamada.'); return; }
    setGuardando(true);
    try {
      await api.patch(`/consultas/${consultaId}/link`, { link_videollamada: link.trim() });
      toast.success('Link guardado. El cliente ya puede verlo.');
      setEditando(false);
    } catch {
      toast.error('Error al guardar el link.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-xl p-4 mb-2" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
      <p className="font-body text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#1d4ed8' }}>
        🎥 Link de videollamada
      </p>

      {!editando ? (
        <div className="space-y-2">
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 font-body text-sm font-medium truncate transition-colors"
            style={{ color: '#1d4ed8' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <Video size={14} className="shrink-0" /> {link}
          </a>
          <button onClick={() => setEditando(true)}
            className="font-body text-xs transition-colors"
            style={{ color: '#8A8780' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
          >
            Cambiar link
          </button>
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-2">
          <input
            type="url"
            autoFocus
            placeholder="https://meet.google.com/... o https://zoom.us/j/..."
            value={link}
            onChange={e => setLink(e.target.value)}
            className="input-field text-sm"
          />
          <p className="font-body text-xs" style={{ color: '#8A8780' }}>
            El cliente verá este link para unirse a la reunión.
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-body font-medium text-sm text-white transition-colors"
              style={{ background: '#2C2B27' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
            >
              {guardando
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <><Video size={14} /> Guardar link</>
              }
            </button>
            {linkActual && (
              <button type="button" onClick={() => setEditando(false)}
                className="px-4 py-2.5 rounded-xl font-body text-sm border transition-colors"
                style={{ borderColor: '#E8E6E3', color: '#56534A' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function DetalleConsulta() {
  const { id }          = useParams();
  const navigate        = useNavigate();
  const { usuario }     = useAuth();
  const mensajesEndRef  = useRef(null);

  const [consulta,   setConsulta]   = useState(null);
  const [cargando,   setCargando]   = useState(true);
  const [mensaje,    setMensaje]    = useState('');
  const [enviando,   setEnviando]   = useState(false);
  const [procesando, setProcesando] = useState(null);

  // Cargar detalle de la consulta
  const cargar = async () => {
    try {
      const { data } = await api.get(`/consultas/${id}`);
      setConsulta(data.consulta);
    } catch {
      toast.error('No se pudo cargar la consulta.');
      navigate('/abogado/consultas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [id]);

  // Scroll al último mensaje cuando llegan nuevos
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consulta?.mensajes]);

  // Cambiar estado de la consulta
  const cambiarEstado = async (accion) => {
    setProcesando(accion);
    try {
      const estadoMap = {
        confirmar:   'confirmada',
        rechazar:    'cancelada',
        completar:   'completada',
        cancelar:    'cancelada',
        no_asistio:  'no_asistio',
      };
      await api.patch(`/consultas/${id}/estado`, {
        estado: estadoMap[accion],
      });
      toast.success(
        accion === 'confirmar'  ? '✅ Consulta confirmada. El cliente fue notificado.' :
        accion === 'rechazar'   ? 'Consulta rechazada.' :
        accion === 'completar'  ? '✅ Consulta marcada como completada.' :
        accion === 'no_asistio' ? 'Registrado: el cliente no asistió.' :
        'Estado actualizado.'
      );
      await cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar el estado.');
    } finally {
      setProcesando(null);
    }
  };

  // Enviar mensaje
  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;
    setEnviando(true);
    try {
      await api.post(`/consultas/${id}/mensajes`, { contenido: mensaje.trim() });
      setMensaje('');
      await cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  // ── Estado de carga ─────────────────────────────────────────
  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0EFED' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#2C2B27', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!consulta) return null;

  const esPendiente  = consulta.estado === 'pendiente';
  const esConfirmada = consulta.estado === 'confirmada';
  const esFinalizada = ['completada', 'cancelada', 'no_asistio'].includes(consulta.estado);
  const fecha        = new Date(consulta.fecha_hora);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-4xl">

        {/* ── Breadcrumb ──────────────────────────────────── */}
        <Link
          to="/abogado/consultas"
          className="inline-flex items-center gap-2 text-sm font-body mb-6 transition-colors"
          style={{ color: '#8A8780' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
        >
          <ArrowLeft size={16} /> Volver a consultas
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Columna izquierda: info del cliente + acciones ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Info del cliente */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-lg mb-4" style={{ color: '#1C1B18' }}>
                Solicitud de consulta
              </h2>

              {/* Estado */}
              <div className="flex items-center justify-between mb-5">
                <BadgeEstado estado={consulta.estado} />
                <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                  {format(new Date(consulta.creado_en), "d MMM yyyy", { locale: es })}
                </span>
              </div>

              {/* Cliente */}
              <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: '#F7F6F4' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#2C2B27' }}>
                  {consulta.cliente_avatar
                    ? <img src={consulta.cliente_avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                    : <span className="font-display font-bold text-white">
                        {consulta.cliente_nombre[0]}
                      </span>
                  }
                </div>
                <div>
                  <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
                    {consulta.cliente_nombre} {consulta.cliente_apellido}
                  </p>
                  {consulta.cliente_email && (
                    <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>
                      {consulta.cliente_email}
                    </p>
                  )}
                  {consulta.cliente_telefono && (
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                      {consulta.cliente_telefono}
                    </p>
                  )}
                </div>
              </div>

              {/* Detalles de la consulta */}
              <div className="space-y-3 mb-5">
                {/* Fecha y hora */}
                <div className="flex items-start gap-3">
                  <Calendar size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                  <div>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>Fecha solicitada</p>
                    <p className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>
                      {format(fecha, "EEEE d 'de' MMMM yyyy", { locale: es })}
                    </p>
                    <p className="font-body text-sm" style={{ color: '#56534A' }}>
                      {format(fecha, "HH:mm 'hs'")}
                      {consulta.duracion_min && ` · ${consulta.duracion_min} min`}
                    </p>
                  </div>
                </div>

                {/* Modalidad */}
                <div className="flex items-start gap-3">
                  {consulta.tipo === 'online'
                    ? <Video size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                    : <Building2 size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                  }
                  <div>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>Modalidad</p>
                    <p className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>
                      {consulta.tipo === 'online' ? 'Online (videollamada)' : 'Presencial'}
                    </p>
                  </div>
                </div>

                {/* Especialidad */}
                {consulta.especialidad && (
                  <div className="flex items-start gap-3">
                    <Shield size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                    <div>
                      <p className="font-body text-xs" style={{ color: '#8A8780' }}>Especialidad</p>
                      <p className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>
                        {consulta.especialidad}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción del cliente */}
              <div className="rounded-xl p-4 mb-5" style={{ background: '#F0EFED' }}>
                <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: '#8A8780' }}>
                  Descripción del caso
                </p>
                <p className="font-body text-sm leading-relaxed break-words" style={{ color: '#3A3832' }}>
                  {consulta.descripcion}
                </p>
              </div>

              {/* ── Acciones según estado ─────────────────── */}
              {esPendiente && (
                <div className="space-y-2">
                  <p className="font-body text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: '#8A8780' }}>
                    Acción requerida
                  </p>
                  <button
                    onClick={() => cambiarEstado('confirmar')}
                    disabled={!!procesando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm text-white transition-colors"
                    style={{ background: '#16a34a' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#15803d'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#16a34a'; }}
                  >
                    {procesando === 'confirmar'
                      ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <><Check size={16} /> Confirmar consulta</>
                    }
                  </button>
                  <button
                    onClick={() => cambiarEstado('rechazar')}
                    disabled={!!procesando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border transition-colors"
                    style={{ borderColor: '#fca5a5', color: '#dc2626' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    {procesando === 'rechazar'
                      ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                      : <><X size={16} /> Rechazar solicitud</>
                    }
                  </button>
                  <p className="font-body text-xs text-center mt-2" style={{ color: '#8A8780' }}>
                    También podés responder preguntas usando el chat →
                  </p>
                </div>
              )}

              {esConfirmada && (
                <div className="space-y-2">

                  {/* ── Link videollamada (solo si es online) ── */}
                  {consulta.tipo === 'online' && (
                    <LinkVideollamada consultaId={consulta.id} linkActual={consulta.link_reunion} />
                  )}

                  <p className="font-body text-xs font-semibold uppercase tracking-wider mb-3 pt-2"
                    style={{ color: '#8A8780' }}>
                    Actualizar estado
                  </p>
                  <button
                    onClick={() => cambiarEstado('completar')}
                    disabled={!!procesando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm text-white transition-colors"
                    style={{ background: '#2C2B27' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                  >
                    <Check size={16} /> Marcar como completada
                  </button>
                  <button
                    onClick={() => cambiarEstado('no_asistio')}
                    disabled={!!procesando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border transition-colors"
                    style={{ borderColor: '#E8E6E3', color: '#56534A' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    <Clock size={16} /> El cliente no asistió
                  </button>
                  <button
                    onClick={() => cambiarEstado('cancelar')}
                    disabled={!!procesando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border transition-colors"
                    style={{ borderColor: '#fca5a5', color: '#dc2626' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    <X size={16} /> Cancelar consulta
                  </button>
                </div>
              )}

              {esFinalizada && (
                <div className="text-center p-4 rounded-xl" style={{ background: '#F7F6F4' }}>
                  <p className="font-body text-sm" style={{ color: '#8A8780' }}>
                    Esta consulta está finalizada.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha: chat de mensajes ────────── */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="card flex flex-col" style={{ minHeight: '500px' }}>

              {/* Header del chat */}
              <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: '#F0EFED' }}>
                <MessageSquare size={18} style={{ color: '#B86030' }} />
                <div>
                  <h3 className="font-display font-semibold" style={{ color: '#1C1B18' }}>
                    Conversación con {consulta.cliente_nombre}
                  </h3>
                  <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                    Los mensajes son privados entre vos y el cliente
                  </p>
                </div>
              </div>

              {/* Área de mensajes */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4"
                style={{ maxHeight: '400px', background: '#FAFAF9' }}>

                {/* Sin mensajes */}
                {(!consulta.mensajes || consulta.mensajes.length === 0) && (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare size={36} className="mb-3" style={{ color: '#D4D2CC' }} />
                    <p className="font-body text-sm font-medium mb-1" style={{ color: '#1C1B18' }}>
                      Sin mensajes aún
                    </p>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                      {esPendiente
                        ? 'Podés hacerle preguntas al cliente antes de confirmar o rechazar.'
                        : 'Escribí un mensaje para comunicarte con el cliente.'
                      }
                    </p>
                  </div>
                )}

                {/* Burbujas de mensajes */}
                {consulta.mensajes?.map(msg => (
                  <BurbujaMensaje
                    key={msg.id}
                    mensaje={msg}
                    esPropio={msg.autor_id === usuario?.id}
                  />
                ))}
                <div ref={mensajesEndRef} />
              </div>

              {/* Input de mensaje */}
              {!esFinalizada ? (
                <div className="p-4 border-t" style={{ borderColor: '#F0EFED' }}>
                  <form onSubmit={enviarMensaje} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Escribí un mensaje al cliente..."
                      value={mensaje}
                      onChange={e => setMensaje(e.target.value)}
                      className="input-field flex-1"
                      disabled={enviando}
                    />
                    <button
                      type="submit"
                      disabled={enviando || !mensaje.trim()}
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white transition-colors disabled:opacity-40"
                      style={{ background: '#2C2B27' }}
                      onMouseEnter={e => { if (!enviando) e.currentTarget.style.background = '#1C1B18'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                    >
                      {enviando
                        ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <Send size={16} />
                      }
                    </button>
                  </form>
                  <p className="font-body text-xs mt-2 text-center" style={{ color: '#B0AEA8' }}>
                    Presioná Enter o el botón para enviar
                  </p>
                </div>
              ) : (
                <div className="p-4 border-t text-center" style={{ borderColor: '#F0EFED' }}>
                  <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                    La consulta está finalizada. No se pueden enviar más mensajes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
