// ============================================================
// src/pages/cliente/DetalleConsulta.jsx
// Vista de detalle de una consulta para el cliente
// Puede leer los mensajes del abogado y responder
// Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, X, Video, Building2,
  Calendar, Send, MessageSquare, Shield,
  Clock, Check
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
        style={{ background: esPropio ? '#B86030' : '#2C2B27' }}
      >
        {mensaje.autor_nombre?.[0]}
      </div>

      {/* Contenido */}
      <div className={`max-w-[75%] flex flex-col gap-1 ${esPropio ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-3 rounded-2xl font-body text-sm leading-relaxed"
          style={esPropio
            ? { background: '#B86030', color: '#fff', borderBottomRightRadius: '4px' }
            : { background: '#fff', color: '#1C1B18', border: '1px solid #E8E6E3', borderBottomLeftRadius: '4px' }
          }
        >
          {mensaje.contenido}
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="font-body text-xs" style={{ color: '#8A8780' }}>
            {esPropio ? 'Vos' : `Dr./Dra. ${mensaje.autor_nombre}`}
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
// Página principal
// ─────────────────────────────────────────────────────────────
export default function DetalleConsultaCliente() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { usuario }    = useAuth();
  const mensajesEndRef = useRef(null);

  const [consulta,  setConsulta]  = useState(null);
  const [cargando,  setCargando]  = useState(true);
  const [mensaje,   setMensaje]   = useState('');
  const [enviando,  setEnviando]  = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get(`/consultas/${id}`);
      setConsulta(data.consulta);
    } catch {
      toast.error('No se pudo cargar la consulta.');
      navigate('/mis-consultas');
    } finally {
      setCargando(false);
    }
  }, [id, navigate]);

  useEffect(() => { cargar(); }, [cargar]);

  // Scroll al último mensaje
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consulta?.mensajes]);

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

  // Cancelar consulta
  const cancelarConsulta = async () => {
    if (!window.confirm('¿Estás seguro de que querés cancelar esta consulta?')) return;
    setCancelando(true);
    try {
      await api.patch(`/consultas/${id}/estado`, { estado: 'cancelada' });
      toast.success('Consulta cancelada.');
      await cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cancelar.');
    } finally {
      setCancelando(false);
    }
  };

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0EFED' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#2C2B27', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!consulta) return null;

  const fecha       = new Date(consulta.fecha_hora);
  const esFinalizada = ['completada', 'cancelada', 'no_asistio'].includes(consulta.estado);
  const puedeCancelar = ['pendiente', 'confirmada'].includes(consulta.estado);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-4xl">

        {/* Breadcrumb */}
        <Link
          to="/mis-consultas"
          className="inline-flex items-center gap-2 text-sm font-body mb-6 transition-colors"
          style={{ color: '#8A8780' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
        >
          <ArrowLeft size={16} /> Volver a mis consultas
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Info de la consulta ──────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-6">
              <h2 className="font-display font-semibold text-lg mb-4" style={{ color: '#1C1B18' }}>
                Tu consulta
              </h2>

              {/* Estado */}
              <div className="flex items-center justify-between mb-5">
                <BadgeEstado estado={consulta.estado} />
                <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                  {format(new Date(consulta.creado_en), "d MMM yyyy", { locale: es })}
                </span>
              </div>

              {/* Abogado */}
              <div
                className="flex items-center gap-3 mb-5 p-4 rounded-xl"
                style={{ background: '#F7F6F4' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: '#2C2B27' }}
                >
                  {consulta.abogado_avatar
                    ? <img src={consulta.abogado_avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="font-display font-bold text-white">
                        {consulta.abogado_nombre?.[0]}
                      </span>
                  }
                </div>
                <div>
                  <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
                    Dr./Dra. {consulta.abogado_nombre} {consulta.abogado_apellido}
                  </p>
                  <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>
                    {consulta.abogado_email}
                  </p>
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3">
                  <Calendar size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                  <div>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>Fecha</p>
                    <p className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>
                      {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="font-body text-sm" style={{ color: '#56534A' }}>
                      {format(fecha, "HH:mm 'hs'")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {consulta.tipo === 'online'
                    ? <Video size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                    : <Building2 size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                  }
                  <div>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>Modalidad</p>
                    <p className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>
                      {consulta.tipo === 'online' ? 'Online' : 'Presencial'}
                    </p>
                  </div>
                </div>

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

              {/* Tu descripción */}
              <div className="rounded-xl p-4 mb-5" style={{ background: '#F0EFED' }}>
                <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: '#8A8780' }}>
                  Tu descripción del caso
                </p>
                <p className="font-body text-sm leading-relaxed" style={{ color: '#3A3832' }}>
                  {consulta.descripcion}
                </p>
              </div>

              {/* Link de videollamada si la consulta está confirmada */}
              {consulta.tipo === 'online' && consulta.link_reunion && consulta.estado === 'confirmada' && (
                <a
                  href={consulta.link_reunion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-body font-medium text-sm text-white transition-colors mb-3"
                  style={{ background: '#2C2B27' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                >
                  <Video size={15} /> Unirse a la videollamada
                </a>
              )}

              {/* Cancelar */}
              {puedeCancelar && (
                <button
                  onClick={cancelarConsulta}
                  disabled={cancelando}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-body text-sm border transition-colors"
                  style={{ borderColor: '#fca5a5', color: '#dc2626' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <X size={14} />
                  {cancelando ? 'Cancelando...' : 'Cancelar consulta'}
                </button>
              )}

              {/* Estado pendiente: aclaración */}
              {consulta.estado === 'pendiente' && (
                <div
                  className="mt-4 flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <Clock size={14} className="shrink-0 mt-0.5" style={{ color: '#b45309' }} />
                  <p className="font-body text-xs leading-relaxed" style={{ color: '#92400e' }}>
                    Tu solicitud está esperando confirmación del abogado. Podés escribirle un mensaje mientras tanto.
                  </p>
                </div>
              )}

              {/* Confirmada */}
              {consulta.estado === 'confirmada' && (
                <div
                  className="mt-4 flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  <Check size={14} className="shrink-0 mt-0.5" style={{ color: '#1d4ed8' }} />
                  <p className="font-body text-xs leading-relaxed" style={{ color: '#1e40af' }}>
                    ¡Tu consulta fue confirmada! Recordá estar disponible en la fecha acordada.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Chat con el abogado ───────────────────────── */}
          <div className="lg:col-span-2">
            <div className="card flex flex-col" style={{ minHeight: '500px' }}>

              {/* Header */}
              <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: '#F0EFED' }}>
                <MessageSquare size={18} style={{ color: '#B86030' }} />
                <div>
                  <h3 className="font-display font-semibold" style={{ color: '#1C1B18' }}>
                    Conversación con Dr./Dra. {consulta.abogado_nombre}
                  </h3>
                  <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                    Mensajes privados entre vos y el abogado
                  </p>
                </div>
              </div>

              {/* Mensajes */}
              <div
                className="flex-1 overflow-y-auto p-5 space-y-4"
                style={{ maxHeight: '400px', background: '#FAFAF9' }}
              >
                {/* Sin mensajes */}
                {(!consulta.mensajes || consulta.mensajes.length === 0) && (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare size={36} className="mb-3" style={{ color: '#D4D2CC' }} />
                    <p className="font-body text-sm font-medium mb-1" style={{ color: '#1C1B18' }}>
                      Sin mensajes aún
                    </p>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                      {consulta.estado === 'pendiente'
                        ? 'El abogado puede escribirte antes de confirmar tu consulta. También podés escribirle vos.'
                        : 'Podés usar este espacio para comunicarte con el abogado.'
                      }
                    </p>
                  </div>
                )}

                {/* Burbujas */}
                {consulta.mensajes?.map(msg => (
                  <BurbujaMensaje
                    key={msg.id}
                    mensaje={msg}
                    esPropio={msg.autor_id === usuario?.id}
                  />
                ))}
                <div ref={mensajesEndRef} />
              </div>

              {/* Input */}
              {!esFinalizada ? (
                <div className="p-4 border-t" style={{ borderColor: '#F0EFED' }}>
                  <form onSubmit={enviarMensaje} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Escribí un mensaje al abogado..."
                      value={mensaje}
                      onChange={e => setMensaje(e.target.value)}
                      className="input-field flex-1"
                      disabled={enviando}
                    />
                    <button
                      type="submit"
                      disabled={enviando || !mensaje.trim()}
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white transition-colors disabled:opacity-40"
                      style={{ background: '#B86030' }}
                      onMouseEnter={e => { if (!enviando) e.currentTarget.style.background = '#8B4A1E'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}
                    >
                      {enviando
                        ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <Send size={16} />
                      }
                    </button>
                  </form>
                  <p className="font-body text-xs mt-2 text-center" style={{ color: '#B0AEA8' }}>
                    El abogado recibirá una notificación con tu mensaje
                  </p>
                </div>
              ) : (
                <div className="p-4 border-t text-center" style={{ borderColor: '#F0EFED' }}>
                  <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                    Esta consulta está finalizada. No se pueden enviar más mensajes.
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
