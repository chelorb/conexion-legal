// ============================================================
// src/pages/abogado/ForoCategoria.jsx — Paleta C
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MessageSquare, Eye, Clock, Pin, X, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';

function ModalNuevoHilo({ categoriaId, onCerrar, onCreado }) {
  const [guardando, setGuardando] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const contenido = watch('contenido', '');

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      const { data } = await api.post(`/foro/categorias/${categoriaId}/hilos`, datos);
      toast.success('¡Hilo creado!');
      onCreado(data.hilo.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear el hilo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-2xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>Nuevo hilo</h3>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="input-label">Título del hilo *</label>
            <input type="text" placeholder="¿Sobre qué querés debatir?"
              className={`input-field ${errors.titulo ? 'border-red-300' : ''}`}
              {...register('titulo', {
                required: 'El título es obligatorio',
                minLength: { value: 10, message: 'Mínimo 10 caracteres' },
                maxLength: { value: 255, message: 'Máximo 255 caracteres' },
              })} />
            {errors.titulo && <p className="input-error">{errors.titulo.message}</p>}
          </div>

          <div>
            <label className="input-label">Contenido *</label>
            <textarea rows={6} placeholder="Desarrollá tu tema, pregunta o aporte..."
              className={`input-field resize-none ${errors.contenido ? 'border-red-300' : ''}`}
              {...register('contenido', {
                required: 'El contenido es obligatorio',
                minLength: { value: 20, message: 'Mínimo 20 caracteres' },
              })} />
            <div className="flex justify-end mt-1">
              <p className="font-body text-xs" style={{ color: '#8A8780' }}>{contenido.length} caracteres</p>
            </div>
            {errors.contenido && <p className="input-error">{errors.contenido.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Publicando...</>
                : 'Publicar hilo'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ForoCategoria() {
  const { categoriaId }         = useParams();
  const navigate                = useNavigate();
  const [datos, setDatos]       = useState({ categoria: null, hilos: [] });
  const [cargando, setCargando] = useState(true);
  const [modal, setModal]       = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get(`/foro/categorias/${categoriaId}/hilos`);
      setDatos(data);
    } catch { toast.error('No se pudo cargar el foro.'); }
    finally { setCargando(false); }
  }, [categoriaId]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-4xl">

        <Link to="/abogado/foro"
          className="inline-flex items-center gap-2 text-sm font-body mb-6 transition-colors"
          style={{ color: '#8A8780' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
        >
          <ArrowLeft size={16} /> Volver al foro
        </Link>

        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            {datos.categoria && (
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{datos.categoria.icono}</span>
                <h1 className="section-title">{datos.categoria.nombre}</h1>
              </div>
            )}
            {datos.categoria?.descripcion && (
              <p className="section-subtitle">{datos.categoria.descripcion}</p>
            )}
          </div>
          <button onClick={() => setModal(true)} className="btn-primary shrink-0">
            <Plus size={16} /> Nuevo hilo
          </button>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: '#E8E6E3' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-2/3" style={{ background: '#E8E6E3' }} />
                  <div className="h-3 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin hilos */}
        {!cargando && datos.hilos.length === 0 && (
          <div className="card p-16 text-center">
            <MessageSquare size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>Sin hilos todavía</p>
            <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
              Sé el primero en abrir un tema en esta categoría.
            </p>
            <button onClick={() => setModal(true)} className="btn-primary">
              <Plus size={16} /> Crear el primer hilo
            </button>
          </div>
        )}

        {/* Hilos */}
        {!cargando && datos.hilos.length > 0 && (
          <div className="card overflow-hidden">
            {datos.hilos.map((hilo, idx) => (
              <Link
                key={hilo.id}
                to={`/abogado/foro/${categoriaId}/${hilo.id}`}
                className="flex items-start gap-4 px-6 py-5 group transition-colors"
                style={{ borderBottom: idx < datos.hilos.length - 1 ? '1px solid #F0EFED' : 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: '#F0EFED' }}
                >
                  {hilo.autor_avatar
                    ? <img src={hilo.autor_avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="font-display font-bold text-sm" style={{ color: '#2C2B27' }}>
                        {hilo.autor_nombre?.[0]}{hilo.autor_apellido?.[0]}
                      </span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {hilo.fijado && <Pin size={14} className="shrink-0 mt-1" style={{ color: '#B86030' }} />}
                    <h3 className="font-body font-semibold text-sm leading-snug" style={{ color: '#1C1B18' }}>
                      {hilo.titulo}
                      {hilo.cerrado && (
                        <span className="ml-2 text-xs font-normal" style={{ color: '#8A8780' }}>[cerrado]</span>
                      )}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                      {hilo.autor_nombre} {hilo.autor_apellido}
                    </span>
                    <span style={{ color: '#D4D2CC' }}>·</span>
                    <div className="flex items-center gap-1 font-body text-xs" style={{ color: '#8A8780' }}>
                      <MessageSquare size={11} />
                      {parseInt(hilo.total_respuestas) || 0} respuesta{parseInt(hilo.total_respuestas) !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1 font-body text-xs" style={{ color: '#8A8780' }}>
                      <Eye size={11} /> {parseInt(hilo.vistas) || 0}
                    </div>
                    <div className="flex items-center gap-1 font-body text-xs" style={{ color: '#8A8780' }}>
                      <Clock size={11} />
                      {formatDistanceToNow(new Date(hilo.actualizado_en), { addSuffix: true, locale: es })}
                    </div>
                  </div>
                </div>

                <ChevronRight size={16} className="shrink-0 mt-1 transition-colors"
                  style={{ color: '#D4D2CC' }} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <ModalNuevoHilo
          categoriaId={categoriaId}
          onCerrar={() => setModal(false)}
          onCreado={id => { setModal(false); navigate(`/abogado/foro/${categoriaId}/${id}`); }}
        />
      )}
    </div>
  );
}
