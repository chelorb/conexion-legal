// ============================================================
// src/pages/abogado/ForoCategoria.jsx
// Lista de hilos dentro de una categoría del foro
// Permite crear un nuevo hilo
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, MessageSquare, Eye,
  Clock, Pin, X, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Modal para crear un nuevo hilo
// ─────────────────────────────────────────────────────────────
function ModalNuevoHilo({ categoriaId, onCerrar, onCreado }) {
  const [guardando, setGuardando] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const contenido = watch('contenido', '');

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      const { data } = await api.post(`/foro/categorias/${categoriaId}/hilos`, datos);
      toast.success('¡Hilo creado correctamente!');
      onCreado(data.hilo.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear el hilo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-2xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-navy-900 text-xl">Nuevo hilo</h3>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Título */}
          <div>
            <label className="input-label">Título del hilo *</label>
            <input
              type="text"
              placeholder="Ej: ¿Qué opinan sobre el nuevo fallo de la Corte en materia laboral?"
              className={`input-field ${errors.titulo ? 'border-red-300' : ''}`}
              {...register('titulo', {
                required: 'El título es obligatorio',
                minLength: { value: 10, message: 'Mínimo 10 caracteres' },
                maxLength: { value: 255, message: 'Máximo 255 caracteres' },
              })}
            />
            {errors.titulo && <p className="input-error">{errors.titulo.message}</p>}
          </div>

          {/* Contenido */}
          <div>
            <label className="input-label">Contenido *</label>
            <textarea
              rows={6}
              placeholder="Desarrollá tu tema, pregunta o aporte..."
              className={`input-field resize-none ${errors.contenido ? 'border-red-300' : ''}`}
              {...register('contenido', {
                required: 'El contenido es obligatorio',
                minLength: { value: 20, message: 'Mínimo 20 caracteres' },
              })}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.contenido
                ? <p className="input-error">{errors.contenido.message}</p>
                : <span />
              }
              <p className="font-body text-xs text-slate-400">{contenido.length} caracteres</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">
              Cancelar
            </button>
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

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function ForoCategoria() {
  const { categoriaId }        = useParams();
  const { usuario }            = useAuth();
  const [datos, setDatos]      = useState({ categoria: null, hilos: [] });
  const [cargando, setCargando] = useState(true);
  const [modal, setModal]      = useState(false);
  const { navigate }           = { navigate: (path) => window.location.href = path };

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get(`/foro/categorias/${categoriaId}/hilos`);
      setDatos(data);
    } catch {
      toast.error('No se pudo cargar el foro.');
    } finally {
      setCargando(false);
    }
  }, [categoriaId]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleHiloCreado = (hiloId) => {
    setModal(false);
    window.location.href = `/abogado/foro/${categoriaId}/${hiloId}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8 max-w-4xl">

        {/* Breadcrumb */}
        <Link to="/abogado/foro"
          className="inline-flex items-center gap-2 text-sm font-body text-slate-500 hover:text-navy-900 transition-colors mb-6">
          <ArrowLeft size={16} /> Volver al foro
        </Link>

        {/* Encabezado */}
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
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin hilos */}
        {!cargando && datos.hilos.length === 0 && (
          <div className="card p-16 text-center">
            <MessageSquare size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display text-xl text-navy-900 mb-2">Sin hilos todavía</p>
            <p className="font-body text-slate-500 text-sm mb-6">
              Sé el primero en abrir un tema de debate en esta categoría.
            </p>
            <button onClick={() => setModal(true)} className="btn-primary">
              <Plus size={16} /> Crear el primer hilo
            </button>
          </div>
        )}

        {/* Lista de hilos */}
        {!cargando && datos.hilos.length > 0 && (
          <div className="card overflow-hidden">
            {datos.hilos.map((hilo, idx) => (
              <Link
                key={hilo.id}
                to={`/abogado/foro/${categoriaId}/${hilo.id}`}
                className={`flex items-start gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group ${
                  idx < datos.hilos.length - 1 ? 'border-b border-slate-50' : ''
                }`}
              >
                {/* Avatar del autor */}
                <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {hilo.autor_avatar
                    ? <img src={hilo.autor_avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="font-display font-bold text-navy-700 text-sm">
                        {hilo.autor_nombre?.[0]}{hilo.autor_apellido?.[0]}
                      </span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {/* Pin si está fijado */}
                    {hilo.fijado && (
                      <Pin size={14} className="text-gold-500 shrink-0 mt-1" />
                    )}
                    <h3 className={`font-body font-semibold text-sm leading-snug group-hover:text-navy-700 transition-colors ${
                      hilo.fijado ? 'text-navy-900' : 'text-navy-800'
                    }`}>
                      {hilo.titulo}
                      {hilo.cerrado && (
                        <span className="ml-2 text-xs text-slate-400 font-normal">[cerrado]</span>
                      )}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="font-body text-xs text-slate-500">
                      {hilo.autor_nombre} {hilo.autor_apellido}
                    </span>
                    <span className="text-slate-300">·</span>
                    <div className="flex items-center gap-1 font-body text-xs text-slate-400">
                      <MessageSquare size={11} />
                      {parseInt(hilo.total_respuestas) || 0} respuesta{parseInt(hilo.total_respuestas) !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1 font-body text-xs text-slate-400">
                      <Eye size={11} />
                      {parseInt(hilo.vistas) || 0} vistas
                    </div>
                    <div className="flex items-center gap-1 font-body text-xs text-slate-400">
                      <Clock size={11} />
                      {formatDistanceToNow(new Date(hilo.actualizado_en), { addSuffix: true, locale: es })}
                    </div>
                  </div>
                </div>

                <ChevronRight size={16} className="text-slate-300 group-hover:text-navy-700 transition-colors shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal nuevo hilo */}
      {modal && (
        <ModalNuevoHilo
          categoriaId={categoriaId}
          onCerrar={() => setModal(false)}
          onCreado={handleHiloCreado}
        />
      )}
    </div>
  );
}
