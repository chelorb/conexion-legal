// ============================================================
// src/pages/abogado/Dashboard.jsx
// Panel principal del abogado con sidebar de navegación
// Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Star, CheckCircle, Clock,
  AlertCircle, ArrowRight, Video, Building2,
  TrendingUp, Award, ExternalLink, ChevronRight,
  User, BookOpen, Gift, CreditCard, MessageSquare,
  FileText, LayoutDashboard
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Sidebar: navegación + links de interés en un solo card
// ─────────────────────────────────────────────────────────────
function Sidebar({ links }) {
  const MENU = [
    { href: '/abogado/dashboard',   label: 'Panel',       icono: LayoutDashboard },
    { href: '/abogado/perfil',      label: 'Mi perfil',   icono: User },
    { href: '/abogado/consultas',   label: 'Consultas',   icono: Calendar },
    { href: '/abogado/campus',      label: 'Campus',      icono: BookOpen },
    { href: '/abogado/agenda',      label: 'Agenda',      icono: Calendar },
    { href: '/abogado/foro',        label: 'Foro',        icono: MessageSquare },
    { href: '/abogado/beneficios',  label: 'Beneficios',  icono: Gift },
    { href: '/abogado/credencial',  label: 'Credencial',  icono: FileText },
    { href: '/abogado/suscripcion', label: 'Suscripción', icono: CreditCard },
  ];

  const actual = window.location.pathname;

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Un solo card sticky que contiene navegación + links */}
      <div className="sticky top-24">
        <nav className="card p-3">

          {/* ── Sección: Navegación ──────────────────────── */}
          <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navegación
          </p>
          <div className="space-y-0.5">
            {MENU.map(({ href, label, icono: Icono }) => {
              const activo = actual === href ||
                (href !== '/abogado/dashboard' && actual.startsWith(href));
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${
                    activo
                      ? 'text-white'
                      : 'text-slate-600 hover:text-stone-900'
                  }`}
                  // Color activo de la paleta C (carbón 800)
                  style={activo
                    ? { background: '#2C2B27' }
                    : undefined
                  }
                  onMouseEnter={e => { if (!activo) e.currentTarget.style.background = '#F7F6F4'; }}
                  onMouseLeave={e => { if (!activo) e.currentTarget.style.background = ''; }}
                >
                  <Icono size={16} className={activo ? 'text-white' : 'text-slate-400'} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ── Separador + Links de interés ─────────────── */}
          {links.length > 0 && (
            <div className="border-t border-slate-100 pt-3 mt-3">
              <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Links de interés
              </p>
              <div className="space-y-0.5">
                {links.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group"
                    onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    <ExternalLink
                      size={14}
                      className="text-slate-400 shrink-0 group-hover:text-stone-600 transition-colors"
                    />
                    <span className="font-body text-sm text-slate-600 group-hover:text-stone-900 leading-snug truncate transition-colors">
                      {link.titulo}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de estadística
// ─────────────────────────────────────────────────────────────
function StatCard({ icono: Icono, valor, label, colorFondo, colorIcono }) {
  return (
    <div className="card p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${colorFondo} mb-3`}>
        <Icono size={18} className={colorIcono} />
      </div>
      {/* Texto con color carbón */}
      <p className="font-display text-2xl font-bold" style={{ color: '#1C1B18' }}>
        {valor ?? '—'}
      </p>
      <p className="font-body text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Preview del próximo evento — con paleta C
// ─────────────────────────────────────────────────────────────
function ProximoEvento({ evento }) {
  if (!evento) return null;
  const fecha = new Date(evento.fecha_evento);

  return (
    <Link
      to="/abogado/agenda"
      className="block rounded-2xl p-5 hover:opacity-95 transition-opacity"
      // Fondo carbón degradado
      style={{ background: 'linear-gradient(135deg, #1C1B18 0%, #3A3832 100%)' }}
    >
      <div className="flex items-start gap-4">

        {/* Bloque de fecha */}
        <div
          className="shrink-0 text-center rounded-xl px-3 py-2 min-w-[52px]"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <p
            className="font-body text-xs uppercase tracking-wider"
            style={{ color: '#C4522E' }} // cobre
          >
            {format(fecha, 'MMM', { locale: es })}
          </p>
          <p className="font-display font-bold text-white text-xl leading-none">
            {format(fecha, 'd')}
          </p>
        </div>

        {/* Info del evento */}
        <div className="flex-1 min-w-0">
          <p
            className="font-body text-xs font-medium mb-1"
            style={{ color: '#B86030' }} // cobre principal
          >
            Próximo evento
          </p>
          <p className="font-body font-semibold text-white text-sm leading-snug line-clamp-2">
            {evento.titulo}
          </p>
          <p
            className="font-body text-xs mt-1"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            {format(fecha, "HH:mm 'hs'")}
            {evento.autor ? ` · ${evento.autor}` : ''}
          </p>
        </div>

        <ArrowRight
          size={14}
          className="shrink-0 mt-1"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function DashboardAbogado() {
  const { usuario }                       = useAuth();
  const [datos,         setDatos]         = useState(null);
  const [links,         setLinks]         = useState([]);
  const [proximoEvento, setProximoEvento] = useState(null);
  const [cargando,      setCargando]      = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        // Cargar dashboard, links y próximo evento en paralelo
        const [dashRes, linksRes, agendaRes] = await Promise.allSettled([
          api.get('/abogados/me/dashboard'),
          api.get('/links'),
          api.get('/agenda'),
        ]);

        if (dashRes.status   === 'fulfilled') setDatos(dashRes.value.data);
        if (linksRes.status  === 'fulfilled') setLinks(linksRes.value.data.links || []);
        if (agendaRes.status === 'fulfilled') {
          const eventos = agendaRes.value.data.eventos || [];
          const futuro  = eventos.find(e => !isPast(new Date(e.fecha_evento)));
          setProximoEvento(futuro || null);
        }
      } catch {
        // Silencioso — cada sección muestra su estado vacío
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // ── Estado de carga ─────────────────────────────────────────
  if (cargando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#F0EFED' }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#2C2B27', borderTopColor: 'transparent' }}
          />
          <p className="text-slate-500 text-sm font-body">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  const perfil   = datos?.perfil;
  const stats    = datos?.estadisticas;
  const proximas = datos?.proximas_consultas || [];

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1
              className="font-display text-3xl font-bold"
              style={{ color: '#1C1B18' }}
            >
              Bienvenido/a, Dr./Dra. {usuario?.nombre}
            </h1>
            <p className="font-body text-slate-500 mt-1">
              Plan:{' '}
              <span className="font-medium" style={{ color: '#B86030' }}>
                {perfil?.plan_nombre || 'Básico'}
              </span>
            </p>
          </div>
          {/* Botón con cobre */}
          <Link
            to="/abogado/suscripcion"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-body font-medium text-sm text-white shrink-0 transition-colors"
            style={{ background: '#B86030' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#8B4A1E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}
          >
            <Award size={16} /> Mejorar plan
          </Link>
        </div>

        {/* Alerta perfil incompleto */}
        {!perfil?.perfil_completo && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-body font-medium text-amber-800">Tu perfil está incompleto</p>
              <p className="font-body text-sm text-amber-600 mt-0.5">
                Completá tu perfil para aparecer en la búsqueda de clientes.
              </p>
            </div>
            <Link
              to="/abogado/perfil"
              className="text-sm shrink-0 px-4 py-2 rounded-xl border font-body font-medium transition-colors"
              style={{ borderColor: '#B86030', color: '#8B4A1E' }}
            >
              Completar
            </Link>
          </div>
        )}

        {/* ── Layout: Sidebar + Contenido ───────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <Sidebar links={links} />

          {/* Contenido principal */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Estadísticas */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icono={Clock}
                valor={stats?.consultas_pendientes}
                label="Pendientes"
                colorFondo="bg-amber-50"
                colorIcono="text-amber-600"
              />
              <StatCard
                icono={Calendar}
                valor={stats?.consultas_confirmadas}
                label="Confirmadas"
                colorFondo="bg-blue-50"
                colorIcono="text-blue-600"
              />
              <StatCard
                icono={CheckCircle}
                valor={stats?.completadas_este_mes}
                label="Completadas (mes)"
                colorFondo="bg-green-50"
                colorIcono="text-green-600"
              />
              <StatCard
                icono={Star}
                valor={perfil?.calificacion_promedio > 0
                  ? `${parseFloat(perfil.calificacion_promedio).toFixed(1)} ★`
                  : '—'
                }
                label={`${perfil?.total_calificaciones || 0} reseñas`}
                colorFondo="bg-stone-100"
                colorIcono="text-stone-600"
              />
            </div>

            {/* Preview del próximo evento */}
            {proximoEvento && <ProximoEvento evento={proximoEvento} />}

            {/* Próximas consultas */}
            <div className="card">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2
                  className="font-display font-semibold text-lg"
                  style={{ color: '#1C1B18' }}
                >
                  Próximas consultas
                </h2>
                <Link
                  to="/abogado/consultas"
                  className="font-body text-sm flex items-center gap-1 hover:underline"
                  style={{ color: '#B86030' }}
                >
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
                    <div
                      key={c.id}
                      className="flex items-start gap-4 p-5 transition-colors"
                      onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                    >
                      {/* Bloque fecha */}
                      <div
                        className="shrink-0 text-center rounded-xl px-3 py-2 min-w-[52px]"
                        style={{ background: '#F0EFED' }}
                      >
                        <p className="font-body text-xs text-slate-500 uppercase tracking-wider">
                          {format(new Date(c.fecha_hora), 'MMM', { locale: es })}
                        </p>
                        <p
                          className="font-display font-bold text-xl leading-none"
                          style={{ color: '#1C1B18' }}
                        >
                          {format(new Date(c.fecha_hora), 'd')}
                        </p>
                      </div>

                      {/* Datos */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-body font-medium text-sm"
                          style={{ color: '#1C1B18' }}
                        >
                          {c.cliente_nombre} {c.cliente_apellido}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 font-body text-xs text-slate-500">
                            {c.tipo === 'online'
                              ? <><Video size={11} style={{ color: '#B86030' }} /> Online</>
                              : <><Building2 size={11} style={{ color: '#B86030' }} /> Presencial</>
                            }
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-body text-xs text-slate-500">
                            {format(new Date(c.fecha_hora), "HH:mm 'hs'")}
                          </span>
                        </div>
                      </div>

                      {/* Estado */}
                      <span className={
                        c.estado === 'pendiente' ? 'badge-pendiente' : 'badge-confirmada'
                      }>
                        {c.estado === 'pendiente' ? 'Pendiente' : 'Confirmada'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stat destacada — fondo carbón oscuro */}
            {perfil && (
              <div
                className="rounded-2xl p-6 flex items-center justify-between"
                style={{ background: '#1C1B18' }}
              >
                <div>
                  <TrendingUp size={20} className="mb-2" style={{ color: '#C4522E' }} />
                  <p className="font-display font-bold text-white text-3xl">
                    {stats?.completadas_este_mes ?? 0}
                  </p>
                  <p
                    className="font-body text-sm mt-1"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    consultas completadas este mes
                  </p>
                </div>
                <Link
                  to="/abogado/consultas"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl font-body font-medium text-sm text-white transition-colors"
                  style={{ background: '#B86030' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#8B4A1E'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}
                >
                  Ver consultas <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
