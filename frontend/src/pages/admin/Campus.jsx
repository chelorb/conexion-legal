// ============================================================
// src/pages/admin/Campus.jsx
// Gestión del campus multimedia desde el panel de administración
// El admin puede crear, editar y desactivar cursos, podcasts, etc.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Headphones, Video, Library,
  Plus, Edit2, X, Check, RefreshCw, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

// Tipos de contenido disponibles
const TIPOS = [
  { valor: 'curso',           label: 'Curso',            icono: BookOpen  },
  { valor: 'podcast',         label: 'Podcast',          icono: Headphones },
  { valor: 'videoconferencia',label: 'Videoconferencia', icono: Video     },
  { valor: 'biblioteca',      label: 'Biblioteca',       icono: Library   },
  { valor: 'articulo',        label: 'Artículo',         icono: BookOpen  },
];

const PLANES = [
  { valor: 'basico',    label: 'Básico' },
  { valor: 'comunidad', label: 'Comunidad' },
];

// ─────────────────────────────────────────────────────────────
// Componente: Modal para crear o editar contenido
// ─────────────────────────────────────────────────────────────
function ModalContenido({ contenido, onCerrar, onGuardado }) {
  const esEdicion  = !!contenido;
  const [guardando, setGuardando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: contenido || {
      tipo:           'curso',
      plan_requerido: 'comunidad',
    }
  });

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      if (esEdicion) {
        // Actualizar contenido existente
        await api.put(`/admin/campus/${contenido.id}`, datos);
        toast.success('Contenido actualizado.');
      } else {
        // Crear contenido nuevo
        await api.post('/admin/campus', datos);
        toast.success('Contenido creado.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-navy-900 text-xl">
            {esEdicion ? 'Editar contenido' : 'Nuevo contenido'}
          </h3>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Título */}
          <div>
            <label className="input-label">Título *</label>
            <input type="text" placeholder="Ej: Introducción al Derecho Digital"
              className={`input-field ${errors.titulo ? 'border-red-300' : ''}`}
              {...register('titulo', { required: 'El título es obligatorio' })} />
            {errors.titulo && <p className="input-error">{errors.titulo.message}</p>}
          </div>

          {/* Tipo y Plan en fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tipo *</label>
              <select className="input-field" {...register('tipo', { required: true })}>
                {TIPOS.map(t => (
                  <option key={t.valor} value={t.valor}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Plan requerido *</label>
              <select className="input-field" {...register('plan_requerido', { required: true })}>
                {PLANES.map(p => (
                  <option key={p.valor} value={p.valor}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="input-label">
              Descripción <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea rows={3} placeholder="Breve descripción del contenido..."
              className="input-field resize-none"
              {...register('descripcion')} />
          </div>

          {/* Autor y Especialidad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                Autor <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input type="text" placeholder="Ej: Dr. Roberto Silva" className="input-field"
                {...register('autor')} />
            </div>
            <div>
              <label className="input-label">
                Especialidad <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input type="text" placeholder="Ej: Derecho Civil" className="input-field"
                {...register('especialidad')} />
            </div>
          </div>

          {/* URL del contenido y duración */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                URL del contenido <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input type="url" placeholder="https://..." className="input-field"
                {...register('contenido_url')} />
            </div>
            <div>
              <label className="input-label">
                Duración (minutos) <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input type="number" min="1" placeholder="Ej: 60" className="input-field"
                {...register('duracion_min', { valueAsNumber: true })} />
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
                : <><Check size={15} /> {esEdicion ? 'Guardar cambios' : 'Crear contenido'}</>
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
export default function AdminCampus() {
  const [contenido,    setContenido]    = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [modalAbierto, setModal]        = useState(false);
  const [itemEdit,     setItemEdit]     = useState(null);
  const [tipoFiltro,   setTipoFiltro]   = useState('');
  const [busqueda,     setBusqueda]     = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/campus');
      setContenido(data.contenido || []);
    } catch {
      toast.error('No se pudo cargar el campus.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Desactivar contenido
  const desactivar = async (id, titulo) => {
    if (!window.confirm(`¿Desactivar "${titulo}"?`)) return;
    try {
      await api.delete(`/admin/campus/${id}`);
      toast.success('Contenido desactivado.');
      cargar();
    } catch {
      toast.error('Error al desactivar.');
    }
  };

  // Filtrado
  const contenidoFiltrado = contenido.filter(c => {
    const coincideTipo     = !tipoFiltro || c.tipo === tipoFiltro;
    const texto            = `${c.titulo} ${c.autor || ''}`.toLowerCase();
    const coincideBusqueda = !busqueda || texto.includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión del campus</h1>
            <p className="section-subtitle">
              Administrá cursos, podcasts, videos y biblioteca del campus multimedia.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={() => { setItemEdit(null); setModal(true); }}
              className="btn-primary gap-2"
            >
              <Plus size={16} /> Agregar contenido
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por título o autor..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10" />
          </div>
          <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}
            className="input-field sm:w-48">
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
          </select>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin contenido */}
        {!cargando && contenidoFiltrado.length === 0 && (
          <div className="card p-16 text-center">
            <BookOpen size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display text-xl text-navy-900 mb-2">Sin contenido</p>
            <p className="font-body text-slate-500 text-sm mb-6">
              {busqueda || tipoFiltro ? 'Probá con otros filtros.' : 'Agregá el primer contenido al campus.'}
            </p>
            <button onClick={() => { setItemEdit(null); setModal(true); }} className="btn-primary">
              <Plus size={16} /> Agregar contenido
            </button>
          </div>
        )}

        {/* Lista de contenido */}
        {!cargando && contenidoFiltrado.length > 0 && (
          <div className="card overflow-hidden">
            {/* Header tabla */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-body font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-5">Contenido</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Autor</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            <div className="divide-y divide-slate-50">
              {contenidoFiltrado.map(c => {
                const TipoIcono = TIPOS.find(t => t.valor === c.tipo)?.icono || BookOpen;
                return (
                  <div key={c.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">

                    {/* Título */}
                    <div className="md:col-span-5 flex items-center gap-3">
                      <div className="w-9 h-9 bg-navy-50 rounded-xl flex items-center justify-center shrink-0">
                        <TipoIcono size={16} className="text-navy-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-navy-900 text-sm truncate">
                          {c.titulo}
                        </p>
                        {c.duracion_min && (
                          <p className="font-body text-xs text-slate-400">
                            {c.duracion_min} min
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tipo */}
                    <div className="md:col-span-2">
                      <span className="font-body text-xs text-slate-600 capitalize">
                        {TIPOS.find(t => t.valor === c.tipo)?.label || c.tipo}
                      </span>
                    </div>

                    {/* Plan */}
                    <div className="md:col-span-2">
                      <span className={`text-xs font-body font-medium px-2.5 py-1 rounded-full ${
                        c.plan_requerido === 'comunidad'
                          ? 'bg-gold-300/20 text-gold-700'
                          : 'bg-navy-50 text-navy-700'
                      }`}>
                        {c.plan_requerido === 'comunidad' ? '★ Comunidad' : 'Básico'}
                      </span>
                    </div>

                    {/* Autor */}
                    <div className="md:col-span-2">
                      <p className="font-body text-xs text-slate-500 truncate">
                        {c.autor || '—'}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="md:col-span-1 flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setItemEdit(c); setModal(true); }}
                        className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500 hover:text-navy-900"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => desactivar(c.id, c.titulo)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-slate-500 hover:text-red-500"
                        title="Desactivar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <ModalContenido
          contenido={itemEdit}
          onCerrar={() => { setModal(false); setItemEdit(null); }}
          onGuardado={cargar}
        />
      )}
    </div>
  );
}
