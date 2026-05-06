// ============================================================
// src/pages/abogado/Dashboard.jsx
// Panel principal del abogado autenticado
// Muestra estadísticas, próximas consultas y estado del perfil
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Star, CheckCircle, Clock,
  AlertCircle, ArrowRight, Video, Building2,
  TrendingUp, Award
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Tarjeta de estadística ───────────────────────────────────
function StatCard({ icono: Icono, valor, label, color = 'bg-navy-50', colorTexto = 'text-navy-900' }) {
  return (
    <div className="card p-6">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} mb-4`}>
        <Icono size={18} className={colorTexto} />
      </div>
      <p className="font-display text-3xl font-bold text-navy-900">{valor ?? '—'}</p>
      <p className="font-body text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

// ── Badge de estado de consulta ──────────────────────────────
function BadgeEstado({ estado }) {
  const mapa = {
    pendiente:  { clase: 'badge-pendiente',  label: 'Pendiente' },
    confirmada: { clase: 'badge-confirmada', label: 'Confirmada' },
    completada: { clase: 'badge-completada', label: 'Completada' },
    cancelada:  { clase: 'badge-cancelada',  label: 'Cancelada' },
  };
  const { clase, label } = mapa[estado] || { clase: 'badge-pendiente', label: estado };
  return <span className={clase}>{label}</span>;
}

export default function DashboardAbogado() {
  const { usuario } = useAuth();
  const [datos,    setDatos]    = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get('/abogados/me/dashboard');
        setDatos(data);
      } catch {
        // Se maneja silenciosamente — el usuario verá el estado vacío
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-body">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  const perfil = datos?.perfil;
  const stats  = datos?.estadisticas;
  const proximas = datos?.proximas_consultas || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* ── Saludo y estado del perfil ────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-900">
              Bienvenido/a, Dr./Dra. {usuario?.nombre}
            </h1>
            <p className="font-body text-slate-500 mt-1">
              Plan: <span className="font-medium text-navy-700">{perfil?.plan_nombre || 'Gratuito'}</span>
              {perfil?.suscripcion_fin && (
                <span className="text-slate-400"> · Vence {format(new Date(perfil.suscripcion_fin), "d 'de' MMMM yyyy", { locale: es })}</span>
              )}
            </p>
          </div>
          <Link to="/abogado/suscripcion" className="btn-gold shrink-0">
            <Award size={16} /> Mejorar plan
          </Link>
        </div>

        {/* ── Alertas de perfil incompleto ──────────────── */}
        {!perfil?.perfil_completo && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-body font-medium text-amber-800">Tu perfil está incompleto</p>
              <p className="font-body text-sm text-amber-600 mt-0.5">
                Completá tu perfil para aparecer en la búsqueda de clientes y acceder a todas las funciones.
              </p>
            </div>
            <Link to="/abogado/perfil" className="btn-secondary text-sm shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50">
              Completar perfil
            </Link>
          </div>
        )}

        {!perfil?.visible_en_grilla && perfil?.perfil_completo && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-body font-medium text-blue-800">Perfil en revisión</p>
              <p className="font-body text-sm text-blue-600 mt-0.5">
                Tu perfil está siendo revisado por nuestro equipo. Te notificaremos cuando esté aprobado.
              </p>
            </div>
          </div>
        )}

        {/* ── Estadísticas ──────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icono={Clock}
            valor={stats?.consultas_pendientes}
            label="Pendientes de confirmar"
            color="bg-amber-50"
            colorTexto="text-amber-600"
          />
          <StatCard
            icono={Calendar}
            valor={stats?.consultas_confirmadas}
            label="Confirmadas"
            color="bg-blue-50"
            colorTexto="text-blue-600"
          />
          <StatCard
            icono={CheckCircle}
            valor={stats?.completadas_este_mes}
            label="Completadas este mes"
            color="bg-green-50"
            colorTexto="text-green-600"
          />
          <StatCard
            icono={Star}
            valor={perfil?.calificacion_promedio > 0
              ? `${perfil.calificacion_promedio} ★`
              : '—'
            }
            label={`Calificación (${perfil?.total_calificaciones || 0} reseñas)`}
            color="bg-gold-300/20"
            colorTexto="text-gold-600"
          />
        </div>

        {/* ── Contenido en dos columnas ─────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Próximas consultas (2/3) */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="font-display font-semibold text-navy-900 text-lg">Próximas consultas</h2>
                <Link to="/abogado/consultas" className="font-body text-sm text-navy-700 hover:text-navy-900 flex items-center gap-1">
                  Ver todas <ArrowRight size={14} />
                </Link>
              </div>

              {proximas.length === 0 ? (
                <div className="p-10 text-center">
                  <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="font-body text-slate-500 text-sm">No tenés consultas próximas.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {proximas.map(c => (
                    <div key={c.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors">

                      {/* Fecha */}
                      <div className="shrink-0 text-center bg-navy-50 rounded-xl px-3 py-2 min-w-[56px]">
                        <p className="font-body text-xs text-slate-500 uppercase tracking-wider">
                          {format(new Date(c.fecha_hora), 'MMM', { locale: es })}
                        </p>
                        <p className="font-display font-bold text-navy-900 text-xl leading-none">
                          {format(new Date(c.fecha_hora), 'd')}
                        </p>
                      </div>

                      {/* Detalle */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-body font-medium text-navy-900 text-sm">
                              {c.cliente_nombre} {c.cliente_apellido}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                {c.tipo === 'online'
                                  ? <><Video size={11} /> Online</>
                                  : <><Building2 size={11} /> Presencial</>
                                }
                              </div>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-500 font-body">
                                {format(new Date(c.fecha_hora), "HH:mm 'hs'")}
                              </span>
                            </div>
                          </div>
                          <BadgeEstado estado={c.estado} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel lateral (1/3) */}
          <div className="space-y-4">

            {/* Estado del plan */}
            <div className="card p-6">
              <h3 className="font-body font-semibold text-navy-900 text-sm mb-4">Estado de tu cuenta</h3>
              <div className="space-y-3">
                {[
                  { label: 'Perfil completo',    ok: perfil?.perfil_completo },
                  { label: 'Visible en búsqueda', ok: perfil?.visible_en_grilla },
                  { label: 'Suscripción activa', ok: perfil?.suscripcion_activa },
                  { label: 'Credencial virtual', ok: perfil?.credencial_activa ?? false },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-body text-sm text-slate-600">{label}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ok ? 'bg-green-100' : 'bg-slate-100'}`}>
                      {ok
                        ? <CheckCircle size={12} className="text-green-600" />
                        : <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="card p-6">
              <h3 className="font-body font-semibold text-navy-900 text-sm mb-4">Accesos rápidos</h3>
              <div className="space-y-2">
                {[
                  { href: '/abogado/perfil',      label: 'Editar perfil',       icono: '✏️' },
                  { href: '/abogado/campus',       label: 'Campus multimedia',   icono: '📚' },
                  { href: '/abogado/beneficios',   label: 'Mis beneficios',      icono: '🎁' },
                  { href: '/abogado/credencial',   label: 'Mi credencial',       icono: '🪪' },
                ].map(({ href, label, icono }) => (
                  <Link
                    key={href}
                    to={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <span className="text-base">{icono}</span>
                    <span className="font-body text-sm text-slate-700 group-hover:text-navy-900">{label}</span>
                    <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-navy-900 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Stat de perfil */}
            {perfil && (
              <div className="card p-6 bg-navy-900 border-0">
                <TrendingUp size={20} className="text-gold-400 mb-3" />
                <p className="font-display font-bold text-white text-2xl">
                  {datos?.estadisticas?.completadas_este_mes ?? 0}
                </p>
                <p className="font-body text-white/60 text-sm mt-1">consultas completadas este mes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
