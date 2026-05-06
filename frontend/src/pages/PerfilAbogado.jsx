// ============================================================
// src/pages/PerfilAbogado.jsx
// Perfil público completo de un abogado
// Accesible desde la grilla: /abogados/:id
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Star, Shield, Video, Building2,
  Calendar, ArrowLeft, Award, Clock, CheckCircle,
  ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Estrellas de calificación (solo lectura)
// ─────────────────────────────────────────────────────────────
function Estrellas({ valor, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(valor)
            ? 'fill-gold-500 text-gold-500'
            : 'fill-slate-200 text-slate-200'
          }
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de reseña de un cliente
// ─────────────────────────────────────────────────────────────
function TarjetaResena({ resena }) {
  return (
    <div className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          {/* Avatar inicial del cliente */}
          <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center shrink-0">
            <span className="font-body font-semibold text-navy-700 text-sm">
              {resena.cliente_nombre?.[0] || '?'}
            </span>
          </div>
          <div>
            <p className="font-body font-medium text-navy-900 text-sm">{resena.cliente_nombre}</p>
            <p className="font-body text-xs text-slate-400">
              {format(new Date(resena.creado_en), "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <Estrellas valor={resena.puntaje} size={13} />
      </div>
      {resena.comentario && (
        <p className="font-body text-sm text-slate-600 leading-relaxed ml-12">
          "{resena.comentario}"
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function PerfilAbogado() {
  const { id }             = useParams();
  const navigate           = useNavigate();
  const { estaAutenticado, esCliente } = useAuth();

  const [abogado,      setAbogado]      = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [verMasDesc,   setVerMasDesc]   = useState(false); // Toggle descripción larga

  // Cargar datos del abogado
  useEffect(() => {
    window.scrollTo(0, 0); // Siempre ir al inicio al entrar al perfil
    api.get(`/abogados/${id}`)
      .then(r => {
        setAbogado(r.data.abogado);
        setCalificaciones(r.data.calificaciones || []);
      })
      .catch(() => {
        toast.error('No se encontró el perfil del abogado.');
        navigate('/abogados');
      })
      .finally(() => setCargando(false));
  }, [id, navigate]);

  // Función para compartir el perfil
  const compartir = () => {
    if (navigator.share) {
      navigator.share({
        title: `Dr./Dra. ${abogado.nombre} ${abogado.apellido} — Conexión Legal`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  // ── Estado de carga ─────────────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="page-container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-slate-200 rounded w-32" />
            <div className="card p-8">
              <div className="flex gap-6">
                <div className="w-28 h-28 bg-slate-200 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!abogado) return null;

  // Recortar descripción larga
  const DESC_MAX = 300;
  const descLarga = abogado.descripcion?.length > DESC_MAX;
  const descMostrada = descLarga && !verMasDesc
    ? abogado.descripcion.slice(0, DESC_MAX) + '...'
    : abogado.descripcion;

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in">
      <div className="page-container py-8">

        {/* ── Botón volver ──────────────────────────────────── */}
        <Link
          to="/abogados"
          className="inline-flex items-center gap-2 text-sm font-body text-slate-500 hover:text-navy-900 transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Volver a la búsqueda
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Columna principal (2/3) ───────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tarjeta de cabecera del abogado */}
            <div className="card p-8">
              <div className="flex flex-col sm:flex-row gap-6">

                {/* Avatar grande */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-2xl bg-navy-100 overflow-hidden">
                    {abogado.avatar_url
                      ? <img src={abogado.avatar_url} alt={abogado.nombre} className="w-full h-full object-cover" />
                      : (
                        <div className="w-full h-full flex items-center justify-center bg-navy-900">
                          <span className="font-display font-bold text-white text-4xl">
                            {abogado.nombre[0]}{abogado.apellido[0]}
                          </span>
                        </div>
                      )
                    }
                  </div>
                  {/* Sello de verificación */}
                  {abogado.matricula_verificada && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-navy-900 rounded-full flex items-center justify-center border-2 border-white">
                      <Shield size={14} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Datos principales */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="font-display text-3xl font-bold text-navy-900">
                        Dr./Dra. {abogado.nombre} {abogado.apellido}
                      </h1>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="font-body text-sm text-slate-500">
                          {abogado.ciudad}, {abogado.provincia}
                        </span>
                      </div>
                    </div>
                    {/* Botón compartir */}
                    <button onClick={compartir}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 hover:text-navy-900">
                      <Share2 size={16} />
                    </button>
                  </div>

                  {/* Calificación y métricas */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Estrellas valor={abogado.calificacion_promedio} />
                      <span className="font-body font-semibold text-navy-900 text-sm">
                        {abogado.calificacion_promedio > 0
                          ? abogado.calificacion_promedio.toFixed(1)
                          : '—'
                        }
                      </span>
                      <span className="font-body text-xs text-slate-400">
                        ({abogado.total_calificaciones} reseña{abogado.total_calificaciones !== 1 ? 's' : ''})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-body text-slate-500">
                      <CheckCircle size={14} className="text-green-500" />
                      {abogado.consultas_completadas} consultas completadas
                    </div>

                    {abogado.anos_experiencia && (
                      <div className="flex items-center gap-1.5 text-sm font-body text-slate-500">
                        <Clock size={14} className="text-navy-700" />
                        {abogado.anos_experiencia} años de experiencia
                      </div>
                    )}
                  </div>

                  {/* Modalidades disponibles */}
                  <div className="flex gap-3 mt-4">
                    {abogado.atiende_online && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-body font-medium">
                        <Video size={12} /> Atiende online
                      </div>
                    )}
                    {abogado.atiende_presencial && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-50 text-navy-700 rounded-full text-xs font-body font-medium">
                        <Building2 size={12} /> Atiende presencial
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Especialidades */}
            {abogado.especialidades?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display font-semibold text-navy-900 text-lg mb-4">Especialidades</h2>
                <div className="flex flex-wrap gap-2">
                  {abogado.especialidades.map(esp => (
                    <span key={esp} className="px-4 py-2 bg-navy-50 text-navy-800 font-body text-sm rounded-xl font-medium">
                      {esp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Descripción profesional */}
            {abogado.descripcion && (
              <div className="card p-6">
                <h2 className="font-display font-semibold text-navy-900 text-lg mb-4">Sobre el profesional</h2>
                <p className="font-body text-slate-600 leading-relaxed">{descMostrada}</p>
                {descLarga && (
                  <button
                    onClick={() => setVerMasDesc(!verMasDesc)}
                    className="mt-3 flex items-center gap-1.5 text-sm font-body text-navy-700 hover:text-navy-900 font-medium"
                  >
                    {verMasDesc ? <><ChevronUp size={16} /> Ver menos</> : <><ChevronDown size={16} /> Ver más</>}
                  </button>
                )}
              </div>
            )}

            {/* Verificación de matrícula */}
            {abogado.matricula_verificada && (
              <div className="card p-6 border-l-4 border-l-navy-900">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center shrink-0">
                    <Award size={20} className="text-navy-900" />
                  </div>
                  <div>
                    <h3 className="font-body font-semibold text-navy-900">Perfil verificado</h3>
                    <p className="font-body text-sm text-slate-500 mt-1 leading-relaxed">
                      La matrícula y los datos profesionales de este abogado/a fueron verificados por el equipo de Conexión Legal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Calificaciones y reseñas */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-navy-900 text-lg">
                  Reseñas de clientes
                </h2>
                {abogado.calificacion_promedio > 0 && (
                  <div className="flex items-center gap-2">
                    <Estrellas valor={abogado.calificacion_promedio} size={18} />
                    <span className="font-display font-bold text-navy-900 text-xl">
                      {abogado.calificacion_promedio.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {calificaciones.length === 0 ? (
                <div className="text-center py-8">
                  <Star size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="font-body text-slate-400 text-sm">
                    Todavía no hay reseñas para este profesional.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {calificaciones.map((r, i) => (
                    <TarjetaResena key={i} resena={r} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Panel lateral: CTA de agendar (1/3) ──────── */}
          <div>
            <div className="card p-6 sticky top-24">
              <h3 className="font-display font-semibold text-navy-900 text-lg mb-2">
                Agendá una consulta
              </h3>
              <p className="font-body text-sm text-slate-500 mb-6">
                Elegí el horario que mejor te quede. El profesional confirmará a la brevedad.
              </p>

              {/* Disponibilidad */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="font-body text-sm text-slate-600">Modalidad</span>
                  <div className="flex gap-2">
                    {abogado.atiende_online     && <span className="flex items-center gap-1 text-xs font-body text-blue-700 bg-blue-50 px-2 py-1 rounded-full"><Video size={10}/> Online</span>}
                    {abogado.atiende_presencial && <span className="flex items-center gap-1 text-xs font-body text-navy-700 bg-navy-50 px-2 py-1 rounded-full"><Building2 size={10}/> Presencial</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="font-body text-sm text-slate-600">Experiencia</span>
                  <span className="font-body text-sm font-medium text-navy-900">
                    {abogado.anos_experiencia ? `${abogado.anos_experiencia} años` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-body text-sm text-slate-600">Consultas</span>
                  <span className="font-body text-sm font-medium text-navy-900">
                    {abogado.consultas_completadas} completadas
                  </span>
                </div>
              </div>

              {/* Botón principal de acción */}
              {esCliente ? (
                // Cliente autenticado → agendar directo
                <Link
                  to={`/nueva-consulta/${id}`}
                  className="btn-primary w-full justify-center py-3.5"
                >
                  <Calendar size={16} /> Agendar consulta
                </Link>
              ) : estaAutenticado ? (
                // Abogado autenticado → no puede agendar
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="font-body text-sm text-slate-500">
                    Solo los clientes pueden agendar consultas.
                  </p>
                </div>
              ) : (
                // No autenticado → registrarse primero
                <div className="space-y-3">
                  <Link
                    to="/registro"
                    className="btn-primary w-full justify-center py-3.5"
                  >
                    <Calendar size={16} /> Agendar consulta
                  </Link>
                  <p className="font-body text-xs text-slate-400 text-center">
                    Necesitás crear una cuenta gratuita para agendar.
                  </p>
                  <Link to="/login" className="btn-secondary w-full justify-center text-sm">
                    Ya tengo cuenta — Iniciar sesión
                  </Link>
                </div>
              )}

              {/* Aviso de seguridad */}
              <div className="flex items-start gap-2 mt-5">
                <Shield size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="font-body text-xs text-slate-400 leading-relaxed">
                  Tus datos están protegidos. Solo el abogado puede ver la descripción de tu caso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
