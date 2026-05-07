// ============================================================
// src/pages/abogado/Consultas.jsx
// Gestión completa de consultas desde el lado del abogado
// Confirmar, completar, cancelar y ver detalles de cada turno
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Video, Building2, ChevronDown,
  Check, X, Clock, Phone, MessageSquare, Search
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Badge de estado
// ─────────────────────────────────────────────────────────────
function BadgeEstado({ estado }) {
  const mapa = {
    pendiente:  { clase: 'badge-pendiente',  label: 'Pendiente' },
    confirmada: { clase: 'badge-confirmada', label: 'Confirmada' },
    completada: { clase: 'badge-completada', label: 'Completada' },
    cancelada:  { clase: 'badge-cancelada',  label: 'Cancelada' },
    no_asistio: { clase: 'badge-cancelada',  label: 'No asistió' },
  };
  const { clase, label } = mapa[estado] || { clase: 'badge-pendiente', label: estado };
  return <span className={clase}>{label}</span>;
}

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de consulta con acciones
// ─────────────────────────────────────────────────────────────
function TarjetaConsulta({ consulta, onAccion }) {
  const [expandida,    setExpandida]    = useState(false);
  const [linkReunion,  setLinkReunion]  = useState(consulta.link_reunion || '');
  const [procesando,   setProcesando]   = useState(false);

  const fecha   = new Date(consulta.fecha_hora);
  const pasada  = isPast(fecha);

  // Ejecutar una acción de cambio de estado
  const ejecutarAccion = async (estado, extras = {}) => {
    setProcesando(true);
    try {
      await onAccion(consulta.id, estado, { link_reunion: linkReunion, ...extras });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* ── Cabecera siempre visible ────────────────────── */}
      <div className="p-5">
        <div className="flex items-start gap-4 flex-wrap">

          {/* Bloque de fecha */}
          <div className={`shrink-0 text-center rounded-xl px-3 py-2 min-w-[56px] ${
            pasada && consulta.estado === 'confirmada' ? 'bg-amber-50' : 'bg-navy-50'
          }`}>
            <p className="font-body text-xs text-slate-500 uppercase tracking-wider">
              {format(fecha, 'MMM', { locale: es })}
            </p>
            <p className="font-display font-bold text-navy-900 text-xl leading-none">
              {format(fecha, 'd')}
            </p>
            <p className="font-body text-xs text-slate-400 mt-0.5">
              {format(fecha, "HH:mm")}
            </p>
          </div>

          {/* Datos del cliente */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                {/* Nombre del cliente */}
                <p className="font-body font-semibold text-navy-900">
                  {consulta.cliente_nombre} {consulta.cliente_apellido}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {/* Modalidad */}
                  <span className="flex items-center gap-1 font-body text-xs text-slate-500">
                    {consulta.tipo === 'online'
                      ? <><Video size={11} className="text-navy-700" /> Online</>
                      : <><Building2 size={11} className="text-navy-700" /> Presencial</>
                    }
                  </span>
                  {/* Especialidad */}
                  {consulta.especialidad && (
                    <span className="font-body text-xs text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full">
                      {consulta.especialidad}
                    </span>
                  )}
                  {/* Teléfono si está disponible */}
                  {consulta.cliente_telefono && (
                    <a
                      href={`tel:${consulta.cliente_telefono}`}
                      className="flex items-center gap-1 font-body text-xs text-slate-500 hover:text-navy-900"
                    >
                      <Phone size={11} /> {consulta.cliente_telefono}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <BadgeEstado estado={consulta.estado} />
                {/* Botón expandir */}
                <button
                  onClick={() => setExpandida(!expandida)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${expandida ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* ── Acciones rápidas según estado ───────────── */}
            <div className="flex flex-wrap gap-2 mt-4">

              {/* Pendiente: Confirmar o Cancelar */}
              {consulta.estado === 'pendiente' && (
                <>
                  <button
                    onClick={() => ejecutarAccion('confirmada')}
                    disabled={procesando}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    <Check size={13} /> Confirmar turno
                  </button>
                  <button
                    onClick={() => ejecutarAccion('cancelada')}
                    disabled={procesando}
                    className="font-body text-xs text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <X size={13} className="inline mr-1" /> Rechazar
                  </button>
                </>
              )}

              {/* Confirmada: Completar o No asistió */}
              {consulta.estado === 'confirmada' && (
                <>
                  <button
                    onClick={() => ejecutarAccion('completada')}
                    disabled={procesando}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    <Check size={13} /> Marcar completada
                  </button>
                  <button
                    onClick={() => ejecutarAccion('no_asistio')}
                    disabled={procesando}
                    className="font-body text-xs text-amber-600 hover:text-amber-700 px-3 py-2 rounded-xl hover:bg-amber-50 transition-colors"
                  >
                    <Clock size={13} className="inline mr-1" /> No asistió
                  </button>
                  <button
                    onClick={() => ejecutarAccion('cancelada')}
                    disabled={procesando}
                    className="font-body text-xs text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}

              {/* Indicador de procesando */}
              {procesando && (
                <div className="flex items-center gap-2 text-xs text-slate-400 font-body">
                  <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detalle expandible ──────────────────────────── */}
      {expandida && (
        <div className="border-t border-slate-100 p-5 bg-slate-50 space-y-4 animate-slide-down">

          {/* Descripción del caso */}
          <div>
            <h4 className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Descripción del cliente
            </h4>
            <p className="font-body text-sm text-slate-700 leading-relaxed bg-white rounded-xl p-4 border border-slate-100">
              {consulta.descripcion}
            </p>
          </div>

          {/* Campo para link de reunión (solo en consultas online confirmadas) */}
          {consulta.tipo === 'online' && consulta.estado === 'confirmada' && (
            <div>
              <label className="input-label">
                Link de videollamada
                <span className="text-slate-400 font-normal ml-1">(Meet, Zoom, Teams...)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={linkReunion}
                  onChange={e => setLinkReunion(e.target.value)}
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={() => ejecutarAccion(consulta.estado)} // Guarda sin cambiar estado
                  disabled={procesando}
                  className="btn-secondary text-sm shrink-0"
                >
                  Guardar link
                </button>
              </div>
              {consulta.link_reunion && (
                <a
                  href={consulta.link_reunion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-body text-navy-700 hover:underline"
                >
                  <Video size={11} /> Ver enlace actual
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function ConsultasAbogado() {
  const [consultas,    setConsultas]    = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda,     setBusqueda]     = useState(''); // Búsqueda por nombre cliente

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const { data } = await api.get('/consultas', { params });
      setConsultas(data.consultas);
    } catch {
      toast.error('No se pudieron cargar las consultas.');
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  // Manejar cambios de estado desde las tarjetas
  const handleAccion = async (consultaId, nuevoEstado, extras = {}) => {
    try {
      await api.patch(`/consultas/${consultaId}/estado`, {
        estado: nuevoEstado,
        ...extras,
      });

      const mensajes = {
        confirmada: 'Consulta confirmada. Se notificó al cliente.',
        completada: 'Consulta marcada como completada.',
        cancelada:  'Consulta cancelada.',
        no_asistio: 'Marcado como "no asistió".',
      };
      toast.success(mensajes[nuevoEstado] || 'Estado actualizado.');
      cargar(); // Recargar la lista
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar la consulta.');
    }
  };

  // Filtrar por búsqueda de nombre del cliente (filtrado local, sin llamada extra)
  const consultasFiltradas = consultas.filter(c => {
    if (!busqueda) return true;
    const nombreCompleto = `${c.cliente_nombre} ${c.cliente_apellido}`.toLowerCase();
    return nombreCompleto.includes(busqueda.toLowerCase());
  });

  // Contadores para los badges de filtro
  const conteos = {
    '':          consultas.length,
    pendiente:   consultas.filter(c => c.estado === 'pendiente').length,
    confirmada:  consultas.filter(c => c.estado === 'confirmada').length,
    completada:  consultas.filter(c => c.estado === 'completada').length,
    cancelada:   consultas.filter(c => c.estado === 'cancelada').length,
  };

  const FILTROS = [
    { valor: '',           label: 'Todas' },
    { valor: 'pendiente',  label: 'Pendientes' },
    { valor: 'confirmada', label: 'Confirmadas' },
    { valor: 'completada', label: 'Completadas' },
    { valor: 'cancelada',  label: 'Canceladas' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="section-title">Mis consultas</h1>
          <p className="section-subtitle">
            Gestioná los turnos y consultas de tus clientes.
          </p>
        </div>

        {/* Barra de búsqueda + filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Búsqueda por nombre */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre del cliente..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Filtros por estado con contadores */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTROS.map(f => (
            <button
              key={f.valor}
              onClick={() => setFiltroEstado(f.valor)}
              className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all flex items-center gap-2 ${
                filtroEstado === f.valor
                  ? 'bg-navy-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300'
              }`}
            >
              {f.label}
              {/* Badge con conteo */}
              {conteos[f.valor] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filtroEstado === f.valor ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {conteos[f.valor]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Skeleton de carga */}
        {cargando && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-16 bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                    <div className="h-8 bg-slate-200 rounded w-1/2 mt-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && consultasFiltradas.length === 0 && (
          <div className="card p-16 text-center">
            <MessageSquare size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display text-xl text-navy-900 mb-2">
              {busqueda || filtroEstado ? 'Sin resultados' : 'No tenés consultas aún'}
            </p>
            <p className="font-body text-slate-500 text-sm">
              {busqueda || filtroEstado
                ? 'Probá con otro filtro o término de búsqueda.'
                : 'Las consultas de tus clientes aparecerán aquí.'
              }
            </p>
          </div>
        )}

        {/* Lista de consultas */}
        {!cargando && consultasFiltradas.length > 0 && (
          <div className="space-y-4">
            {consultasFiltradas.map(c => (
              <TarjetaConsulta
                key={c.id}
                consulta={c}
                onAccion={handleAccion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
