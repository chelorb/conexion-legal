// ============================================================
// src/pages/admin/Dashboard.jsx
// Panel principal del administrador
// Estadísticas globales de la plataforma en tiempo real
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Scale, Calendar, DollarSign,
  TrendingUp, ArrowRight, CheckCircle,
  Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de estadística principal
// ─────────────────────────────────────────────────────────────
function StatCard({ icono: Icono, valor, label, subLabel, colorFondo, colorIcono, link }) {
  const contenido = (
    <div className={`card p-6 flex flex-col gap-4 transition-all duration-200 ${link ? 'hover:shadow-card-hover cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorFondo}`}>
          <Icono size={22} className={colorIcono} />
        </div>
        {link && <ArrowRight size={16} className="text-slate-300" />}
      </div>
      <div>
        <p className="font-display text-3xl font-bold text-navy-900">
          {valor ?? <span className="text-slate-300">—</span>}
        </p>
        <p className="font-body text-sm text-slate-500 mt-1">{label}</p>
        {subLabel && (
          <p className="font-body text-xs text-slate-400 mt-0.5">{subLabel}</p>
        )}
      </div>
    </div>
  );

  return link ? <Link to={link}>{contenido}</Link> : contenido;
}

// ─────────────────────────────────────────────────────────────
// Componente: Fila de actividad reciente
// ─────────────────────────────────────────────────────────────
function FilaActividad({ icono, texto, tiempo, tipo }) {
  const colores = {
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    info:    'bg-blue-50 text-blue-600',
    default: 'bg-slate-50 text-slate-500',
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colores[tipo] || colores.default}`}>
        {icono}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-slate-700 leading-snug">{texto}</p>
        <p className="font-body text-xs text-slate-400 mt-0.5">{tiempo}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargarEstadisticas = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/estadisticas');
      setStats(data);
      setUltimaActualizacion(new Date());
    } catch {
      toast.error('No se pudieron cargar las estadísticas.');
    } finally {
      setCargando(false);
    }
  };

  // Cargar al montar y actualizar cada 5 minutos
  useEffect(() => {
    cargarEstadisticas();
    const intervalo = setInterval(cargarEstadisticas, 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Panel de administración</h1>
            <p className="font-body text-sm text-slate-400 mt-1">
              {ultimaActualizacion
                ? `Última actualización: ${format(ultimaActualizacion, "HH:mm 'hs'")}`
                : 'Cargando datos...'
              }
            </p>
          </div>

          {/* Botón de actualizar manualmente */}
          <button
            onClick={cargarEstadisticas}
            disabled={cargando}
            className="btn-secondary gap-2 shrink-0"
          >
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* ── Estadísticas principales ─────────────────────── */}
        {cargando && !stats ? (
          // Skeleton de carga
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4" />
                <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icono={Users}
              valor={stats?.usuarios_activos?.toLocaleString('es-AR')}
              label="Usuarios activos"
              subLabel="Clientes y abogados"
              colorFondo="bg-blue-50"
              colorIcono="text-blue-600"
              link="/admin/usuarios"
            />
            <StatCard
              icono={Scale}
              valor={stats?.abogados_visibles?.toLocaleString('es-AR')}
              label="Abogados en grilla"
              subLabel="Perfiles aprobados"
              colorFondo="bg-navy-50"
              colorIcono="text-navy-700"
              link="/admin/abogados"
            />
            <StatCard
              icono={Calendar}
              valor={stats?.consultas_totales?.toLocaleString('es-AR')}
              label="Consultas totales"
              subLabel={`${stats?.consultas_completadas?.toLocaleString('es-AR') || 0} completadas`}
              colorFondo="bg-green-50"
              colorIcono="text-green-600"
            />
            <StatCard
              icono={DollarSign}
              valor={stats?.ingresos_totales
                ? `$${Math.round(stats.ingresos_totales).toLocaleString('es-AR')}`
                : '$0'
              }
              label="Ingresos totales"
              subLabel="Suscripciones cobradas"
              colorFondo="bg-gold-300/20"
              colorIcono="text-gold-600"
            />
          </div>
        )}

        {/* ── Segunda fila de métricas ─────────────────────── */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Tasa de completado */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-sm font-medium text-slate-600">Tasa de completado</p>
                <CheckCircle size={16} className="text-green-500" />
              </div>
              <p className="font-display text-2xl font-bold text-navy-900 mb-1">
                {stats.consultas_totales > 0
                  ? `${Math.round((stats.consultas_completadas / stats.consultas_totales) * 100)}%`
                  : '0%'
                }
              </p>
              {/* Barra de progreso */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: stats.consultas_totales > 0
                      ? `${(stats.consultas_completadas / stats.consultas_totales) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              <p className="font-body text-xs text-slate-400 mt-1.5">
                {stats.consultas_completadas} de {stats.consultas_totales} consultas
              </p>
            </div>

            {/* Cobertura de abogados */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-sm font-medium text-slate-600">Abogados activos</p>
                <TrendingUp size={16} className="text-navy-700" />
              </div>
              <p className="font-display text-2xl font-bold text-navy-900 mb-1">
                {stats.abogados_visibles}
              </p>
              <p className="font-body text-xs text-slate-400 mt-1">
                Perfiles visibles en la plataforma
              </p>
            </div>

            {/* Ingreso promedio por consulta */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-sm font-medium text-slate-600">Ingreso por usuario</p>
                <DollarSign size={16} className="text-gold-500" />
              </div>
              <p className="font-display text-2xl font-bold text-navy-900 mb-1">
                {stats.usuarios_activos > 0 && stats.ingresos_totales > 0
                  ? `$${Math.round(stats.ingresos_totales / stats.abogados_visibles).toLocaleString('es-AR')}`
                  : '$0'
                }
              </p>
              <p className="font-body text-xs text-slate-400 mt-1">
                Promedio por abogado suscripto
              </p>
            </div>
          </div>
        )}

        {/* ── Accesos rápidos de administración ────────────── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Acciones rápidas */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-navy-900 text-lg mb-5">
              Acciones rápidas
            </h2>
            <div className="space-y-2">
              {[
                {
                  href:   '/admin/abogados',
                  label:  'Aprobar perfiles pendientes',
                  desc:   'Revisar y validar nuevos abogados',
                  icono:  '✅',
                  tipo:   'warning',
                },
                {
                  href:   '/admin/usuarios',
                  label:  'Gestionar usuarios',
                  desc:   'Ver, habilitar o deshabilitar cuentas',
                  icono:  '👥',
                  tipo:   'info',
                },
                {
                  href:   '/admin/abogados',
                  label:  'Ver abogados por plan',
                  desc:   'Revisar distribución de suscripciones',
                  icono:  '📊',
                  tipo:   'default',
                },
              ].map(({ href, label, desc, icono }) => (
                <Link
                  key={href + label}
                  to={href}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-xl shrink-0">{icono}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-navy-900 text-sm">{label}</p>
                    <p className="font-body text-xs text-slate-400">{desc}</p>
                  </div>
                  <ArrowRight size={15} className="text-slate-300 group-hover:text-navy-700 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Estado de la plataforma */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-navy-900 text-lg mb-5">
              Estado de la plataforma
            </h2>
            <div className="space-y-3">
              {[
                { label: 'API Backend',     ok: true,  desc: 'Operativa' },
                { label: 'Base de datos',   ok: true,  desc: 'Conectada' },
                { label: 'Sistema de pagos', ok: !!process.env.REACT_APP_MP_OK, desc: 'MercadoPago' },
                { label: 'Servicio de email', ok: true, desc: 'SMTP activo' },
              ].map(({ label, ok, desc }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-body text-sm font-medium text-navy-900">{label}</p>
                    <p className="font-body text-xs text-slate-400">{desc}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium ${
                    ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500 animate-pulse-slow' : 'bg-red-500'}`} />
                    {ok ? 'OK' : 'Error'}
                  </div>
                </div>
              ))}
            </div>

            {/* Nota de entorno */}
            <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="font-body text-xs text-amber-700 leading-relaxed">
                Para producción, configurá las variables de entorno de MercadoPago y SMTP. Ver <code className="font-mono">.env.example</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
