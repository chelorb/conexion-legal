// ============================================================
// src/pages/admin/Eventos.jsx
// Gestión de eventos desde el panel de administración
// El admin puede crear, editar y cancelar eventos de la agenda
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Plus, Edit2, X, Users,
  Clock, ExternalLink, RefreshCw, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

// Tipos de evento disponibles
const TIPOS_EVENTO = [
  { valor: 'congreso',         label: 'Congreso' },
  { valor: 'videoconferencia', label: 'Videoconferencia' },
  { valor: 'charla',           label: 'Charla' },
  { valor: 'curso',            label: 'Curso' },
];

// ─────────────────────────────────────────────────────────────
// Componente: Modal para crear o editar un evento
// ─────────────────────────────────────────────────────────────
function ModalEvento({ evento, onCerrar, onGuardado }) {
  const esEdicion = !!evento;
  const [guardando, setGuardando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: evento
      ? {
          titulo:       evento.titulo,
          tipo:         evento.tipo,
          descripcion:  evento.descripcion,
          autor:        evento.autor,
          especialidad: evento.especialidad,
          // Formatear fecha para el input datetime-local
          fecha_evento: evento.fecha_evento
            ? format(new Date(evento.fecha_evento), "yyyy-MM-dd'T'HH:mm")
            : '',
          link_evento:  evento.link_evento,
          duracion_min: evento.duracion_min,
          cupos_max:    evento.cupos_max,
        }
      : { tipo: 'congreso' }
  });

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      if (esEdicion) {
        await api.put(`/agenda/${evento.id}`, datos);
        toast.success('Evento actualizado correctamente.');
      } else {
        await api.post('/agenda', datos);
        toast.success('Evento creado correctamente.');
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar el evento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-2xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-navy-900 text-xl">
            {esEdicion ? 'Editar evento' : 'Nuevo evento'}
          </h3>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Título */}
          <div>
            <label className="input-label">Título del evento *</label>
            <input
              type="text"
              placeholder="Ej: Seminario sobre Reforma Procesal 2025"
              className={`input-field ${errors.titulo ? 'border-red-300' : ''}`}
              {...register('titulo', { required: 'El título es obligatorio' })}
            />
            {errors.titulo && <p className="input-error">{errors.titulo.message}</p>}
          </div>

          {/* Tipo y Fecha en fila */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tipo de evento *</label>
              <select className="input-field" {...register('tipo', { required: true })}>
                {TIPOS_EVENTO.map(t => (
                  <option key={t.valor} value={t.valor}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Fecha y hora *</label>
              <input
                type="datetime-local"
                className={`input-field ${errors.fecha_evento ? 'border-red-300' : ''}`}
                {...register('fecha_evento', { required: 'La fecha es obligatoria' })}
              />
              {errors.fecha_evento && <p className="input-error">{errors.fecha_evento.message}</p>}
            </div>
          </div>

          {/* Ponente y Especialidad */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                Ponente / Organizador
                <span className="text-slate-400 font-normal ml-1">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Dr. Carlos Falcón"
                className="input-field"
                {...register('autor')}
              />
            </div>
            <div>
              <label className="input-label">
                Área del derecho
                <span className="text-slate-400 font-normal ml-1">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Derecho Civil"
                className="input-field"
                {...register('especialidad')}
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="input-label">
              Descripción
              <span className="text-slate-400 font-normal ml-1">(opcional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describí brevemente el contenido del evento..."
              className="input-field resize-none"
              {...register('descripcion')}
            />
          </div>

          {/* Link y duración */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                Link del evento
                <span className="text-slate-400 font-normal ml-1">(opcional)</span>
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                className="input-field"
                {...register('link_evento')}
              />
            </div>
            <div>
              <label className="input-label">
                Duración (minutos)
                <span className="text-slate-400 font-normal ml-1">(opcional)</span>
              </label>
              <input
                type="number"
                min="15"
                max="480"
                placeholder="Ej: 90"
                className="input-field"
                {...register('duracion_min', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Cupos */}
          <div>
            <label className="input-label">
              Cupos máximos
              <span className="text-slate-400 font-normal ml-1">(dejar vacío para ilimitado)</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="Ej: 100"
              className="input-field"
              {...register('cupos_max', { valueAsNumber: true })}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : <><Check size={15} /> {esEdicion ? 'Guardar cambios' : 'Crear evento'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function AdminEventos() {
  const [eventos,     setEventos]     = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [modalAbierto, setModal]      = useState(false);
  const [eventoEdit,  setEventoEdit]  = useState(null); // null = nuevo, objeto = editar

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/agenda/todos');
      setEventos(data.eventos);
    } catch {
      toast.error('No se pudieron cargar los eventos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Cancelar (desactivar) un evento
  const cancelarEvento = async (eventoId, titulo) => {
    if (!window.confirm(`¿Cancelar el evento "${titulo}"? Los inscriptos serán notificados.`)) return;
    try {
      await api.delete(`/agenda/${eventoId}`);
      toast.success('Evento cancelado.');
      cargar();
    } catch {
      toast.error('Error al cancelar el evento.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de eventos</h1>
            <p className="section-subtitle">
              Creá y administrá la agenda de la Comunidad.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={() => { setEventoEdit(null); setModal(true); }}
              className="btn-primary gap-2"
            >
              <Plus size={16} /> Nuevo evento
            </button>
          </div>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin eventos */}
        {!cargando && eventos.length === 0 && (
          <div className="card p-16 text-center">
            <Calendar size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display text-xl text-navy-900 mb-2">Sin eventos creados</p>
            <p className="font-body text-slate-500 text-sm mb-6">
              Creá el primer evento para la agenda de la Comunidad.
            </p>
            <button
              onClick={() => { setEventoEdit(null); setModal(true); }}
              className="btn-primary"
            >
              <Plus size={16} /> Crear primer evento
            </button>
          </div>
        )}

        {/* Lista de eventos */}
        {!cargando && eventos.length > 0 && (
          <div className="space-y-4">
            {eventos.map(e => {
              const fecha      = new Date(e.fecha_evento);
              const inscriptos = parseInt(e.inscriptos || 0);

              return (
                <div key={e.id} className="card p-5 flex items-start gap-5">

                  {/* Bloque fecha */}
                  <div className="shrink-0 text-center bg-navy-50 rounded-xl px-4 py-3 min-w-[64px]">
                    <p className="font-body text-xs text-slate-400 uppercase tracking-wider">
                      {format(fecha, 'MMM', { locale: es })}
                    </p>
                    <p className="font-display font-bold text-navy-900 text-2xl leading-none">
                      {format(fecha, 'd')}
                    </p>
                  </div>

                  {/* Datos del evento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-body font-semibold text-navy-900">{e.titulo}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="font-body text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={11} /> {format(fecha, "HH:mm 'hs'")}
                            {e.duracion_min && ` · ${e.duracion_min}min`}
                          </span>
                          {e.autor && (
                            <span className="font-body text-xs text-slate-500">
                              {e.autor}
                            </span>
                          )}
                          <span className="font-body text-xs text-slate-500 flex items-center gap-1">
                            <Users size={11} />
                            {inscriptos} inscripto{inscriptos !== 1 ? 's' : ''}
                            {e.cupos_max ? ` / ${e.cupos_max}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2 shrink-0">
                        {e.link_evento && (
                          <a
                            href={e.link_evento}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-navy-900"
                            title="Ver enlace"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => { setEventoEdit(e); setModal(true); }}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-navy-900"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => cancelarEvento(e.id, e.titulo)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
                          title="Cancelar evento"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de crear/editar */}
      {modalAbierto && (
        <ModalEvento
          evento={eventoEdit}
          onCerrar={() => { setModal(false); setEventoEdit(null); }}
          onGuardado={cargar}
        />
      )}
    </div>
  );
}
