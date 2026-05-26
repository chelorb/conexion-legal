// ============================================================
// src/pages/abogado/Consultas.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Search, Filter, Video, Building2,
  Check, X, Clock, RefreshCw, Link as LinkIcon,
  ChevronDown, Star, ArrowRight, MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ESTADOS = {
  pendiente:   { label: 'Pendiente',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  confirmada:  { label: 'Confirmada',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'  },
  completada:  { label: 'Completada',  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  cancelada:   { label: 'Cancelada',   bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200'   },
  no_asistio:  { label: 'No asistió',  bg: 'bg-slate-100', text: 'text-slate-600',  border: 'border-slate-200' },
};

function BadgeEstado({ estado }) {
  const cfg = ESTADOS[estado] || ESTADOS.pendiente;
  return (
    <span className={`text-xs font-body font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function TarjetaConsulta({ consulta, onAccion }) {
  const [expandida,    setExpandida]    = useState(false);
  const [linkVideo,    setLinkVideo]    = useState(consulta.link_videollamada || '');
  const [guardandoLink, setGuardandoLink] = useState(false);
  const fecha = new Date(consulta.fecha_hora);

  const guardarLink = async () => {
    setGuardandoLink(true);
    try {
      await api.patch(`/consultas/${consulta.id}/link`, { link_videollamada: linkVideo });
      toast.success('Link actualizado.');
    } catch { toast.error('Error al guardar el link.'); }
    finally { setGuardandoLink(false); }
  };

  return (
    <div className="card overflow-hidden">
      {/* Cabecera */}
      <div
        className="p-5 flex items-start gap-4 cursor-pointer transition-colors"
        onClick={() => setExpandida(!expandida)}
        onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
        onMouseLeave={e => { e.currentTarget.style.background = ''; }}
      >
        {/* Fecha */}
        <div
          className="shrink-0 text-center rounded-xl px-3 py-2 min-w-[52px]"
          style={{ background: '#F0EFED' }}
        >
          <p className="font-body text-xs uppercase tracking-wider" style={{ color: '#8A8780' }}>
            {format(fecha, 'MMM', { locale: es })}
          </p>
          <p className="font-display font-bold text-xl leading-none" style={{ color: '#1C1B18' }}>
            {format(fecha, 'd')}
          </p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
                {consulta.cliente_nombre} {consulta.cliente_apellido}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-body text-xs" style={{ color: '#56534A' }}>
                  {consulta.tipo === 'online'
                    ? <><Video size={11} style={{ color: '#B86030' }} /> Online</>
                    : <><Building2 size={11} style={{ color: '#B86030' }} /> Presencial</>
                  }
                </span>
                <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                  {format(fecha, "HH:mm 'hs'")}
                </span>
                {consulta.especialidad && (
                  <span
                    className="font-body text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(184,96,48,0.08)', color: '#B86030' }}
                  >
                    {consulta.especialidad}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <BadgeEstado estado={consulta.estado} />
              {/* Botón ver detalle */}
              <Link
                to={`/abogado/consultas/${consulta.id}`}
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-body text-xs font-medium border transition-colors shrink-0"
                style={{ borderColor: '#E8E6E3', color: '#56534A' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; e.currentTarget.style.color = '#1C1B18'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#56534A'; }}
              >
                Ver <ArrowRight size={11} />
              </Link>
              <ChevronDown
                size={16}
                className="transition-transform"
                style={{
                  color: '#8A8780',
                  transform: expandida ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detalle expandido */}
      {expandida && (
        <div className="px-5 pb-5 pt-0 border-t animate-slide-down" style={{ borderColor: '#F0EFED' }}>
          <div className="pt-4 space-y-4">

            {/* Descripción del problema */}
            {consulta.descripcion && (
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: '#8A8780' }}>
                  Motivo de consulta
                </p>
                <p className="font-body text-sm leading-relaxed p-3 rounded-xl"
                  style={{ background: '#F7F6F4', color: '#3A3832' }}>
                  {consulta.descripcion}
                </p>
              </div>
            )}

            {/* Link de videollamada */}
            {consulta.tipo === 'online' && consulta.estado === 'confirmada' && (
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: '#8A8780' }}>
                  Link de videollamada
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#8A8780' }} />
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={linkVideo}
                      onChange={e => setLinkVideo(e.target.value)}
                      className="input-field pl-9 text-sm"
                    />
                  </div>
                  <button
                    onClick={guardarLink}
                    disabled={guardandoLink}
                    className="px-4 py-2.5 rounded-xl font-body font-medium text-sm text-white transition-colors"
                    style={{ background: '#2C2B27' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                  >
                    {guardandoLink ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}

            {/* Calificación recibida */}
            {consulta.calificacion && (
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: '#8A8780' }}>
                  Calificación del cliente
                </p>
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#F7F6F4' }}>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14}
                        style={{
                          fill: i <= consulta.calificacion ? '#B86030' : '#E8E6E3',
                          color: i <= consulta.calificacion ? '#B86030' : '#E8E6E3',
                        }}
                      />
                    ))}
                  </div>
                  {consulta.comentario && (
                    <p className="font-body text-sm italic" style={{ color: '#56534A' }}>
                      "{consulta.comentario}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pt-1">
              {consulta.estado === 'pendiente' && (
                <>
                  {/* Pendiente: invitar a ir al detalle para leer y responder */}
                  <Link
                    to={`/abogado/consultas/${consulta.id}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium text-white transition-colors"
                    style={{ background: '#2C2B27' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                  >
                    <MessageSquare size={14} /> Ver y responder
                  </Link>
                  <button onClick={() => onAccion(consulta.id, 'confirmar')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium text-white transition-colors"
                    style={{ background: '#16a34a' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#15803d'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#16a34a'; }}
                  >
                    <Check size={14} /> Confirmar
                  </button>
                  <button onClick={() => onAccion(consulta.id, 'cancelar')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium border transition-colors"
                    style={{ borderColor: '#fca5a5', color: '#dc2626' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    <X size={14} /> Rechazar
                  </button>
                </>
              )}
              {consulta.estado === 'confirmada' && (
                <>
                  <button onClick={() => onAccion(consulta.id, 'completar')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium text-white transition-colors"
                    style={{ background: '#2C2B27' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                  >
                    <Check size={14} /> Marcar completada
                  </button>
                  <button onClick={() => onAccion(consulta.id, 'no_asistio')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium border transition-colors"
                    style={{ borderColor: '#D4D2CC', color: '#56534A' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    <Clock size={14} /> No asistió
                  </button>
                  <button onClick={() => onAccion(consulta.id, 'cancelar')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium border transition-colors"
                    style={{ borderColor: '#fca5a5', color: '#dc2626' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    <X size={14} /> Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConsultasAbogado() {
  const [consultas,      setConsultas]      = useState([]);
  const [cargando,       setCargando]       = useState(true);
  const [filtroEstado,   setFiltroEstado]   = useState('');
  const [busqueda,       setBusqueda]       = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      const { data } = await api.get('/consultas/mis-consultas', { params });
      setConsultas(data.consultas || []);
    } catch { toast.error('No se pudieron cargar las consultas.'); }
    finally { setCargando(false); }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const onAccion = async (id, accion) => {
    // Mapear la acción al estado que espera el backend
    const estadoMap = {
      confirmar:  'confirmada',
      completar:  'completada',
      cancelar:   'cancelada',
      no_asistio: 'no_asistio',
    };
    try {
      await api.patch(`/consultas/${id}/estado`, { estado: estadoMap[accion] });
      toast.success(
        accion === 'confirmar'  ? '✅ Consulta confirmada.' :
        accion === 'completar'  ? '✅ Consulta marcada como completada.' :
        accion === 'cancelar'   ? 'Consulta cancelada.' :
        'Estado actualizado.'
      );
      cargar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al actualizar.'); }
  };

  const conteos = Object.fromEntries(
    Object.keys(ESTADOS).map(e => [e, consultas.filter(c => c.estado === e).length])
  );

  const filtradas = consultas.filter(c => {
    const texto = `${c.cliente_nombre} ${c.cliente_apellido}`.toLowerCase();
    return (!busqueda || texto.includes(busqueda.toLowerCase()));
  });

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Mis consultas</h1>
            <p className="section-subtitle">Gestioná tus consultas y turnos.</p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {/* Tabs de estado */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFiltroEstado('')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all"
            style={!filtroEstado
              ? { background: '#2C2B27', color: '#fff' }
              : { background: '#fff', color: '#56534A', border: '1px solid #E8E6E3' }
            }
          >
            Todas
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={!filtroEstado
                ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                : { background: '#F0EFED', color: '#8A8780' }
              }>
              {consultas.length}
            </span>
          </button>
          {Object.entries(ESTADOS).map(([estado, cfg]) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all"
              style={filtroEstado === estado
                ? { background: '#2C2B27', color: '#fff' }
                : { background: '#fff', color: '#56534A', border: '1px solid #E8E6E3' }
              }
            >
              {cfg.label}
              {conteos[estado] > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={filtroEstado === estado
                    ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                    : { background: '#F0EFED', color: '#8A8780' }
                  }>
                  {conteos[estado]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
          <input type="text" placeholder="Buscar por nombre del cliente..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="input-field pl-10" />
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-14 h-14 rounded-xl shrink-0" style={{ background: '#E8E6E3' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                  <div className="h-3 rounded w-1/4" style={{ background: '#E8E6E3' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin consultas */}
        {!cargando && filtradas.length === 0 && (
          <div className="card p-16 text-center">
            <Calendar size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>Sin consultas</p>
            <p className="font-body text-sm" style={{ color: '#8A8780' }}>
              {busqueda || filtroEstado ? 'Probá con otros filtros.' : 'Aún no tenés consultas registradas.'}
            </p>
          </div>
        )}

        {/* Lista */}
        {!cargando && filtradas.length > 0 && (
          <div className="space-y-4">
            {filtradas.map(c => (
              <TarjetaConsulta key={c.id} consulta={c} onAccion={onAccion} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
