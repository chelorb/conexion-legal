// ============================================================
// src/pages/admin/Links.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Check, ExternalLink, RefreshCw, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-lg p-8 animate-slide-up">

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>
            {esEdicion ? 'Editar link' : 'Nuevo link de interés'}
          </h3>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="input-label">Título *</label>
            <input type="text" placeholder="Ej: Nueva Abogacía — Recursos útiles"
              className={`input-field ${errors.titulo ? 'border-red-300' : ''}`}
              {...register('titulo', { required: 'El título es obligatorio' })} />
            {errors.titulo && <p className="input-error">{errors.titulo.message}</p>}
          </div>

          <div>
            <label className="input-label">URL *</label>
            <input type="url" placeholder="https://..."
              className={`input-field ${errors.url ? 'border-red-300' : ''}`}
              {...register('url', {
                required: 'La URL es obligatoria',
                pattern: { value: /^https?:\/\/.+/, message: 'Debe ser una URL válida' }
              })} />
            {errors.url && <p className="input-error">{errors.url.message}</p>}
          </div>

          <div>
            <label className="input-label">
              Descripción <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
            </label>
            <input type="text" placeholder="Breve descripción de qué encontrarán en este link"
              className="input-field" {...register('descripcion')} />
          </div>

          <div>
            <label className="input-label">
              Orden <span className="font-normal" style={{ color: '#8A8780' }}>(menor número = primero)</span>
            </label>
            <input type="number" min="0" placeholder="0" className="input-field"
              {...register('orden', { valueAsNumber: true })} />
          </div>

          {esEdicion && (
            <div className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: '#F7F6F4' }}>
              <input type="checkbox" id="activo" defaultChecked={link.activo}
                className="rounded w-4 h-4" style={{ accentColor: '#2C2B27' }}
                {...register('activo')} />
              <label htmlFor="activo" className="font-body text-sm cursor-pointer" style={{ color: '#3A3832' }}>
                Link activo (visible para los abogados)
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : <><Check size={15} /> {esEdicion ? 'Guardar' : 'Agregar link'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminLinks() {
  const [links,        setLinks]    = useState([]);
  const [cargando,     setCargando] = useState(true);
  const [modalAbierto, setModal]    = useState(false);
  const [linkEdit,     setLinkEdit] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/links');
      setLinks(data.links || []);
    } catch { toast.error('No se pudieron cargar los links.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar el link "${titulo}"?`)) return;
    try {
      await api.delete(`/admin/links/${id}`);
      toast.success('Link eliminado.');
      cargar();
    } catch { toast.error('Error al eliminar.'); }
  };

  const toggleActivo = async (link) => {
    try {
      await api.put(`/admin/links/${link.id}`, { activo: !link.activo });
      toast.success(link.activo ? 'Link desactivado.' : 'Link activado.');
      cargar();
    } catch { toast.error('Error al actualizar.'); }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-3xl">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Links de interés</h1>
            <p className="section-subtitle">Aparecen en el sidebar del dashboard de cada abogado.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
            </button>
            <button onClick={() => { setLinkEdit(null); setModal(true); }} className="btn-primary gap-2">
              <Plus size={16} /> Agregar link
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-2xl p-4 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(44,43,39,0.04)', border: '1px solid rgba(44,43,39,0.08)' }}>
          <LinkIcon size={16} style={{ color: '#B86030' }} className="shrink-0 mt-0.5" />
          <p className="font-body text-sm leading-relaxed" style={{ color: '#56534A' }}>
            Los links activos aparecen en el panel lateral de todos los abogados, ordenados por número de orden (menor primero).
          </p>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: '#E8E6E3' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/2" style={{ background: '#E8E6E3' }} />
                  <div className="h-3 rounded w-3/4" style={{ background: '#E8E6E3' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin links */}
        {!cargando && links.length === 0 && (
          <div className="card p-16 text-center">
            <LinkIcon size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>Sin links agregados</p>
            <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
              Agregá links útiles para los abogados de la plataforma.
            </p>
            <button onClick={() => { setLinkEdit(null); setModal(true); }} className="btn-primary">
              <Plus size={16} /> Agregar primer link
            </button>
          </div>
        )}

        {/* Lista */}
        {!cargando && links.length > 0 && (
          <div className="space-y-3">
            {links.map((link, idx) => (
              <div
                key={link.id}
                className="card p-5 flex items-start gap-4 transition-opacity"
                style={!link.activo ? { opacity: 0.5 } : {}}
              >
                {/* Orden */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: '#F0EFED' }}>
                  <span className="font-display font-bold text-sm" style={{ color: '#8A8780' }}>
                    {link.orden || idx + 1}
                  </span>
                </div>

                {/* Datos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
                        {link.titulo}
                      </p>
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        className="font-body text-xs flex items-center gap-1 mt-0.5 hover:underline truncate max-w-xs"
                        style={{ color: '#B86030' }}>
                        <ExternalLink size={10} /> {link.url}
                      </a>
                      {link.descripcion && (
                        <p className="font-body text-xs mt-1 leading-relaxed" style={{ color: '#8A8780' }}>
                          {link.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle activo */}
                      <button onClick={() => toggleActivo(link)}
                        className="text-xs font-body px-3 py-1.5 rounded-full transition-colors"
                        style={link.activo
                          ? { background: 'rgba(22,163,74,0.08)', color: '#16a34a' }
                          : { background: '#F0EFED', color: '#8A8780' }
                        }
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        {link.activo ? '● Activo' : '○ Inactivo'}
                      </button>

                      <button onClick={() => { setLinkEdit(link); setModal(true); }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#8A8780' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; e.currentTarget.style.color = '#1C1B18'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
                      >
                        <Edit2 size={14} />
                      </button>

                      <button onClick={() => eliminar(link.id, link.titulo)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#8A8780' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#dc2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
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

        {!cargando && links.length > 0 && (
          <p className="font-body text-xs text-center mt-6" style={{ color: '#B0AEA8' }}>
            {links.filter(l => l.activo).length} de {links.length} links activos
          </p>
        )}
      </div>

      {modalAbierto && (
        <ModalLink link={linkEdit}
          onCerrar={() => { setModal(false); setLinkEdit(null); }}
          onGuardado={cargar} />
      )}
    </div>
  );
}
