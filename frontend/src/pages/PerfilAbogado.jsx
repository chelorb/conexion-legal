// ============================================================
// src/pages/PerfilAbogado.jsx
// Perfil público del abogado — Paleta C: Gris carbón + Cobre
// Visible para cualquier visitante sin login
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Star, Shield, Video, Building2,
  Clock, ArrowLeft, Calendar, MessageSquare,
  ChevronRight, Award
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Estrellas de calificación
// ─────────────────────────────────────────────────────────────
function Estrellas({ valor, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          style={{
            fill: i <= Math.round(valor) ? '#B86030' : '#E8E6E3',
            color: i <= Math.round(valor) ? '#B86030' : '#E8E6E3',
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de reseña
// ─────────────────────────────────────────────────────────────
function TarjetaResena({ resena }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#F0EFED' }}>
            <span className="font-display font-bold text-sm" style={{ color: '#2C2B27' }}>
              {resena.cliente_nombre?.[0]}
            </span>
          </div>
          <div>
            <p className="font-body font-medium text-sm" style={{ color: '#1C1B18' }}>
              {resena.cliente_nombre}
            </p>
            <p className="font-body text-xs" style={{ color: '#8A8780' }}>
              {format(new Date(resena.creado_en), "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <Estrellas valor={resena.calificacion} size={13} />
      </div>
      {resena.comentario && (
        <p className="font-body text-sm leading-relaxed" style={{ color: '#56534A' }}>
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
  const { id }               = useParams();
  const navigate             = useNavigate();
  const { estaAutenticado, esCliente } = useAuth();
  const [abogado,  setAbogado]  = useState(null);
  const [resenas,  setResenas]  = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabActivo, setTabActivo] = useState('info'); // 'info' | 'resenas'

  useEffect(() => {
    const cargar = async () => {
      try {
        const [abogadoRes, resenasRes] = await Promise.all([
          api.get(`/abogados/${id}`),
          api.get(`/calificaciones/abogado/${id}`),
        ]);
        setAbogado(abogadoRes.data.abogado);
        setResenas(resenasRes.data.calificaciones || []);
      } catch {
        navigate('/clientes');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id, navigate]);

  // ── Skeleton ─────────────────────────────────────────────────
  if (cargando) return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-4xl">
        <div className="card p-8 animate-pulse">
          <div className="flex gap-6 mb-6">
            <div className="w-24 h-24 rounded-2xl shrink-0" style={{ background: '#E8E6E3' }} />
            <div className="flex-1 space-y-3">
              <div className="h-7 rounded w-1/2" style={{ background: '#E8E6E3' }} />
              <div className="h-4 rounded w-1/3" style={{ background: '#E8E6E3' }} />
              <div className="h-4 rounded w-1/4" style={{ background: '#E8E6E3' }} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 rounded" style={{ background: '#E8E6E3' }} />
            <div className="h-4 rounded w-4/5" style={{ background: '#E8E6E3' }} />
            <div className="h-4 rounded w-3/5" style={{ background: '#E8E6E3' }} />
          </div>
        </div>
      </div>
    </div>
  );

  if (!abogado) return null;

  const cal = parseFloat(abogado.calificacion_promedio || 0);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>

      {/* ── Header oscuro con info principal ──────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0A0908 0%, #2C2B27 100%)' }}>
        <div className="page-container py-10 max-w-4xl">

          {/* Volver */}
          <Link
            to="/clientes"
            className="inline-flex items-center gap-2 text-sm font-body mb-8 transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            <ArrowLeft size={16} /> Volver al catálogo
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6">

            {/* Avatar */}
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              {abogado.avatar_url
                ? <img src={abogado.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="font-display font-bold text-white text-4xl">
                    {abogado.nombre[0]}{abogado.apellido[0]}
                  </span>
              }
            </div>

            {/* Info principal */}
            <div className="flex-1">
              <div className="flex items-start gap-3 flex-wrap mb-2">
                <h1 className="font-display text-3xl font-bold text-white">
                  Dr./Dra. {abogado.nombre} {abogado.apellido}
                </h1>
                {abogado.matricula_verificada && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full mt-1"
                    style={{ background: 'rgba(184,96,48,0.2)', color: '#C4522E' }}>
                    <Shield size={13} />
                    <span className="font-body text-xs font-medium">Matrícula verificada</span>
                  </div>
                )}
              </div>

              {/* Especialidades principales */}
              {abogado.especialidades?.length > 0 && (
                <p className="font-body mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {abogado.especialidades.slice(0, 3).join(' · ')}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap gap-4">
                {abogado.ciudad && (
                  <div className="flex items-center gap-1.5 font-body text-sm"
                    style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <MapPin size={14} style={{ color: '#B86030' }} />
                    {abogado.ciudad}{abogado.provincia ? `, ${abogado.provincia}` : ''}
                  </div>
                )}
                {abogado.anos_experiencia > 0 && (
                  <div className="flex items-center gap-1.5 font-body text-sm"
                    style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <Award size={14} style={{ color: '#B86030' }} />
                    {abogado.anos_experiencia} años de experiencia
                  </div>
                )}
                {cal > 0 && (
                  <div className="flex items-center gap-2">
                    <Estrellas valor={cal} size={14} />
                    <span className="font-body text-sm font-medium text-white">
                      {cal.toFixed(1)}
                    </span>
                    <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      ({abogado.total_calificaciones} reseñas)
                    </span>
                  </div>
                )}
              </div>

              {/* Modalidades */}
              <div className="flex gap-3 mt-4">
                {abogado.atiende_online && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-body text-xs"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                    <Video size={12} style={{ color: '#B86030' }} /> Online
                  </div>
                )}
                {abogado.atiende_presencial && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-body text-xs"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                    <Building2 size={12} style={{ color: '#B86030' }} /> Presencial
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ────────────────────────────────────── */}
      <div className="page-container py-8 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { id: 'info',   label: 'Información' },
                { id: 'resenas', label: `Reseñas (${resenas.length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTabActivo(tab.id)}
                  className="px-5 py-2.5 rounded-xl text-sm font-body font-medium transition-all"
                  style={tabActivo === tab.id
                    ? { background: '#2C2B27', color: '#fff' }
                    : { background: '#fff', color: '#56534A', border: '1px solid #E8E6E3' }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Información */}
            {tabActivo === 'info' && (
              <div className="space-y-5 animate-fade-in">

                {/* Descripción */}
                {abogado.descripcion && (
                  <div className="card p-6">
                    <h2 className="font-display font-semibold text-lg mb-3" style={{ color: '#1C1B18' }}>
                      Sobre el/la profesional
                    </h2>
                    <p className="font-body text-sm leading-relaxed" style={{ color: '#56534A' }}>
                      {abogado.descripcion}
                    </p>
                  </div>
                )}

                {/* Especialidades completas */}
                {abogado.especialidades?.length > 0 && (
                  <div className="card p-6">
                    <h2 className="font-display font-semibold text-lg mb-4" style={{ color: '#1C1B18' }}>
                      Especialidades
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {abogado.especialidades.map(esp => (
                        <span
                          key={esp}
                          className="font-body text-sm px-4 py-2 rounded-xl"
                          style={{ background: '#F0EFED', color: '#3A3832' }}
                        >
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modalidad de atención */}
                <div className="card p-6">
                  <h2 className="font-display font-semibold text-lg mb-4" style={{ color: '#1C1B18' }}>
                    Modalidad de atención
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {abogado.atiende_online && (
                      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#F7F6F4' }}>
                        <Video size={20} style={{ color: '#B86030' }} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>Online</p>
                          <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>
                            Videollamada o chat
                          </p>
                        </div>
                      </div>
                    )}
                    {abogado.atiende_presencial && (
                      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#F7F6F4' }}>
                        <Building2 size={20} style={{ color: '#B86030' }} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>Presencial</p>
                          <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>
                            {abogado.ciudad || 'En su consultorio'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Matrícula */}
                {abogado.matricula && (
                  <div className="card p-6">
                    <h2 className="font-display font-semibold text-lg mb-3" style={{ color: '#1C1B18' }}>
                      Matrícula profesional
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2.5 rounded-xl font-mono text-sm font-semibold"
                        style={{ background: '#F0EFED', color: '#1C1B18' }}>
                        {abogado.matricula}
                      </div>
                      {abogado.matricula_verificada && (
                        <div className="flex items-center gap-1.5 font-body text-sm"
                          style={{ color: '#B86030' }}>
                          <Shield size={15} />
                          Verificada por Conexión Legal
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Reseñas */}
            {tabActivo === 'resenas' && (
              <div className="space-y-4 animate-fade-in">
                {resenas.length === 0 ? (
                  <div className="card p-14 text-center">
                    <MessageSquare size={36} className="mx-auto mb-3" style={{ color: '#D4D2CC' }} />
                    <p className="font-display text-xl mb-1" style={{ color: '#1C1B18' }}>
                      Sin reseñas aún
                    </p>
                    <p className="font-body text-sm" style={{ color: '#8A8780' }}>
                      Sé el primero en dejar una reseña después de tu consulta.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Resumen de calificaciones */}
                    <div className="card p-6">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="font-display font-bold text-5xl" style={{ color: '#1C1B18' }}>
                            {cal.toFixed(1)}
                          </p>
                          <Estrellas valor={cal} size={18} />
                          <p className="font-body text-xs mt-1" style={{ color: '#8A8780' }}>
                            {resenas.length} reseña{resenas.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {/* Distribución por estrella */}
                        <div className="flex-1 space-y-2">
                          {[5,4,3,2,1].map(n => {
                            const count = resenas.filter(r => r.calificacion === n).length;
                            const pct   = resenas.length > 0 ? (count / resenas.length) * 100 : 0;
                            return (
                              <div key={n} className="flex items-center gap-3">
                                <span className="font-body text-xs w-4 text-right" style={{ color: '#8A8780' }}>{n}</span>
                                <div className="flex-1 rounded-full h-1.5" style={{ background: '#F0EFED' }}>
                                  <div className="h-1.5 rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: '#B86030' }} />
                                </div>
                                <span className="font-body text-xs w-4" style={{ color: '#8A8780' }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Lista de reseñas */}
                    {resenas.map(r => <TarjetaResena key={r.id} resena={r} />)}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Columna lateral: CTA de contacto */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Card de agendar */}
              <div className="card p-6">
                <h3 className="font-display font-semibold text-lg mb-1" style={{ color: '#1C1B18' }}>
                  Agendar consulta
                </h3>
                <p className="font-body text-sm mb-5" style={{ color: '#8A8780' }}>
                  Contactá a Dr./Dra. {abogado.nombre} para una primera consulta.
                </p>

                {estaAutenticado && esCliente ? (
                  <Link
                    to={`/nueva-consulta/${abogado.id}`}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors"
                    style={{ background: '#B86030' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#8B4A1E'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}
                  >
                    <Calendar size={16} /> Agendar ahora
                  </Link>
                ) : estaAutenticado ? (
                  <div className="text-center p-4 rounded-xl font-body text-sm"
                    style={{ background: '#F7F6F4', color: '#8A8780' }}>
                    Solo los clientes pueden agendar consultas.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to={`/login?redirect=/abogados/${abogado.id}`}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors"
                      style={{ background: '#B86030' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#8B4A1E'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}
                    >
                      <Calendar size={16} /> Agendar consulta
                    </Link>
                    <p className="text-center font-body text-xs" style={{ color: '#8A8780' }}>
                      Necesitás una cuenta de cliente.{' '}
                      <Link to="/registro?rol=cliente" className="hover:underline"
                        style={{ color: '#B86030' }}>
                        Registrate gratis
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              {/* Stats rápidas */}
              <div className="card p-5 space-y-4">
                {[
                  {
                    icono: Star,
                    label: 'Calificación',
                    valor: cal > 0 ? `${cal.toFixed(1)} / 5` : 'Sin reseñas',
                  },
                  {
                    icono: Clock,
                    label: 'Experiencia',
                    valor: abogado.anos_experiencia > 0
                      ? `${abogado.anos_experiencia} años`
                      : 'No especificado',
                  },
                  {
                    icono: MessageSquare,
                    label: 'Consultas completadas',
                    valor: abogado.consultas_completadas > 0
                      ? abogado.consultas_completadas
                      : 'Nueva en la plataforma',
                  },
                ].map(({ icono: Icono, label, valor }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icono size={15} style={{ color: '#B86030' }} />
                      <span className="font-body text-sm" style={{ color: '#56534A' }}>{label}</span>
                    </div>
                    <span className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>
                      {valor}
                    </span>
                  </div>
                ))}
              </div>

              {/* Link ver otros abogados */}
              <Link
                to="/clientes"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-body text-sm border transition-colors"
                style={{ borderColor: '#E8E6E3', color: '#56534A' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                Ver otros abogados <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
