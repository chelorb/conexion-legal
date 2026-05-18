// ============================================================
// src/pages/abogado/ForoHilo.jsx
// Vista de un hilo del foro con todas sus respuestas
// Permite responder, y al autor eliminar su propio hilo
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Send, Trash2, Pin,
  MessageSquare, Eye, Clock, Shield
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de mensaje (hilo original o respuesta)
// ─────────────────────────────────────────────────────────────
function TarjetaMensaje({ mensaje, esPrimerMensaje, usuarioActual, onEliminar }) {
  const esPropio = mensaje.autor_id === usuarioActual?.id;
  const esAdmin  = usuarioActual?.rol === 'admin';

  return (
    <div className={`card p-6 ${esPrimerMensaje ? 'border-navy-200 border-2' : ''}`}>
      <div className="flex items-start gap-4">

        {/* Avatar del autor */}
        <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center shrink-0 overflow-hidden">
          {mensaje.autor_avatar
            ? <img src={mensaje.autor_avatar} alt="" className="w-full h-full object-cover" />
            : (
              <div className="w-full h-full flex items-center justify-center bg-navy-900">
                <span className="font-display font-bold text-white">
                  {mensaje.autor_nombre?.[0]}{mensaje.autor_apellido?.[0]}
                </span>
              </div>
            )
          }
        </div>

        <div className="flex-1 min-w-0">
          {/* Cabecera del mensaje */}
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-body font-semibold text-navy-900">
                  Dr./Dra. {mensaje.autor_nombre} {mensaje.autor_apellido}
                </p>
                {/* Badge de plan */}
                {mensaje.autor_plan === 'comunidad' && (
                  <span className="text-xs font-body font-medium px-2 py-0.5 rounded-full bg-gold-300/20 text-gold-700">
                    ★ Comunidad
                  </span>
                )}
                {/* Badge de verificado */}
                <Shield size={12} className="text-navy-700" title="Abogado verificado" />
              </div>
              {/* Especialidades del autor */}
              {mensaje.especialidades?.length > 0 && (
                <p className="font-body text-xs text-slate-400 mt-0.5">
                  {mensaje.especialidades.slice(0, 2).join(' · ')}
                  {mensaje.anos_experiencia && ` · ${mensaje.anos_experiencia} años de exp.`}
                </p>
              )}
            </div>

            {/* Fecha y acciones */}
            <div className="flex items-center gap-2">
              <span className="font-body text-xs text-slate-400">
                {format(new Date(mensaje.creado_en), "d MMM yyyy 'a las' HH:mm", { locale: es })}
              </span>
              {/* Botón eliminar — solo autor o admin */}
              {(esPropio || esAdmin) && (
                <button
                  onClick={() => onEliminar(mensaje.id, esPrimerMensaje)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Contenido del mensaje */}
          <div className="font-body text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {mensaje.contenido}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function ForoHilo() {
  const { categoriaId, hiloId } = useParams();
  const { usuario }             = useAuth();
  const [datos,    setDatos]    = useState({ hilo: null, respuestas: [] });
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const respuestaRef            = useRef(null); // Para hacer scroll al formulario

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const contenido = watch('contenido', '');

  // Cargar el hilo con sus respuestas
  const cargar = useCallback(async () => {
    try {
      const { data } = await api.get(`/foro/hilos/${hiloId}`);
      setDatos(data);
    } catch {
      toast.error('No se pudo cargar el hilo.');
    } finally {
      setCargando(false);
    }
  }, [hiloId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Enviar una respuesta
  const onSubmit = async (formDatos) => {
    setEnviando(true);
    try {
      await api.post(`/foro/hilos/${hiloId}/respuestas`, formDatos);
      reset(); // Limpiar el formulario
      await cargar(); // Recargar el hilo con la nueva respuesta
      toast.success('Respuesta publicada.');
      // Hacer scroll al final para ver la nueva respuesta
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al publicar la respuesta.');
    } finally {
      setEnviando(false);
    }
  };

  // Eliminar hilo o respuesta
  const handleEliminar = async (id, esHilo) => {
    const confirmMsg = esHilo
      ? '¿Eliminar este hilo y todas sus respuestas?'
      : '¿Eliminar esta respuesta?';

    if (!window.confirm(confirmMsg)) return;

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
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar.');
    }
  };

  // ── Estado de carga ─────────────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="page-container py-8 max-w-4xl">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-4/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { hilo, respuestas } = datos;

  if (!hilo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-xl text-navy-900 mb-2">Hilo no encontrado</p>
          <Link to="/abogado/foro" className="btn-secondary mt-4">Volver al foro</Link>
        </div>
      </div>
    );
  }

  // Construir el primer mensaje con los datos del hilo
  const primerMensaje = {
    id:              hilo.id,
    autor_id:        hilo.autor_id,
    autor_nombre:    hilo.autor_nombre,
    autor_apellido:  hilo.autor_apellido,
    autor_avatar:    hilo.autor_avatar,
    autor_plan:      hilo.autor_plan,
    especialidades:  hilo.especialidades,
    anos_experiencia: hilo.anos_experiencia,
    contenido:       hilo.contenido,
    creado_en:       hilo.creado_en,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8 max-w-4xl">

        {/* ── Breadcrumb ───────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6 font-body text-sm text-slate-500">
          <Link to="/abogado/foro" className="hover:text-navy-900 transition-colors">
            Foro
          </Link>
          <span>/</span>
          <Link to={`/abogado/foro/${categoriaId}`} className="hover:text-navy-900 transition-colors">
            {hilo.categoria_icono} {hilo.categoria_nombre}
          </Link>
          <span>/</span>
          <span className="text-navy-900 font-medium truncate max-w-xs">{hilo.titulo}</span>
        </div>

        {/* ── Título del hilo ──────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-start gap-3 flex-wrap">
            {hilo.fijado && (
              <div className="flex items-center gap-1.5 text-xs font-body font-medium text-gold-600 bg-gold-50 px-3 py-1.5 rounded-full">
                <Pin size={12} /> Fijado
              </div>
            )}
            {hilo.cerrado && (
              <div className="flex items-center gap-1.5 text-xs font-body font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                🔒 Cerrado
              </div>
            )}
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-navy-900 mt-2 leading-tight">
            {hilo.titulo}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 font-body text-xs text-slate-400">
              <MessageSquare size={12} />
              {respuestas.length} respuesta{respuestas.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-1.5 font-body text-xs text-slate-400">
              <Eye size={12} />
              {parseInt(hilo.vistas) || 0} vistas
            </div>
            <div className="flex items-center gap-1.5 font-body text-xs text-slate-400">
              <Clock size={12} />
              {formatDistanceToNow(new Date(hilo.creado_en), { addSuffix: true, locale: es })}
            </div>
          </div>
        </div>

        {/* ── Mensajes ─────────────────────────────────────── */}
        <div className="space-y-4 mb-8">
          {/* Primer mensaje (el hilo en sí) */}
          <TarjetaMensaje
            mensaje={primerMensaje}
            esPrimerMensaje={true}
            usuarioActual={usuario}
            onEliminar={(id) => handleEliminar(id, true)}
          />

          {/* Respuestas */}
          {respuestas.map(r => (
            <TarjetaMensaje
              key={r.id}
              mensaje={r}
              esPrimerMensaje={false}
              usuarioActual={usuario}
              onEliminar={(id) => handleEliminar(id, false)}
            />
          ))}
        </div>

        {/* ── Formulario de respuesta ───────────────────────── */}
        {!hilo.cerrado ? (
          <div className="card p-6" ref={respuestaRef}>
            <h3 className="font-display font-semibold text-navy-900 mb-4">
              Tu respuesta
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <textarea
                  rows={5}
                  placeholder="Escribí tu respuesta o aporte al tema..."
                  className={`input-field resize-none ${errors.contenido ? 'border-red-300' : ''}`}
                  {...register('contenido', {
                    required: 'Escribí algo antes de enviar',
                    minLength: { value: 5, message: 'Mínimo 5 caracteres' },
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
          <div className="card p-6 text-center bg-slate-50">
            <p className="font-body text-slate-500 text-sm">
              🔒 Este hilo está cerrado. No se pueden agregar más respuestas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
