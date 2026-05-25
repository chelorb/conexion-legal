// ============================================================
// src/pages/abogado/ForoHilo.jsx — Paleta C
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, Pin, MessageSquare, Eye, Clock, Shield } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function TarjetaMensaje({ mensaje, esPrimerMensaje, usuarioActual, onEliminar }) {
  const esPropio = mensaje.autor_id === usuarioActual?.id;
  const esAdmin  = usuarioActual?.rol === 'admin';

  return (
    <div
      className="card p-6"
      style={esPrimerMensaje ? { borderColor: '#2C2B27', borderWidth: '2px' } : {}}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: '#2C2B27' }}
        >
          {mensaje.autor_avatar
            ? <img src={mensaje.autor_avatar} alt="" className="w-full h-full object-cover" />
            : <span className="font-display font-bold text-white">
                {mensaje.autor_nombre?.[0]}{mensaje.autor_apellido?.[0]}
              </span>
          }
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
                  Dr./Dra. {mensaje.autor_nombre} {mensaje.autor_apellido}
                </p>
                {mensaje.autor_plan === 'comunidad' && (
                  <span className="text-xs font-body font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ background: '#B86030' }}>
                    ★ Comunidad
                  </span>
                )}
                <Shield size={12} style={{ color: '#B86030' }} title="Abogado verificado" />
              </div>
              {mensaje.especialidades?.length > 0 && (
                <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>
                  {mensaje.especialidades.slice(0, 2).join(' · ')}
                  {mensaje.anos_experiencia && ` · ${mensaje.anos_experiencia} años`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                {format(new Date(mensaje.creado_en), "d MMM yyyy · HH:mm", { locale: es })}
              </span>
              {(esPropio || esAdmin) && (
                <button onClick={() => onEliminar(mensaje.id, esPrimerMensaje)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#D4D2CC' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#FEF2F2'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#D4D2CC'; e.currentTarget.style.background = ''; }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Contenido */}
          <div className="font-body text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#3A3832' }}>
            {mensaje.contenido}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForoHilo() {
  const { categoriaId, hiloId } = useParams();
  const { usuario }             = useAuth();
  const [datos,    setDatos]    = useState({ hilo: null, respuestas: [] });
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const contenido = watch('contenido', '');

  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get(`/foro/hilos/${hiloId}`);
      setDatos(data);
    } catch { toast.error('No se pudo cargar el hilo.'); }
    finally { setCargando(false); }
  }, [hiloId]);

  useEffect(() => { cargar(); }, [cargar]);

  const onSubmit = async (formDatos) => {
    setEnviando(true);
    try {
      await api.post(`/foro/hilos/${hiloId}/respuestas`, formDatos);
      reset();
      await cargar();
      toast.success('Respuesta publicada.');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al publicar.');
    } finally { setEnviando(false); }
  };

  const handleEliminar = async (id, esHilo) => {
    if (!window.confirm(esHilo ? '¿Eliminar este hilo y todas sus respuestas?' : '¿Eliminar esta respuesta?')) return;
    try {
      if (esHilo) {
        await api.delete(`/foro/hilos/${id}`);
        toast.success('Hilo eliminado.');
        window.location.href = `/abogado/foro/${categoriaId}`;
      } else {
        await api.delete(`/foro/respuestas/${id}`);
        toast.success('Respuesta eliminada.');
        await cargar();
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Error al eliminar.'); }
  };

  if (cargando) return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-4xl space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="card p-6 animate-pulse flex gap-4">
            <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: '#E8E6E3' }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded w-1/3" style={{ background: '#E8E6E3' }} />
              <div className="h-3 rounded" style={{ background: '#E8E6E3' }} />
              <div className="h-3 rounded w-4/5" style={{ background: '#E8E6E3' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const { hilo, respuestas } = datos;
  if (!hilo) return null;

  const primerMensaje = {
    id: hilo.id, autor_id: hilo.autor_id,
    autor_nombre: hilo.autor_nombre, autor_apellido: hilo.autor_apellido,
    autor_avatar: hilo.autor_avatar, autor_plan: hilo.autor_plan,
    especialidades: hilo.especialidades, anos_experiencia: hilo.anos_experiencia,
    contenido: hilo.contenido, creado_en: hilo.creado_en,
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-4xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 font-body text-sm" style={{ color: '#8A8780' }}>
          <Link to="/abogado/foro" className="hover:underline" style={{ color: '#8A8780' }}>Foro</Link>
          <span>/</span>
          <Link to={`/abogado/foro/${categoriaId}`} className="hover:underline" style={{ color: '#8A8780' }}>
            {hilo.categoria_icono} {hilo.categoria_nombre}
          </Link>
          <span>/</span>
          <span className="truncate max-w-xs" style={{ color: '#1C1B18' }}>{hilo.titulo}</span>
        </div>

        {/* Título */}
        <div className="mb-6">
          {hilo.fijado && (
            <div className="inline-flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1.5 rounded-full mb-3"
              style={{ background: 'rgba(184,96,48,0.1)', color: '#B86030' }}>
              <Pin size={12} /> Fijado
            </div>
          )}
          <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight" style={{ color: '#1C1B18' }}>
            {hilo.titulo}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            {[
              { icono: MessageSquare, val: `${respuestas.length} respuesta${respuestas.length !== 1 ? 's' : ''}` },
              { icono: Eye, val: `${parseInt(hilo.vistas) || 0} vistas` },
              { icono: Clock, val: formatDistanceToNow(new Date(hilo.creado_en), { addSuffix: true, locale: es }) },
            ].map(({ icono: Icono, val }) => (
              <div key={val} className="flex items-center gap-1.5 font-body text-xs" style={{ color: '#8A8780' }}>
                <Icono size={12} /> {val}
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes */}
        <div className="space-y-4 mb-8">
          <TarjetaMensaje mensaje={primerMensaje} esPrimerMensaje usuarioActual={usuario}
            onEliminar={id => handleEliminar(id, true)} />
          {respuestas.map(r => (
            <TarjetaMensaje key={r.id} mensaje={r} esPrimerMensaje={false}
              usuarioActual={usuario} onEliminar={id => handleEliminar(id, false)} />
          ))}
        </div>

        {/* Formulario respuesta */}
        {!hilo.cerrado ? (
          <div className="card p-6">
            <h3 className="font-display font-semibold mb-4" style={{ color: '#1C1B18' }}>Tu respuesta</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <textarea rows={5} placeholder="Escribí tu respuesta o aporte al tema..."
                  className={`input-field resize-none ${errors.contenido ? 'border-red-300' : ''}`}
                  {...register('contenido', {
                    required: 'Escribí algo antes de enviar',
                    minLength: { value: 5, message: 'Mínimo 5 caracteres' },
                  })} />
                <div className="flex items-center justify-between mt-1">
                  {errors.contenido ? <p className="input-error">{errors.contenido.message}</p> : <span />}
                  <p className="font-body text-xs" style={{ color: '#8A8780' }}>{contenido.length} caracteres</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={enviando} className="btn-primary">
                  {enviando
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Publicando...</>
                    : <><Send size={15} /> Publicar respuesta</>
                  }
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="card p-6 text-center" style={{ background: '#F7F6F4' }}>
            <p className="font-body text-sm" style={{ color: '#8A8780' }}>
              🔒 Este hilo está cerrado. No se pueden agregar más respuestas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
