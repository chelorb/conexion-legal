// ============================================================
// src/pages/abogado/Agenda.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Users, Video,
  Lock, ArrowRight, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isSameDay, addMonths, subMonths, isPast
} from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const labelTipo = {
  congreso: 'Congreso', videoconferencia: 'Videoconferencia',
  seminario: 'Seminario', charla: 'Charla', curso: 'Curso',
};

// ─────────────────────────────────────────────────────────────
// Tarjeta de evento
// ─────────────────────────────────────────────────────────────
function TarjetaEvento({ evento, onInscribirse, onCancelar }) {
  const [procesando, setProcesando] = useState(false);
  const fecha     = new Date(evento.fecha_evento);
  const esPassado = isPast(fecha);
  const inscriptos= parseInt(evento.inscriptos || 0);
  const hayLugar  = !evento.cupos_max || inscriptos < evento.cupos_max;

  const handle = async (fn) => {
    setProcesando(true);
    try { await fn(evento.id); } finally { setProcesando(false); }
  };

  return (
    <div className={`card p-6 transition-all duration-200 ${esPassado ? 'opacity-60' : 'hover:shadow-card-hover'}`}>
      <div className="flex items-start gap-5">

        {/* Bloque fecha */}
        <div
          className="shrink-0 text-center rounded-2xl px-4 py-3 min-w-[64px]"
          style={isToday(fecha)
            ? { background: '#2C2B27', color: '#fff' }
            : { background: '#F0EFED' }
          }
        >
          <p className="font-body text-xs uppercase tracking-wider"
            style={{ color: isToday(fecha) ? 'rgba(255,255,255,0.6)' : '#8A8780' }}>
            {format(fecha, 'MMM', { locale: es })}
          </p>
          <p className="font-display font-bold text-2xl leading-none"
            style={{ color: isToday(fecha) ? '#fff' : '#1C1B18' }}>
            {format(fecha, 'd')}
          </p>
          <p className="font-body text-xs mt-1"
            style={{ color: isToday(fecha) ? 'rgba(255,255,255,0.6)' : '#8A8780' }}>
            {format(fecha, 'EEE', { locale: es })}
          </p>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Badge tipo */}
          <span
            className="inline-flex text-xs font-body font-medium px-2.5 py-1 rounded-full mb-3"
            style={{ background: 'rgba(184,96,48,0.1)', color: '#B86030' }}
          >
            {labelTipo[evento.tipo] || evento.tipo}
          </span>

          <h3 className="font-display font-semibold text-lg leading-snug mb-1" style={{ color: '#1C1B18' }}>
            {evento.titulo}
          </h3>

          {evento.descripcion && (
            <p className="font-body text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: '#8A8780' }}>
              {evento.descripcion}
            </p>
          )}

          {/* Detalles */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1.5 font-body text-xs" style={{ color: '#56534A' }}>
              <Clock size={13} style={{ color: '#B86030' }} />
              {format(fecha, "HH:mm 'hs'")}
              {evento.duracion_min && ` · ${evento.duracion_min} min`}
            </div>
            {evento.autor && (
              <div className="flex items-center gap-1.5 font-body text-xs" style={{ color: '#56534A' }}>
                <Users size={13} style={{ color: '#B86030' }} />
                {evento.autor}
              </div>
            )}
            {evento.cupos_max && (
              <div className="flex items-center gap-1.5 font-body text-xs"
                style={{ color: hayLugar ? '#16a34a' : '#dc2626' }}>
                <Users size={13} />
                {inscriptos}/{evento.cupos_max} cupos
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3">
            {evento.link_evento && evento.ya_inscripto && !esPassado && (
              <a href={evento.link_evento} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-body font-medium text-sm text-white transition-colors"
                style={{ background: '#2C2B27' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
              >
                <Video size={13} /> Unirse al evento
              </a>
            )}

            {!esPassado && (
              evento.ya_inscripto ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-xl"
                    style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>
                    <Check size={13} /> Inscripto/a
                  </div>
                  <button onClick={() => handle(onCancelar)} disabled={procesando}
                    className="text-xs font-body transition-colors"
                    style={{ color: '#8A8780' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
                  >
                    Cancelar inscripción
                  </button>
                </div>
              ) : (
                <button onClick={() => handle(onInscribirse)} disabled={procesando || !hayLugar}
                  className="px-4 py-2 rounded-xl font-body font-medium text-sm border transition-colors"
                  style={{ borderColor: '#D4D2CC', color: '#2C2B27' }}
                  onMouseEnter={e => { if (!procesando && hayLugar) e.currentTarget.style.background = '#F7F6F4'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  {procesando ? '...' : hayLugar ? 'Inscribirme' : 'Sin cupos'}
                </button>
              )
            )}

            {esPassado && (
              <span className="text-xs font-body" style={{ color: '#8A8780' }}>Evento finalizado</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Mini calendario
// ─────────────────────────────────────────────────────────────
function MiniCalendario({ mesActual, eventos, diaSeleccionado, onSeleccionarDia, onCambiarMes }) {
  const dias    = eachDayOfInterval({ start: startOfMonth(mesActual), end: endOfMonth(mesActual) });
  const offset  = startOfMonth(mesActual).getDay();
  const diasSem = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
  const conEventos = new Set(eventos.map(e => format(new Date(e.fecha_evento), 'yyyy-MM-dd')));

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onCambiarMes(-1)}
          className="p-1.5 rounded-lg transition-colors"
          onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; }}
        >
          <ChevronLeft size={16} style={{ color: '#56534A' }} />
        </button>
        <h3 className="font-display font-semibold text-base capitalize" style={{ color: '#1C1B18' }}>
          {format(mesActual, 'MMMM yyyy', { locale: es })}
        </h3>
        <button onClick={() => onCambiarMes(1)}
          className="p-1.5 rounded-lg transition-colors"
          onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; }}
        >
          <ChevronRight size={16} style={{ color: '#56534A' }} />
        </button>
      </div>

      {/* Días de semana */}
      <div className="grid grid-cols-7 mb-2">
        {diasSem.map(d => (
          <div key={d} className="text-center font-body text-xs py-1" style={{ color: '#8A8780' }}>{d}</div>
        ))}
      </div>

      {/* Grilla */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
        {dias.map(dia => {
          const key      = format(dia, 'yyyy-MM-dd');
          const tieneEv  = conEventos.has(key);
          const esHoy    = isToday(dia);
          const esSelec  = diaSeleccionado && isSameDay(dia, diaSeleccionado);

          return (
            <button
              key={key}
              onClick={() => onSeleccionarDia(esSelec ? null : dia)}
              className="relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-body transition-all"
              style={
                esSelec ? { background: '#2C2B27', color: '#fff' }
                : esHoy ? { background: 'rgba(44,43,39,0.08)', color: '#1C1B18', fontWeight: 500 }
                : { color: '#56534A' }
              }
              onMouseEnter={e => { if (!esSelec && !esHoy) e.currentTarget.style.background = '#F0EFED'; }}
              onMouseLeave={e => { if (!esSelec && !esHoy) e.currentTarget.style.background = ''; }}
            >
              {format(dia, 'd')}
              {tieneEv && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: esSelec ? '#C4522E' : '#B86030' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#F0EFED' }}>
        <div className="w-2 h-2 rounded-full" style={{ background: '#B86030' }} />
        <span className="font-body text-xs" style={{ color: '#8A8780' }}>Día con evento</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function Agenda() {
  const [eventos,        setEventos]        = useState([]);
  const [cargando,       setCargando]       = useState(true);
  const [sinAcceso,      setSinAcceso]      = useState(false);
  const [mesActual,      setMesActual]      = useState(new Date());
  const [diaSeleccionado, setDiaSel]        = useState(null);
  const [soloMisEventos, setSoloMios]       = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/agenda/todos');
      setEventos(data.eventos);
    } catch (err) {
      if (err.response?.status === 403) setSinAcceso(true);
      else toast.error('No se pudieron cargar los eventos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleInscribirse = async (id) => {
    try {
      await api.post(`/agenda/${id}/inscribirse`);
      toast.success('¡Inscripción confirmada!');
      cargar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al inscribirse.'); }
  };

  const handleCancelar = async (id) => {
    try {
      await api.delete(`/agenda/${id}/inscribirse`);
      toast.success('Inscripción cancelada.');
      cargar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al cancelar.'); }
  };

  const eventosFiltrados = eventos.filter(e => {
    const fecha = new Date(e.fecha_evento);
    return isSameMonth(fecha, mesActual) &&
      (!diaSeleccionado || isSameDay(fecha, diaSeleccionado)) &&
      (!soloMisEventos || e.ya_inscripto);
  });

  const eventosMes = eventos.filter(e => isSameMonth(new Date(e.fecha_evento), mesActual));

  if (sinAcceso) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFED' }}>
      <div className="card p-12 max-w-md text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(44,43,39,0.06)' }}>
          <Lock size={36} style={{ color: '#2C2B27' }} />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: '#1C1B18' }}>
          Agenda de eventos
        </h2>
        <p className="font-body mb-6 leading-relaxed" style={{ color: '#8A8780' }}>
          La agenda de seminarios y charlas es exclusiva para miembros del Plan Comunidad.
        </p>
        <Link to="/abogado/suscripcion" className="btn-primary w-full justify-center">
          Ver Plan Comunidad <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Agenda de eventos</h1>
            <p className="section-subtitle">Seminarios, charlas y congresos de la Comunidad.</p>
          </div>
          <button
            onClick={() => setSoloMios(!soloMisEventos)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-medium text-sm border transition-all shrink-0"
            style={{
              borderColor: soloMisEventos ? '#B86030' : '#D4D2CC',
              background: soloMisEventos ? 'rgba(184,96,48,0.08)' : '#fff',
              color: soloMisEventos ? '#B86030' : '#56534A',
            }}
          >
            <Check size={15} className={soloMisEventos ? '' : 'opacity-30'} />
            Mis inscripciones
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendario */}
          <div className="lg:col-span-1 space-y-4">
            <MiniCalendario
              mesActual={mesActual}
              eventos={eventosMes}
              diaSeleccionado={diaSeleccionado}
              onSeleccionarDia={setDiaSel}
              onCambiarMes={dir => setMesActual(prev => dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1))}
            />
            {/* Resumen */}
            <div className="card p-5">
              <p className="font-body text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8A8780' }}>
                Este mes
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Eventos programados', val: eventosMes.length },
                  { label: 'Mis inscripciones', val: eventosMes.filter(e => e.ya_inscripto).length },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-body text-sm" style={{ color: '#56534A' }}>{label}</span>
                    <span className="font-display font-bold" style={{ color: '#1C1B18' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de eventos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold" style={{ color: '#1C1B18' }}>
                {diaSeleccionado
                  ? `Eventos del ${format(diaSeleccionado, "d 'de' MMMM", { locale: es })}`
                  : `Eventos de ${format(mesActual, 'MMMM yyyy', { locale: es })}`
                }
              </h2>
              {diaSeleccionado && (
                <button onClick={() => setDiaSel(null)}
                  className="text-xs font-body transition-colors"
                  style={{ color: '#8A8780' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
                >
                  Ver todos
                </button>
              )}
            </div>

            {cargando && (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="card p-6 animate-pulse flex gap-5">
                    <div className="w-16 h-20 rounded-2xl shrink-0" style={{ background: '#E8E6E3' }} />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 rounded w-2/3" style={{ background: '#E8E6E3' }} />
                      <div className="h-3 rounded" style={{ background: '#E8E6E3' }} />
                      <div className="h-3 rounded w-1/2" style={{ background: '#E8E6E3' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!cargando && eventosFiltrados.length === 0 && (
              <div className="card p-14 text-center">
                <Calendar size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
                <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>
                  {diaSeleccionado ? 'Sin eventos ese día' : 'Sin eventos este mes'}
                </p>
                <p className="font-body text-sm" style={{ color: '#8A8780' }}>
                  Navegá a otros meses para ver más eventos.
                </p>
              </div>
            )}

            {!cargando && eventosFiltrados.map(e => (
              <TarjetaEvento key={e.id} evento={e}
                onInscribirse={handleInscribirse}
                onCancelar={handleCancelar}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
