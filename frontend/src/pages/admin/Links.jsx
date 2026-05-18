// ============================================================
// src/pages/admin/Links.jsx
// Gestión de links de interés desde el panel de administración
// El admin puede agregar, editar, ordenar y eliminar links
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, X, Check,
  ExternalLink, RefreshCw, GripVertical,
  Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Modal para crear o editar un link
// ─────────────────────────────────────────────────────────────
function ModalLink({ link, onCerrar, onGuardado }) {
  const esEdicion  = !!link;
  const [guardando, setGuardando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: link || { orden: 0 }
  });

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      if (esEdicion) {
        await api.put(`/admin/links/${link.id}`, datos);
        toast.success('Link actualizado.');
      } else {
        await api.post('/admin/links', datos);
        toast.success('Link agregado.');
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
      <div className="card w-full max-w-lg p-8 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-navy-900 text-xl">
            {esEdicion ? 'Editar link' : 'Nuevo link de interés'}
          </h3>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Título */}
          <div>
            <label className="input-label">Título del link *</label>
            <input
              type="text"
              placeholder="Ej: Nueva Abogacía — Recursos útiles"
              className={`input-field ${errors.titulo ? 'border-red-300' : ''}`}
              {...register('titulo', { required: 'El título es obligatorio' })}
            />
            {errors.titulo && <p className="input-error">{errors.titulo.message}</p>}
          </div>

          {/* URL */}
          <div>
            <label className="input-label">URL *</label>
            <input
              type="url"
              placeholder="https://..."
              className={`input-field ${errors.url ? 'border-red-300' : ''}`}
              {...register('url', {
                required: 'La URL es obligatoria',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Debe ser una URL válida (http:// o https://)'
                }
              })}
            />
            {errors.url && <p className="input-error">{errors.url.message}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="input-label">
              Descripción <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Breve descripción de qué encontrará el abogado en este link"
              className="input-field"
              {...register('descripcion')}
            />
          </div>

          {/* Orden */}
          <div>
            <label className="input-label">
              Orden de aparición <span className="text-slate-400 font-normal">(menor número = primero)</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className="input-field"
              {...register('orden', { valueAsNumber: true })}
            />
          </div>

          {/* Activo (solo en edición) */}
          {esEdicion && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <input
                type="checkbox"
                id="activo"
                defaultChecked={link.activo}
                className="rounded border-slate-300 text-navy-900 focus:ring-navy-900 w-4 h-4"
                {...register('activo')}
              />
              <label htmlFor="activo" className="font-body text-sm text-slate-700 cursor-pointer">
                Link activo (visible para los abogados)
              </label>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : <><Check size={15} /> {esEdicion ? 'Guardar cambios' : 'Agregar link'}</>
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
export default function AdminLinks() {
  const [links,        setLinks]        = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [modalAbierto, setModal]        = useState(false);
  const [linkEdit,     setLinkEdit]     = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/links');
      setLinks(data.links || []);
    } catch {
      toast.error('No se pudieron cargar los links.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Eliminar un link
  const eliminar = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar el link "${titulo}"?`)) return;
    try {
      await api.delete(`/admin/links/${id}`);
      toast.success('Link eliminado.');
      cargar();
    } catch {
      toast.error('Error al eliminar.');
    }
  };

  // Toggle activo/inactivo rápido
  const toggleActivo = async (link) => {
    try {
      await api.put(`/admin/links/${link.id}`, { activo: !link.activo });
      toast.success(link.activo ? 'Link desactivado.' : 'Link activado.');
      cargar();
    } catch {
      toast.error('Error al actualizar.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8 max-w-3xl">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Links de interés</h1>
            <p className="section-subtitle">
              Estos links aparecen en el sidebar del dashboard de cada abogado.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={() => { setLinkEdit(null); setModal(true); }}
              className="btn-primary gap-2"
            >
              <Plus size={16} /> Agregar link
            </button>
          </div>
        </div>

        {/* Preview de cómo se ve */}
        <div className="bg-navy-50 border border-navy-100 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon size={14} className="text-navy-700" />
            <p className="font-body text-sm font-medium text-navy-700">
              Vista previa: así aparece en el sidebar del abogado
            </p>
          </div>
          <p className="font-body text-xs text-slate-500">
            Los links activos se muestran ordenados por número de orden (menor primero). Los abogados los ven en su panel lateral.
          </p>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin links */}
        {!cargando && links.length === 0 && (
          <div className="card p-16 text-center">
            <LinkIcon size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display text-xl text-navy-900 mb-2">Sin links agregados</p>
            <p className="font-body text-slate-500 text-sm mb-6">
              Agregá links útiles para los abogados de la plataforma.
            </p>
            <button
              onClick={() => { setLinkEdit(null); setModal(true); }}
              className="btn-primary"
            >
              <Plus size={16} /> Agregar primer link
            </button>
          </div>
        )}

        {/* Lista de links */}
        {!cargando && links.length > 0 && (
          <div className="space-y-3">
            {links.map((link, idx) => (
              <div
                key={link.id}
                className={`card p-5 flex items-start gap-4 transition-opacity ${
                  !link.activo ? 'opacity-50' : ''
                }`}
              >
                {/* Ícono de orden */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="font-display font-bold text-slate-400 text-sm">
                      {link.orden || idx + 1}
                    </span>
                  </div>
                </div>

                {/* Datos del link */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-body font-semibold text-navy-900 text-sm">
                        {link.titulo}
                      </p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body text-xs text-navy-700 hover:underline flex items-center gap-1 mt-0.5 truncate max-w-xs"
                      >
                        <ExternalLink size={10} />
                        {link.url}
                      </a>
                      {link.descripcion && (
                        <p className="font-body text-xs text-slate-400 mt-1 leading-relaxed">
                          {link.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle activo */}
                      <button
                        onClick={() => toggleActivo(link)}
                        className={`text-xs font-body px-3 py-1.5 rounded-full transition-colors ${
                          link.activo
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {link.activo ? '● Activo' : '○ Inactivo'}
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => { setLinkEdit(link); setModal(true); }}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-navy-900 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={() => eliminar(link.id, link.titulo)}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nota */}
        {!cargando && links.length > 0 && (
          <p className="font-body text-xs text-slate-400 text-center mt-6">
            {links.filter(l => l.activo).length} de {links.length} links activos ·
            Los links inactivos no aparecen en el dashboard de los abogados
          </p>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <ModalLink
          link={linkEdit}
          onCerrar={() => { setModal(false); setLinkEdit(null); }}
          onGuardado={cargar}
        />
      )}
    </div>
  );
}
