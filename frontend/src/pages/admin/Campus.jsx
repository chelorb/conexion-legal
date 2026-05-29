// ============================================================
// src/pages/admin/Campus.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Headphones, Video, Library, Plus, Edit2, X, Check, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

const TIPOS = [
  { valor: 'curso',           label: 'Curso',           icono: BookOpen   },
  { valor: 'podcast',         label: 'Podcast',         icono: Headphones },
  { valor: 'videoconferencia',label: 'Videoconferencia',icono: Video      },
  { valor: 'biblioteca',      label: 'Biblioteca',      icono: Library    },
  { valor: 'articulo',        label: 'Artículo',        icono: BookOpen   },
];

const PLANES = [
  { valor: 'basico',    label: 'Básico'    },
  { valor: 'comunidad', label: 'Comunidad' },
];

function ModalContenido({ contenido, onCerrar, onGuardado }) {
  const esEdicion = !!contenido;
  const [guardando, setGuardando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: contenido || { tipo: 'curso', plan_requerido: 'comunidad' }
  });

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      if (esEdicion) {
        await api.put(`/admin/campus/${contenido.id}`, datos);
        toast.success('Contenido actualizado.');
      } else {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>
            {esEdicion ? 'Editar contenido' : 'Nuevo contenido'}
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
            <input type="text" placeholder="Ej: Introducción al Derecho Digital"
              className={`input-field ${errors.titulo ? 'border-red-300' : ''}`}
              {...register('titulo', { required: 'El título es obligatorio' })} />
            {errors.titulo && <p className="input-error">{errors.titulo.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tipo *</label>
              <select className="input-field" {...register('tipo', { required: true })}>
                {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Plan requerido *</label>
              <select className="input-field" {...register('plan_requerido', { required: true })}>
                {PLANES.map(p => <option key={p.valor} value={p.valor}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">
              Descripción <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
            </label>
            <textarea rows={3} placeholder="Breve descripción del contenido..."
              className="input-field resize-none" {...register('descripcion')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                Autor <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
              </label>
              <input type="text" placeholder="Ej: Dr. Roberto Silva" className="input-field"
                {...register('autor')} />
            </div>
            <div>
              <label className="input-label">
                Especialidad <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
              </label>
              <input type="text" placeholder="Ej: Derecho Civil" className="input-field"
                {...register('especialidad')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                URL del contenido <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
              </label>
              <input type="url" placeholder="https://..." className="input-field"
                {...register('contenido_url')} />
            </div>
            <div>
              <label className="input-label">
                Duración (min) <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
              </label>
              <input type="number" min="1" placeholder="Ej: 60" className="input-field"
                {...register('duracion_min', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
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
    } catch { toast.error('No se pudo cargar el campus.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const desactivar = async (id, titulo) => {
    if (!window.confirm(`¿Desactivar "${titulo}"?`)) return;
    try {
      await api.delete(`/admin/campus/${id}`);
      toast.success('Contenido desactivado.');
      cargar();
    } catch { toast.error('Error al desactivar.'); }
  };

  const filtrado = contenido.filter(c => {
    const texto = `${c.titulo} ${c.autor || ''}`.toLowerCase();
    return (!tipoFiltro || c.tipo === tipoFiltro) &&
      (!busqueda || texto.includes(busqueda.toLowerCase()));
  });

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión del campus</h1>
            <p className="section-subtitle">Administrá cursos, podcasts, videos y biblioteca.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
            </button>
            <button onClick={() => { setItemEdit(null); setModal(true); }} className="btn-primary gap-2">
              <Plus size={16} /> Agregar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
            <input type="text" placeholder="Buscar por título o autor..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10" />
          </div>
          <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} className="input-field sm:w-48">
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
          </select>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: '#E8E6E3' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/2" style={{ background: '#E8E6E3' }} />
                  <div className="h-3 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin contenido */}
        {!cargando && filtrado.length === 0 && (
          <div className="card p-16 text-center">
            <BookOpen size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>Sin contenido</p>
            <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
              {busqueda || tipoFiltro ? 'Probá con otros filtros.' : 'Agregá el primer contenido al campus.'}
            </p>
            <button onClick={() => { setItemEdit(null); setModal(true); }} className="btn-primary">
              <Plus size={16} /> Agregar contenido
            </button>
          </div>
        )}

        {/* Tabla */}
        {!cargando && filtrado.length > 0 && (
          <div className="card overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-body font-semibold uppercase tracking-wider"
              style={{ background: '#F7F6F4', borderColor: '#F0EFED', color: '#8A8780' }}>
              <div className="col-span-5">Contenido</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Autor</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            <div className="divide-y" style={{ borderColor: '#F7F6F4' }}>
              {filtrado.map(c => {
                const TipoIcono = TIPOS.find(t => t.valor === c.tipo)?.icono || BookOpen;
                return (
                  <div key={c.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 items-center transition-colors"
                    onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    <div className="md:col-span-5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(184,96,48,0.08)' }}>
                        <TipoIcono size={16} style={{ color: '#B86030' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-sm truncate" style={{ color: '#1C1B18' }}>
                          {c.titulo}
                        </p>
                        {c.duracion_min && (
                          <p className="font-body text-xs" style={{ color: '#8A8780' }}>{c.duracion_min} min</p>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-body text-xs capitalize" style={{ color: '#56534A' }}>
                        {TIPOS.find(t => t.valor === c.tipo)?.label || c.tipo}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-xs font-body font-medium px-2.5 py-1 rounded-full"
                        style={c.plan_requerido === 'comunidad'
                          ? { background: 'rgba(184,96,48,0.1)', color: '#B86030' }
                          : { background: '#F0EFED', color: '#56534A' }
                        }>
                        {c.plan_requerido === 'comunidad' ? '★ Comunidad' : 'Básico'}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <p className="font-body text-xs truncate" style={{ color: '#8A8780' }}>
                        {c.autor || '—'}
                      </p>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-end gap-1">
                      <button onClick={() => { setItemEdit(c); setModal(true); }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#8A8780' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; e.currentTarget.style.color = '#1C1B18'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => desactivar(c.id, c.titulo)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: '#8A8780' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#dc2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
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

      {modalAbierto && (
        <ModalContenido contenido={itemEdit}
          onCerrar={() => { setModal(false); setItemEdit(null); }}
          onGuardado={cargar} />
      )}
    </div>
  );
}
