// ============================================================
// src/pages/abogado/Agenda.jsx
// Agenda de eventos para miembros del Plan Comunidad
// Vista de calendario + lista de próximos eventos
// Solo accesible para abogados con plan Comunidad
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Users, Video,
  MapPin, Lock, ArrowRight, Check,
  ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isSameDay, addMonths, subMonths,
  isPast
} from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Colores por tipo de evento
// ─────────────────────────────────────────────────────────────
const COLORES_TIPO = {
  congreso:        'bg-purple-50 text-purple-700 border-purple-100',
  videoconferencia:'bg-blue-50   text-blue-700   border-blue-100',
  seminario:       'bg-gold-300/20 text-gold-700 border-gold-200',
  charla:          'bg-green-50  text-green-700  border-green-100',
  default:         'bg-navy-50   text-navy-700   border-navy-100',
};

const labelTipo = {
  congreso:        'Congreso',
  videoconferencia:'Videoconferencia',
  seminario:       'Seminario',
  charla:          'Charla',
  curso:           'Curso',
  podcast:         'Podcast',
};

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de evento individual
// ─────────────────────────────────────────────────────────────
function TarjetaEvento({ evento, onInscribirse, onCancelar }) {
  const [procesando, setProcesando] = useState(false);
  const fecha     = new Date(evento.fecha_evento);
  const esPassado = isPast(fecha);
  const color     = COLORES_TIPO[evento.tipo] || COLORES_TIPO.default;
  const inscriptos= parseInt(evento.inscriptos || 0);
  const hayLugar  = !evento.cupos_max || inscriptos < evento.cupos_max;

  const handleInscribirse = async () => {
    setProcesando(true);
    try {
      await onInscribirse(evento.id);
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelar = async () => {
    setProcesando(true);
    try {
      await onCancelar(evento.id);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className={`card p-6 transition-all duration-200 ${esPassado ? 'opacity-60' : 'hover:shadow-card-hover'}`}>
      <div className="flex items-start gap-5">

        {/* Bloque de fecha destacado */}
        <div className={`shrink-0 text-center rounded-2xl px-4 py-3 min-w-[64px] ${
          isToday(fecha) ? 'bg-navy-900 text-white' : 'bg-navy-50'
        }`}>
          <p className={`font-body text-xs uppercase tracking-wider ${isToday(fecha) ? 'text-white/70' : 'text-slate-400'}`}>
            {format(fecha, 'MMM', { locale: es })}
          </p>
          <p className={`font-display font-bold text-2xl leading-none ${isToday(fecha) ? 'text-white' : 'text-navy-900'}`}>
            {format(fecha, 'd')}
          </p>
          <p className={`font-body text-xs mt-1 ${isToday(fecha) ? 'text-white/70' : 'text-slate-400'}`}>
            {format(fecha, 'EEE', { locale: es })}
          </p>
        </div>

        {/* Contenido del evento */}
        <div className="flex-1 min-w-0">
          {/* Tipo de evento */}
          <span className={`inline-flex text-xs font-body font-medium px-2.5 py-1 rounded-full border ${color} mb-3`}>
            {labelTipo[evento.tipo] || evento.tipo}
          </span>

          <h3 className="font-display font-semibold text-navy-900 text-lg leading-snug mb-1">
            {evento.titulo}
          </h3>

          {evento.descripcion && (
            <p className="font-body text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">
              {evento.descripcion}
            </p>
          )}

          {/* Detalles del evento */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Horario */}
            <div className="flex items-center gap-1.5 font-body text-xs text-slate-500">
              <Clock size={13} className="text-navy-700 shrink-0" />
              {format(fecha, "HH:mm 'hs'")}
              {evento.duracion_min && ` · ${evento.duracion_min} min`}
            </div>

            {/* Ponente/autor */}
            {evento.autor && (
              <div className="flex items-center gap-1.5 font-body text-xs text-slate-500">
                <Users size={13} className="text-navy-700 shrink-0" />
                {evento.autor}
              </div>
            )}

            {/* Especialidad */}
            {evento.especialidad && (
              <div className="flex items-center gap-1.5 font-body text-xs text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full">
                {evento.especialidad}
              </div>
            )}

            {/* Inscriptos / cupos */}
            {evento.cupos_max && (
              <div className={`flex items-center gap-1.5 font-body text-xs ${hayLugar ? 'text-green-600' : 'text-red-500'}`}>
                <Users size={13} className="shrink-0" />
                {inscriptos}/{evento.cupos_max} cupos
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3">

            {/* Link al evento si está disponible */}
            {evento.link_evento && evento.ya_inscripto && !esPassado && (
              <a
                href={evento.link_evento}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs px-4 py-2"
              >
                <Video size={13} /> Unirse al evento
              </a>
            )}

            {/* Botón inscribirse / cancelar */}
            {!esPassado && (
              evento.ya_inscripto ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-body text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
                    <Check size={13} /> Inscripto/a
                  </div>
                  <button
                    onClick={handleCancelar}
                    disabled={procesando}
                    className="text-xs font-body text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Cancelar inscripción
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleInscribirse}
                  disabled={procesando || !hayLugar}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  {procesando
                    ? <div className="w-3 h-3 border border-current/40 border-t-current rounded-full animate-spin" />
                    : hayLugar ? 'Inscribirme' : 'Sin cupos'
                  }
                </button>
              )
            )}

            {/* Evento pasado */}
            {esPassado && (
              <span className="text-xs font-body text-slate-400">Evento finalizado</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: Mini calendario mensual
// ─────────────────────────────────────────────────────────────
function MiniCalendario({ mesActual, eventos, diaSeleccionado, onSeleccionarDia, onCambiarMes }) {
  // Generar todos los días del mes
  const diasDelMes = eachDayOfInterval({
    start: startOfMonth(mesActual),
    end:   endOfMonth(mesActual),
  });

  // Días de la semana abreviados
  const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  // Offset inicial (qué día de la semana empieza el mes)
  const offset = startOfMonth(mesActual).getDay();

  // Días que tienen eventos
  const diasConEventos = new Set(
    eventos.map(e => format(new Date(e.fecha_evento), 'yyyy-MM-dd'))
  );

  return (
    <div className="card p-5">
      {/* Cabecera del calendario */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onCambiarMes(-1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={16} className="text-slate-500" />
        </button>

        <h3 className="font-display font-semibold text-navy-900 text-base capitalize">
          {format(mesActual, 'MMMM yyyy', { locale: es })}
        </h3>

        <button
          onClick={() => onCambiarMes(1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronRight size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Nombres de los días */}
      <div className="grid grid-cols-7 mb-2">
        {diasSemana.map(d => (
          <div key={d} className="text-center font-body text-xs text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Celdas vacías al inicio */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Días del mes */}
        {diasDelMes.map(dia => {
          const key         = format(dia, 'yyyy-MM-dd');
          const tieneEvento = diasConEventos.has(key);
          const esHoy       = isToday(dia);
          const esSelec     = diaSeleccionado && isSameDay(dia, diaSeleccionado);

          return (
            <button
              key={key}
              onClick={() => onSeleccionarDia(esSelec ? null : dia)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-body transition-all ${
                esSelec
                  ? 'bg-navy-900 text-white font-medium'
                  : esHoy
                    ? 'bg-navy-100 text-navy-900 font-medium'
                    : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {format(dia, 'd')}
              {/* Punto indicador de evento */}
              {tieneEvento && (
                <div className={`absolute bottom-1 w-1 h-1 rounded-full ${
                  esSelec ? 'bg-gold-400' : 'bg-gold-500'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
        <div className="w-2 h-2 rounded-full bg-gold-500" />
        <span className="font-body text-xs text-slate-400">Día con evento</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function Agenda() {
  const { usuario }               = useAuth();
  const perfil                    = usuario?.perfil_abogado;

  const [eventos,       setEventos]       = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [sinAcceso,     setSinAcceso]     = useState(false);
  const [mesActual,     setMesActual]     = useState(new Date());
  const [diaSeleccionado, setDiaSel]     = useState(null);
  const [soloMisEventos, setSoloMios]    = useState(false);

  // Cargar todos los eventos (pasados y futuros para el calendario)
  const cargar = async () => {
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
  };

  useEffect(() => { cargar(); }, []);

  // Inscribirse a un evento
  const handleInscribirse = async (eventoId) => {
    try {
      await api.post(`/agenda/${eventoId}/inscribirse`);
      toast.success('¡Inscripción confirmada!');
      cargar(); // Recargar para actualizar el estado
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al inscribirse.');
    }
  };

  // Cancelar inscripción
  const handleCancelar = async (eventoId) => {
    try {
      await api.delete(`/agenda/${eventoId}/inscribirse`);
      toast.success('Inscripción cancelada.');
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cancelar.');
    }
  };

  // Filtrar eventos según día seleccionado y filtro personal
  const eventosFiltrados = eventos.filter(e => {
    const fecha = new Date(e.fecha_evento);
    const coincideMes = isSameMonth(fecha, mesActual);
    const coincideDia = !diaSeleccionado || isSameDay(fecha, diaSeleccionado);
    const coincideMios = !soloMisEventos || e.ya_inscripto;
    return coincideMes && coincideDia && coincideMios;
  });

  // Eventos del mes (para el calendario)
  const eventosMes = eventos.filter(e =>
    isSameMonth(new Date(e.fecha_evento), mesActual)
  );

  // ── Sin acceso por plan insuficiente ───────────────────────
  if (sinAcceso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-navy-900" />
          </div>
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-3">
            Agenda de eventos
          </h2>
          <p className="font-body text-slate-500 mb-6 leading-relaxed">
            La agenda de seminarios, charlas y congresos es exclusiva para miembros del Plan Comunidad.
          </p>
          <Link to="/abogado/suscripcion" className="btn-primary w-full justify-center">
            Ver Plan Comunidad <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Agenda de eventos</h1>
            <p className="section-subtitle">
              Seminarios, charlas y congresos de la Comunidad.
            </p>
          </div>

          {/* Filtro: solo mis inscripciones */}
          <button
            onClick={() => setSoloMios(!soloMisEventos)}
            className={`btn-secondary text-sm shrink-0 ${soloMisEventos ? 'bg-navy-50 border-navy-300' : ''}`}
          >
            <Check size={15} className={soloMisEventos ? 'text-navy-900' : 'text-slate-400'} />
            Mis inscripciones
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Calendario lateral ────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <MiniCalendario
              mesActual={mesActual}
              eventos={eventosMes}
              diaSeleccionado={diaSeleccionado}
              onSeleccionarDia={setDiaSel}
              onCambiarMes={(dir) => setMesActual(prev =>
                dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1)
              )}
            />

            {/* Resumen del mes */}
            <div className="card p-5">
              <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Este mes
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-slate-600">Eventos programados</span>
                  <span className="font-display font-bold text-navy-900">{eventosMes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-slate-600">Mis inscripciones</span>
                  <span className="font-display font-bold text-navy-900">
                    {eventosMes.filter(e => e.ya_inscripto).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Lista de eventos ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Título de sección según filtro */}
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-navy-900">
                {diaSeleccionado
                  ? `Eventos del ${format(diaSeleccionado, "d 'de' MMMM", { locale: es })}`
                  : `Eventos de ${format(mesActual, 'MMMM yyyy', { locale: es })}`
                }
              </h2>
              {diaSeleccionado && (
                <button
                  onClick={() => setDiaSel(null)}
                  className="text-xs font-body text-slate-400 hover:text-navy-900"
                >
                  Ver todos
                </button>
              )}
            </div>

            {/* Skeleton */}
            {cargando && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="flex gap-5">
                      <div className="w-16 h-20 bg-slate-200 rounded-2xl shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-slate-200 rounded w-2/3" />
                        <div className="h-3 bg-slate-200 rounded w-full" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sin eventos */}
            {!cargando && eventosFiltrados.length === 0 && (
              <div className="card p-14 text-center">
                <Calendar size={40} className="text-slate-300 mx-auto mb-4" />
                <p className="font-display text-xl text-navy-900 mb-2">
                  {diaSeleccionado
                    ? 'Sin eventos ese día'
                    : soloMisEventos
                      ? 'No estás inscripto a ningún evento este mes'
                      : 'Sin eventos programados este mes'
                  }
                </p>
                <p className="font-body text-slate-400 text-sm">
                  Navegá a otros meses para ver más eventos.
                </p>
              </div>
            )}

            {/* Lista de eventos */}
            {!cargando && eventosFiltrados.map(evento => (
              <TarjetaEvento
                key={evento.id}
                evento={evento}
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
