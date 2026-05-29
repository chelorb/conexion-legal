// ============================================================
// src/pages/cliente/Dashboard.jsx
// Panel principal del cliente autenticado
// Muestra resumen de consultas, próximas fechas y accesos rápidos
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle, Search,
  ArrowRight, Star, Video, Building2, AlertCircle
} from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Tarjeta de estadística ───────────────────────────────────
function StatCard({ icono: Icono, valor, label, colorFondo, colorIcono }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorFondo}`}>
        <Icono size={20} className={colorIcono} />
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-navy-900">{valor}</p>
        <p className="font-body text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
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

export default function DashboardCliente() {
  const { usuario }               = useAuth();
  const [consultas, setConsultas] = useState([]);
  const [cargando,  setCargando]  = useState(true);

  // Cargar consultas del cliente al montar el componente
  useEffect(() => {
    api.get('/consultas')
      .then(r => setConsultas(r.data.consultas))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  // Calcular estadísticas desde los datos ya cargados (sin llamadas extra)
  const pendientes  = consultas.filter(c => c.estado === 'pendiente').length;
  const confirmadas = consultas.filter(c => c.estado === 'confirmada').length;
  const completadas = consultas.filter(c => c.estado === 'completada').length;

  // Próximas: confirmadas con fecha futura, ordenadas por fecha
  const proximas = consultas
    .filter(c => c.estado === 'confirmada' && !isPast(new Date(c.fecha_hora)))
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
    .slice(0, 3);

  // Consultas completadas sin calificación aún
  const sinCalificar = consultas.filter(
    c => c.estado === 'completada' && !c.tiene_calificacion
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* ── Encabezado ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-900">
              ¡Hola, {usuario?.nombre}!
            </h1>
            <p className="font-body text-slate-500 mt-1">
              Gestioná tus consultas legales desde acá.
            </p>
          </div>
          <Link to="/abogados" className="btn-primary shrink-0">
            <Search size={16} /> Buscar abogado
          </Link>
        </div>

        {/* ── Estadísticas ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icono={Clock}         valor={pendientes}  label="Esperando confirmación" colorFondo="bg-amber-50"  colorIcono="text-amber-600" />
          <StatCard icono={Calendar}      valor={confirmadas} label="Consultas confirmadas"  colorFondo="bg-blue-50"   colorIcono="text-blue-600" />
          <StatCard icono={CheckCircle}   valor={completadas} label="Consultas completadas"  colorFondo="bg-green-50"  colorIcono="text-green-600" />
        </div>

        {/* ── Alerta: calificaciones pendientes ─────────────── */}
        {sinCalificar.length > 0 && (
          <div className="bg-gold-300/20 border border-gold-300/50 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <Star size={20} className="text-gold-500 shrink-0" />
            <div className="flex-1">
              <p className="font-body font-medium text-navy-900 text-sm">
                Tenés {sinCalificar.length} consulta{sinCalificar.length > 1 ? 's' : ''} sin calificar
              </p>
              <p className="font-body text-xs text-slate-500 mt-0.5">
                Tu opinión ayuda a otros usuarios a encontrar al mejor abogado.
              </p>
            </div>
            <Link to="/mis-consultas" className="btn-gold text-sm shrink-0">
              Calificar ahora
            </Link>
          </div>
        )}

        {/* ── Contenido en dos columnas ─────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Próximas consultas (2/3) */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-display font-semibold text-navy-900 text-lg">Próximas consultas</h2>
              <Link to="/mis-consultas" className="font-body text-sm text-navy-700 hover:text-navy-900 flex items-center gap-1">
                Ver todas <ArrowRight size={14} />
              </Link>
            </div>

            {/* Skeleton de carga */}
            {cargando && (
              <div className="p-6 space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-14 h-14 bg-slate-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Estado vacío */}
            {!cargando && proximas.length === 0 && (
              <div className="p-12 text-center">
                <Calendar size={36} className="text-slate-300 mx-auto mb-3" />
                <p className="font-body text-slate-500 text-sm mb-5">
                  No tenés consultas próximas confirmadas.
                </p>
                <Link to="/abogados" className="btn-primary text-sm">
                  Agendar una consulta
                </Link>
              </div>
            )}

            {/* Lista */}
            {!cargando && proximas.length > 0 && (
              <div className="divide-y divide-slate-50">
                {proximas.map(c => {
                  const fecha = new Date(c.fecha_hora);
                  const esHoy = isToday(fecha);
                  return (
                    <div key={c.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors">
                      {/* Bloque fecha */}
                      <div className={`shrink-0 text-center rounded-xl px-3 py-2 min-w-[56px] ${esHoy ? 'bg-navy-900' : 'bg-navy-50'}`}>
                        <p className={`font-body text-xs uppercase tracking-wider ${esHoy ? 'text-white/70' : 'text-slate-500'}`}>
                          {esHoy ? 'HOY' : format(fecha, 'MMM', { locale: es })}
                        </p>
                        <p className={`font-display font-bold text-xl leading-none ${esHoy ? 'text-white' : 'text-navy-900'}`}>
                          {format(fecha, 'd')}
                        </p>
                      </div>
                      {/* Datos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-body font-medium text-navy-900 text-sm">
                              Dr./Dra. {c.abogado_nombre} {c.abogado_apellido}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 font-body text-xs text-slate-500">
                                {c.tipo === 'online'
                                  ? <><Video size={11} className="text-navy-700" /> Online</>
                                  : <><Building2 size={11} className="text-navy-700" /> Presencial</>
                                }
                              </span>
                              <span className="font-body text-xs text-slate-500">
                                {format(fecha, "HH:mm 'hs'")}
                              </span>
                            </div>
                          </div>
                          <BadgeEstado estado={c.estado} />
                        </div>
                        {/* Link videollamada */}
                        {c.tipo === 'online' && c.link_reunion && (
                          <a href={c.link_reunion} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-xs font-body text-navy-700 hover:text-navy-900 underline">
                            <Video size={11} /> Unirse a la videollamada
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel lateral (1/3) */}
          <div className="space-y-4">
            {/* Accesos rápidos */}
            <div className="card p-6">
              <h3 className="font-body font-semibold text-navy-900 text-sm mb-4">Accesos rápidos</h3>
              <div className="space-y-1">
                {[
                  { href: '/abogados',              label: 'Buscar abogados',     icono: '🔍' },
                  { href: '/mis-consultas',          label: 'Mis consultas',       icono: '📋' },
                  { href: '/abogados?online=true',   label: 'Solo consultas online', icono: '💻' },
                ].map(({ href, label, icono }) => (
                  <Link key={href} to={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                    <span className="text-base">{icono}</span>
                    <span className="font-body text-sm text-slate-700 group-hover:text-navy-900">{label}</span>
                    <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-navy-700 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="card p-6 bg-navy-900 border-0">
              <AlertCircle size={18} className="text-gold-400 mb-3" />
              <p className="font-body font-semibold text-white text-sm mb-1">Tip legal</p>
              <p className="font-body text-white/60 text-xs leading-relaxed">
                Siempre pedí un recibo o comprobante de honorarios antes de comenzar cualquier gestión legal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
