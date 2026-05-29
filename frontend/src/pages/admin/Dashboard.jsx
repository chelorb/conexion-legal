// ============================================================
// src/pages/admin/Dashboard.jsx — Paleta C: Gris carbón + Cobre
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

function StatCard({ icono: Icono, valor, label, subLabel, colorFondo, colorIcono, link }) {
  const contenido = (
    <div
      className="card p-6 flex flex-col gap-4 transition-all duration-200"
      style={link ? { cursor: 'pointer' } : {}}
      onMouseEnter={e => { if (link) e.currentTarget.style.boxShadow = '0 6px 24px rgba(28,27,24,0.12)'; }}
      onMouseLeave={e => { if (link) e.currentTarget.style.boxShadow = ''; }}
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorFondo}`}>
          <Icono size={22} className={colorIcono} />
        </div>
        {link && <ArrowRight size={16} style={{ color: '#D4D2CC' }} />}
      </div>
      <div>
        <p className="font-display text-3xl font-bold" style={{ color: '#1C1B18' }}>
          {valor ?? <span style={{ color: '#D4D2CC' }}>—</span>}
        </p>
        <p className="font-body text-sm mt-1" style={{ color: '#8A8780' }}>{label}</p>
        {subLabel && <p className="font-body text-xs mt-0.5" style={{ color: '#B0AEA8' }}>{subLabel}</p>}
      </div>
    </div>
  );
  return link ? <Link to={link}>{contenido}</Link> : contenido;
}

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltima] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/estadisticas');
      setStats(data);
      setUltima(new Date());
    } catch {
      toast.error('No se pudieron cargar las estadísticas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Panel de administración</h1>
            <p className="font-body text-sm mt-1" style={{ color: '#8A8780' }}>
              {ultimaActualizacion
                ? `Actualizado: ${format(ultimaActualizacion, "HH:mm 'hs'")}`
                : 'Cargando...'
              }
            </p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Stats principales */}
        {cargando && !stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-12 h-12 rounded-xl mb-4" style={{ background: '#E8E6E3' }} />
                <div className="h-8 rounded w-1/2 mb-2" style={{ background: '#E8E6E3' }} />
                <div className="h-3 rounded w-3/4" style={{ background: '#E8E6E3' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icono={Users}       valor={stats?.usuarios_activos?.toLocaleString('es-AR')}   label="Usuarios activos"   subLabel="Clientes y abogados"    colorFondo="bg-blue-50"   colorIcono="text-blue-600"  link="/admin/usuarios" />
            <StatCard icono={Scale}       valor={stats?.abogados_visibles?.toLocaleString('es-AR')}  label="Abogados en grilla" subLabel="Perfiles aprobados"     colorFondo="bg-stone-100" colorIcono="text-stone-600" link="/admin/abogados" />
            <StatCard icono={Calendar}    valor={stats?.consultas_totales?.toLocaleString('es-AR')}  label="Consultas totales"  subLabel={`${stats?.consultas_completadas || 0} completadas`} colorFondo="bg-green-50"  colorIcono="text-green-600" />
            <StatCard icono={DollarSign}  valor={stats?.ingresos_totales ? `$${Math.round(stats.ingresos_totales).toLocaleString('es-AR')}` : '$0'} label="Ingresos totales" subLabel="Suscripciones" colorFondo="bg-amber-50" colorIcono="text-amber-600" />
          </div>
        )}

        {/* Alerta pendientes */}
        {stats?.abogados_pendientes > 0 && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(184,96,48,0.08)', border: '1px solid rgba(184,96,48,0.2)' }}
          >
            <AlertCircle size={18} style={{ color: '#B86030' }} className="shrink-0" />
            <p className="font-body text-sm" style={{ color: '#56534A' }}>
              Hay <strong>{stats.abogados_pendientes}</strong> abogado{stats.abogados_pendientes > 1 ? 's' : ''} esperando aprobación.
            </p>
            <Link to="/admin/abogados"
              className="ml-auto font-body text-sm font-medium shrink-0 hover:underline"
              style={{ color: '#B86030' }}>
              Revisar →
            </Link>
          </div>
        )}

        {/* Segunda fila */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Tasa de completado */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-sm font-medium" style={{ color: '#56534A' }}>Tasa de completado</p>
                <CheckCircle size={16} className="text-green-500" />
              </div>
              <p className="font-display text-2xl font-bold mb-1" style={{ color: '#1C1B18' }}>
                {stats.consultas_totales > 0
                  ? `${Math.round((stats.consultas_completadas / stats.consultas_totales) * 100)}%`
                  : '0%'
                }
              </p>
              <div className="w-full rounded-full h-1.5 mt-2" style={{ background: '#F0EFED' }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    background: '#B86030',
                    width: stats.consultas_totales > 0
                      ? `${(stats.consultas_completadas / stats.consultas_totales) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              <p className="font-body text-xs mt-1.5" style={{ color: '#8A8780' }}>
                {stats.consultas_completadas} de {stats.consultas_totales}
              </p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-sm font-medium" style={{ color: '#56534A' }}>Abogados activos</p>
                <TrendingUp size={16} style={{ color: '#B86030' }} />
              </div>
              <p className="font-display text-2xl font-bold" style={{ color: '#1C1B18' }}>
                {stats.abogados_visibles}
              </p>
              <p className="font-body text-xs mt-1" style={{ color: '#8A8780' }}>Perfiles visibles</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-sm font-medium" style={{ color: '#56534A' }}>Ingreso por abogado</p>
                <DollarSign size={16} style={{ color: '#B86030' }} />
              </div>
              <p className="font-display text-2xl font-bold" style={{ color: '#1C1B18' }}>
                {stats.abogados_visibles > 0 && stats.ingresos_totales > 0
                  ? `$${Math.round(stats.ingresos_totales / stats.abogados_visibles).toLocaleString('es-AR')}`
                  : '$0'
                }
              </p>
              <p className="font-body text-xs mt-1" style={{ color: '#8A8780' }}>Promedio mensual</p>
            </div>
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-display font-semibold text-lg mb-5" style={{ color: '#1C1B18' }}>
              Acciones rápidas
            </h2>
            <div className="space-y-1">
              {[
                { href: '/admin/abogados', label: 'Aprobar perfiles pendientes', desc: 'Revisar y validar nuevos abogados', icono: '✅' },
                { href: '/admin/campus',   label: 'Gestionar campus',            desc: 'Agregar cursos y contenido',        icono: '📚' },
                { href: '/admin/eventos',  label: 'Crear evento en la agenda',   desc: 'Seminarios y charlas',             icono: '📅' },
                { href: '/admin/links',    label: 'Gestionar links de interés',  desc: 'Links del sidebar del abogado',    icono: '🔗' },
              ].map(({ href, label, desc, icono }) => (
                <Link key={href + label} to={href}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors group"
                  onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <span className="text-xl shrink-0">{icono}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-sm" style={{ color: '#1C1B18' }}>{label}</p>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>{desc}</p>
                  </div>
                  <ArrowRight size={15} style={{ color: '#D4D2CC' }} className="shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display font-semibold text-lg mb-5" style={{ color: '#1C1B18' }}>
              Estado de la plataforma
            </h2>
            <div className="space-y-3">
              {[
                { label: 'API Backend',      ok: true,  desc: 'Operativa' },
                { label: 'Base de datos',    ok: true,  desc: 'Conectada' },
                { label: 'Sistema de pagos', ok: false, desc: 'MercadoPago' },
                { label: 'Servicio de email',ok: false, desc: 'SMTP' },
              ].map(({ label, ok, desc }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: '#F0EFED' }}>
                  <div>
                    <p className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>{label}</p>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>{desc}</p>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium"
                    style={ok
                      ? { background: 'rgba(22,163,74,0.08)', color: '#16a34a' }
                      : { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }
                    }
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'animate-pulse-slow' : ''}`}
                      style={{ background: ok ? '#16a34a' : '#dc2626' }} />
                    {ok ? 'OK' : 'Configurar'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
