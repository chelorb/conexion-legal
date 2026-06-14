// ============================================================
// src/pages/admin/Foro.jsx — Paleta C: Gris carbón + Cobre
// Gestión del foro desde el panel de administración
// Permite: ver categorías, crear/editar/pausar/eliminar categorías,
//          ver hilos, cerrar/reabrir/fijar/eliminar hilos
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, FolderOpen, Plus, Edit2, X, Check,
  RefreshCw, Lock, Unlock, Pin, PinOff, Trash2,
  ChevronRight, BarChart2, Eye, MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Modal para crear o editar una categoría
// ─────────────────────────────────────────────────────────────
function ModalCategoria({ categoria, onCerrar, onGuardado }) {
  const esEdicion = !!categoria;
  const [guardando, setGuardando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: categoria || { icono: '💬', orden: 0 }
  });

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      if (esEdicion) {
        await api.put(`/admin/foro/categorias/${categoria.id}`, datos);
        toast.success('Categoría actualizada.');
      } else {
        await api.post('/admin/foro/categorias', datos);
        toast.success('Categoría creada.');
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="card w-full max-w-lg p-8 animate-slide-up">

        {/* Encabezado del modal */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>
            {esEdicion ? 'Editar categoría' : 'Nueva categoría'}
          </h3>
          <button
            onClick={onCerrar}
            className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
          >
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Nombre */}
          <div>
            <label className="input-label">Nombre *</label>
            <input
              type="text"
              placeholder="Ej: Jurisprudencia"
              className={`input-field ${errors.nombre ? 'border-red-300' : ''}`}
              {...register('nombre', { required: 'El nombre es obligatorio.' })}
            />
            {errors.nombre && <p className="input-error">{errors.nombre.message}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="input-label">
              Descripción{' '}
              <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Breve descripción de la categoría..."
              className="input-field resize-none"
              {...register('descripcion')}
            />
          </div>

          {/* Ícono y Orden en la misma fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                Ícono{' '}
                <span className="font-normal" style={{ color: '#8A8780' }}>(emoji)</span>
              </label>
              <input
                type="text"
                placeholder="💬"
                maxLength={4}
                className="input-field"
                {...register('icono')}
              />
            </div>
            <div>
              <label className="input-label">Orden de aparición</label>
              <input
                type="number"
                min={0}
                className="input-field"
                {...register('orden', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : <><Check size={15} /> {esEdicion ? 'Guardar' : 'Crear'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
export default function AdminForo() {
  // ── Estado ────────────────────────────────────────────────
  const [vista,           setVista]           = useState('categorias'); // 'categorias' | 'hilos'
  const [categorias,      setCategorias]      = useState([]);
  const [hilos,           setHilos]           = useState([]);
  const [resumen,         setResumen]         = useState(null);
  const [cargando,        setCargando]        = useState(true);
  const [modalCategoria,  setModalCategoria]  = useState(false);
  const [categoriaEdit,   setCategoriaEdit]   = useState(null);
  const [filtroCerrado,   setFiltroCerrado]   = useState('');    // '' | 'true' | 'false'
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // ── Carga de datos ────────────────────────────────────────
  const cargarResumen = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/foro/resumen');
      setResumen(data.resumen);
    } catch { /* No es crítico si falla el resumen */ }
  }, []);

  const cargarCategorias = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/foro/categorias');
      setCategorias(data.categorias || []);
    } catch { toast.error('No se pudieron cargar las categorías.'); }
    finally { setCargando(false); }
  }, []);

  const cargarHilos = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroCerrado)   params.append('cerrado',     filtroCerrado);
      if (filtroCategoria) params.append('categoria_id', filtroCategoria);

      const { data } = await api.get(`/admin/foro/hilos?${params}`);
      setHilos(data.hilos || []);
    } catch { toast.error('No se pudieron cargar los hilos.'); }
    finally { setCargando(false); }
  }, [filtroCerrado, filtroCategoria]);

  useEffect(() => {
    cargarResumen();
    cargarCategorias();
  }, [cargarResumen, cargarCategorias]);

  useEffect(() => {
    if (vista === 'hilos') cargarHilos();
  }, [vista, cargarHilos]);

  // ── Acciones sobre categorías ─────────────────────────────
  const pausarCategoria = async (cat) => {
    const accion = cat.activa ? 'pausar' : 'activar';
    if (!window.confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} la categoría "${cat.nombre}"?`)) return;
    try {
      await api.patch(`/admin/foro/categorias/${cat.id}/pausar`, { activa: !cat.activa });
      toast.success(`Categoría ${!cat.activa ? 'activada' : 'pausada'}.`);
      cargarCategorias();
    } catch { toast.error('Error al actualizar la categoría.'); }
  };

  const eliminarCategoria = async (cat) => {
    if (!window.confirm(
      `¿Eliminar "${cat.nombre}"?\n\nEsto eliminará TODOS los hilos y respuestas de esta categoría. Esta acción no se puede deshacer.`
    )) return;
    try {
      await api.delete(`/admin/foro/categorias/${cat.id}`);
      toast.success('Categoría eliminada.');
      cargarCategorias();
    } catch { toast.error('Error al eliminar la categoría.'); }
  };

  // ── Acciones sobre hilos ──────────────────────────────────
  const cerrarHilo = async (hilo) => {
    const accion = hilo.cerrado ? 'reabrir' : 'cerrar';
    if (!window.confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} este hilo?`)) return;
    try {
      await api.patch(`/admin/foro/hilos/${hilo.id}/cerrar`, { cerrado: !hilo.cerrado });
      toast.success(`Hilo ${!hilo.cerrado ? 'cerrado' : 'reabierto'}.`);
      cargarHilos();
    } catch { toast.error('Error al actualizar el hilo.'); }
  };

  const fijarHilo = async (hilo) => {
    try {
      await api.patch(`/admin/foro/hilos/${hilo.id}/fijar`, { fijado: !hilo.fijado });
      toast.success(`Hilo ${!hilo.fijado ? 'fijado' : 'desfijado'}.`);
      cargarHilos();
    } catch { toast.error('Error al fijar el hilo.'); }
  };

  const eliminarHilo = async (hilo) => {
    if (!window.confirm(
      `¿Eliminar el hilo "${hilo.titulo}"?\n\nTambién se eliminarán todas sus respuestas.`
    )) return;
    try {
      await api.delete(`/admin/foro/hilos/${hilo.id}`);
      toast.success('Hilo eliminado.');
      cargarHilos();
    } catch { toast.error('Error al eliminar el hilo.'); }
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión del foro</h1>
            <p className="section-subtitle">
              Administrá categorías, hilos y moderá la comunidad.
            </p>
          </div>
          <button
            onClick={() => { cargarCategorias(); cargarResumen(); if (vista === 'hilos') cargarHilos(); }}
            disabled={cargando}
            className="btn-secondary gap-2"
          >
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Tarjetas de resumen */}
        {resumen && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Categorías',  valor: resumen.total_categorias,  icono: FolderOpen,    color: '#B86030' },
              { label: 'Hilos',       valor: resumen.total_hilos,       icono: MessageSquare, color: '#56534A' },
              { label: 'Respuestas',  valor: resumen.total_respuestas,  icono: MessageCircle, color: '#56534A' },
              { label: 'Cerrados',    valor: resumen.hilos_cerrados,    icono: Lock,          color: '#8A8780' },
            ].map(({ label, valor, icono: Icono, color }) => (
              <div key={label} className="card p-5">
                <div className="flex items-center gap-3 mb-1">
                  <Icono size={18} style={{ color }} />
                  <span className="font-body text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#8A8780' }}>{label}</span>
                </div>
                <p className="font-display font-bold text-2xl" style={{ color: '#1C1B18' }}>
                  {parseInt(valor).toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pestañas de navegación */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'categorias', label: 'Categorías', icono: FolderOpen },
            { id: 'hilos',      label: 'Hilos',      icono: MessageSquare },
          ].map(({ id, label, icono: Icono }) => (
            <button
              key={id}
              onClick={() => setVista(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-medium transition-all"
              style={vista === id
                ? { background: '#1C1B18', color: '#F7F6F4' }
                : { background: '#E8E6E3', color: '#56534A' }
              }
            >
              <Icono size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ─── VISTA: CATEGORÍAS ───────────────────────────────── */}
        {vista === 'categorias' && (
          <>
            {/* Botón crear categoría */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setCategoriaEdit(null); setModalCategoria(true); }}
                className="btn-primary gap-2"
              >
                <Plus size={16} /> Nueva categoría
              </button>
            </div>

            {/* Skeleton de carga */}
            {cargando && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card p-5 animate-pulse flex gap-4">
                    <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: '#E8E6E3' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                      <div className="h-3 rounded w-1/2" style={{ background: '#E8E6E3' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sin categorías */}
            {!cargando && categorias.length === 0 && (
              <div className="card p-16 text-center">
                <FolderOpen size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
                <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>Sin categorías</p>
                <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
                  Creá la primera categoría del foro.
                </p>
                <button
                  onClick={() => { setCategoriaEdit(null); setModalCategoria(true); }}
                  className="btn-primary"
                >
                  <Plus size={16} /> Crear categoría
                </button>
              </div>
            )}

            {/* Tabla de categorías */}
            {!cargando && categorias.length > 0 && (
              <div className="card overflow-hidden">
                {/* Encabezado de la tabla */}
                <div
                  className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-body font-semibold uppercase tracking-wider"
                  style={{ background: '#F7F6F4', borderColor: '#F0EFED', color: '#8A8780' }}
                >
                  <div className="col-span-5">Categoría</div>
                  <div className="col-span-2 text-center">Hilos</div>
                  <div className="col-span-2 text-center">Estado</div>
                  <div className="col-span-1 text-center">Orden</div>
                  <div className="col-span-2 text-right">Acciones</div>
                </div>

                <div className="divide-y" style={{ borderColor: '#F7F6F4' }}>
                  {categorias.map(cat => (
                    <div
                      key={cat.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 items-center transition-colors"
                      onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                    >
                      {/* Nombre e ícono */}
                      <div className="md:col-span-5 flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ background: cat.activa ? 'rgba(184,96,48,0.08)' : '#F0EFED' }}
                        >
                          {cat.icono || '💬'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body font-semibold text-sm truncate"
                            style={{ color: cat.activa ? '#1C1B18' : '#8A8780' }}>
                            {cat.nombre}
                          </p>
                          {cat.descripcion && (
                            <p className="font-body text-xs truncate" style={{ color: '#8A8780' }}>
                              {cat.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Total hilos */}
                      <div className="md:col-span-2 flex md:justify-center items-center gap-1">
                        <MessageSquare size={13} style={{ color: '#8A8780' }} />
                        <span className="font-body text-sm" style={{ color: '#56534A' }}>
                          {parseInt(cat.total_hilos).toLocaleString('es-AR')}
                        </span>
                      </div>

                      {/* Estado activa/pausada */}
                      <div className="md:col-span-2 flex md:justify-center">
                        <span
                          className="text-xs font-body font-medium px-2.5 py-1 rounded-full"
                          style={cat.activa
                            ? { background: 'rgba(22,163,74,0.1)', color: '#16a34a' }
                            : { background: '#F0EFED', color: '#8A8780' }
                          }
                        >
                          {cat.activa ? '● Activa' : '○ Pausada'}
                        </span>
                      </div>

                      {/* Orden */}
                      <div className="md:col-span-1 flex md:justify-center">
                        <span className="font-body text-sm" style={{ color: '#8A8780' }}>
                          #{cat.orden}
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="md:col-span-2 flex items-center justify-end gap-1">

                        {/* Editar */}
                        <button
                          onClick={() => { setCategoriaEdit(cat); setModalCategoria(true); }}
                          title="Editar"
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: '#8A8780' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; e.currentTarget.style.color = '#1C1B18'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Pausar / Activar */}
                        <button
                          onClick={() => pausarCategoria(cat)}
                          title={cat.activa ? 'Pausar' : 'Activar'}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: '#8A8780' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEF9C3'; e.currentTarget.style.color = '#ca8a04'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
                        >
                          {cat.activa ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => eliminarCategoria(cat)}
                          title="Eliminar"
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: '#8A8780' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#dc2626'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── VISTA: HILOS ────────────────────────────────────── */}
        {vista === 'hilos' && (
          <>
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <select
                value={filtroCategoria}
                onChange={e => setFiltroCategoria(e.target.value)}
                className="input-field sm:w-56"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icono} {cat.nombre}</option>
                ))}
              </select>
              <select
                value={filtroCerrado}
                onChange={e => setFiltroCerrado(e.target.value)}
                className="input-field sm:w-44"
              >
                <option value="">Todos los estados</option>
                <option value="false">Abiertos</option>
                <option value="true">Cerrados</option>
              </select>
            </div>

            {/* Skeleton de carga */}
            {cargando && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="card p-5 animate-pulse flex gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded w-2/3" style={{ background: '#E8E6E3' }} />
                      <div className="h-3 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sin hilos */}
            {!cargando && hilos.length === 0 && (
              <div className="card p-16 text-center">
                <MessageSquare size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
                <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>Sin hilos</p>
                <p className="font-body text-sm" style={{ color: '#8A8780' }}>
                  {filtroCerrado || filtroCategoria
                    ? 'No hay hilos con esos filtros.'
                    : 'Aún no hay hilos en el foro.'}
                </p>
              </div>
            )}

            {/* Tabla de hilos */}
            {!cargando && hilos.length > 0 && (
              <div className="card overflow-hidden">
                {/* Encabezado */}
                <div
                  className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-body font-semibold uppercase tracking-wider"
                  style={{ background: '#F7F6F4', borderColor: '#F0EFED', color: '#8A8780' }}
                >
                  <div className="col-span-5">Hilo</div>
                  <div className="col-span-2">Categoría</div>
                  <div className="col-span-2">Autor</div>
                  <div className="col-span-1 text-center">
                    <Eye size={12} className="inline" />
                  </div>
                  <div className="col-span-2 text-right">Acciones</div>
                </div>

                <div className="divide-y" style={{ borderColor: '#F7F6F4' }}>
                  {hilos.map(hilo => (
                    <div
                      key={hilo.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 items-center transition-colors"
                      onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                    >
                      {/* Título con badges */}
                      <div className="md:col-span-5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {hilo.fijado && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-body font-medium"
                              style={{ background: 'rgba(184,96,48,0.1)', color: '#B86030' }}>
                              📌 Fijado
                            </span>
                          )}
                          {hilo.cerrado && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-body font-medium"
                              style={{ background: '#F0EFED', color: '#8A8780' }}>
                              🔒 Cerrado
                            </span>
                          )}
                        </div>
                        <p className="font-body font-semibold text-sm truncate" style={{ color: '#1C1B18' }}>
                          {hilo.titulo}
                        </p>
                        <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                          <MessageCircle size={11} className="inline mr-1" />
                          {parseInt(hilo.total_respuestas)} respuestas
                        </p>
                      </div>

                      {/* Categoría */}
                      <div className="md:col-span-2">
                        <span className="font-body text-xs" style={{ color: '#56534A' }}>
                          {hilo.categoria_icono} {hilo.categoria_nombre}
                        </span>
                      </div>

                      {/* Autor */}
                      <div className="md:col-span-2">
                        <p className="font-body text-xs truncate" style={{ color: '#56534A' }}>
                          {hilo.autor_nombre} {hilo.autor_apellido}
                        </p>
                      </div>

                      {/* Vistas */}
                      <div className="md:col-span-1 flex md:justify-center items-center gap-1">
                        <Eye size={12} style={{ color: '#8A8780' }} />
                        <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                          {parseInt(hilo.vistas).toLocaleString('es-AR')}
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="md:col-span-2 flex items-center justify-end gap-1">

                        {/* Fijar / Desfijar */}
                        <button
                          onClick={() => fijarHilo(hilo)}
                          title={hilo.fijado ? 'Desfijar' : 'Fijar'}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: hilo.fijado ? '#B86030' : '#8A8780' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                        >
                          {hilo.fijado ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>

                        {/* Cerrar / Reabrir */}
                        <button
                          onClick={() => cerrarHilo(hilo)}
                          title={hilo.cerrado ? 'Reabrir' : 'Cerrar'}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: '#8A8780' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEF9C3'; e.currentTarget.style.color = '#ca8a04'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
                        >
                          {hilo.cerrado ? <Unlock size={14} /> : <Lock size={14} />}
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => eliminarHilo(hilo)}
                          title="Eliminar"
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: '#8A8780' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#dc2626'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de categoría */}
      {modalCategoria && (
        <ModalCategoria
          categoria={categoriaEdit}
          onCerrar={() => { setModalCategoria(false); setCategoriaEdit(null); }}
          onGuardado={cargarCategorias}
        />
      )}
    </div>
  );
}
