// ============================================================
// src/pages/abogado/Dashboard.jsx
// Panel principal del abogado con sidebar de navegación
// Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Star, CheckCircle, Clock,
  AlertCircle, ArrowRight, Video, Building2, X,
  TrendingUp, Award, ExternalLink, ChevronRight,
  User, BookOpen, Gift, CreditCard, MessageSquare,
  FileText, LayoutDashboard
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import BotonWhatsAppComunidad from '../../components/BotonWhatsAppComunidad';

// ─────────────────────────────────────────────────────────────
// Sidebar: navegación con submenú desplegable para links
// ─────────────────────────────────────────────────────────────
function Sidebar({ links }) {
  const [linksAbierto, setLinksAbierto] = useState(false);

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
      <div className="sticky top-24">
        <nav className="card p-3">

          {/* ── Sección: Navegación ──────────────────────── */}
          <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navegación
          </p>
          <div className="space-y-0.5">

            {/* Links normales del menú */}
            {MENU.map(({ href, label, icono: Icono }) => {
              const activo = actual === href ||
                (href !== '/abogado/dashboard' && actual.startsWith(href));
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${
                    activo ? 'text-white' : 'text-slate-600'
                  }`}
                  style={activo ? { background: '#2C2B27' } : undefined}
                  onMouseEnter={e => { if (!activo) e.currentTarget.style.background = '#F7F6F4'; }}
                  onMouseLeave={e => { if (!activo) e.currentTarget.style.background = ''; }}
                >
                  <Icono size={16} className={activo ? 'text-white' : 'text-slate-400'} />
                  {label}
                </Link>
              );
            })}

            {/* ── Links de interés con submenú ─────────── */}
            {links.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => setLinksAbierto(true)}
                onMouseLeave={() => setLinksAbierto(false)}
              >
                {/* Ítem del menú — mismo estilo que los demás */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium cursor-default transition-all"
                  style={{ color: '#56534A' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#F7F6F4';
                    e.currentTarget.style.color = '#1C1B18';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.color = '#56534A';
                  }}
                >
                  <ExternalLink size={16} className="text-slate-400 shrink-0" />
                  <span className="flex-1">Links de interés</span>
                  {/* Indicador de submenú */}
                  <ChevronRight
                    size={14}
                    className="text-slate-300 shrink-0 transition-transform"
                    style={{ transform: linksAbierto ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />
                </div>

                {/* Submenú flotante — aparece a la derecha en desktop,
                    o debajo en pantallas chicas */}
                {linksAbierto && (
                  <div
                    className="absolute left-full top-0 ml-2 w-64 rounded-2xl py-2 z-50 animate-fade-in"
                    style={{
                      background: '#fff',
                      border: '1px solid #E8E6E3',
                      boxShadow: '0 8px 32px rgba(28,27,24,0.14)',
                    }}
                  >
                    {/* Triángulo decorativo */}
                    <div
                      className="absolute -left-2 top-4 w-0 h-0"
                      style={{
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent',
                        borderRight: '8px solid #E8E6E3',
                      }}
                    />
                    <div
                      className="absolute left-0 top-4 w-0 h-0"
                      style={{
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent',
                        borderRight: '8px solid #fff',
                      }}
                    />

                    {/* Título del submenú */}
                    <p
                      className="font-body text-xs font-semibold uppercase tracking-wider px-4 pb-2 pt-1"
                      style={{ color: '#8A8780', borderBottom: '1px solid #F0EFED' }}
                    >
                      Links de interés
                    </p>

                    {/* Lista de links */}
                    <div className="pt-1">
                      {links.map(link => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 px-4 py-3 transition-colors group"
                          onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                        >
                          <ExternalLink
                            size={13}
                            className="shrink-0 mt-0.5 transition-colors"
                            style={{ color: '#B86030' }}
                          />
                          <div className="min-w-0">
                            <p
                              className="font-body text-sm font-medium leading-snug truncate"
                              style={{ color: '#1C1B18' }}
                            >
                              {link.titulo}
                            </p>
                            {link.descripcion && (
                              <p
                                className="font-body text-xs mt-0.5 leading-snug line-clamp-2"
                                style={{ color: '#8A8780' }}
                              >
                                {link.descripcion}
                              </p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Botón para unirse al grupo de WhatsApp de la comunidad */}
        <div className="mt-3">
          <BotonWhatsAppComunidad tamano="normal" />
        </div>
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
// Componente: Fila de consulta en el dashboard
// Clickeable → va al detalle. Muestra link de zoom si es online.
// ─────────────────────────────────────────────────────────────
function ConsultaItem({ consulta: c }) {
  const [guardandoLink, setGuardandoLink] = useState(false);
  const [link, setLink]                   = useState(c.link_reunion || '');
  const [editando, setEditando]           = useState(false);

  const guardarLink = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGuardandoLink(true);
    try {
      await api.patch(`/consultas/${c.id}/link`, { link_videollamada: link });
      toast.success('Link guardado. El cliente lo verá en su panel.');
      setEditando(false);
    } catch {
      toast.error('Error al guardar el link.');
    } finally {
      setGuardandoLink(false);
    }
  };

  return (
    <div className="transition-colors" style={{ borderBottom: '1px solid #F7F6F4' }}>
      {/* Fila principal — clickeable */}
      <Link
        to={`/abogado/consultas/${c.id}`}
        className="flex items-start gap-4 p-5 group transition-colors block"
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
          <p className="font-display font-bold text-xl leading-none" style={{ color: '#1C1B18' }}>
            {format(new Date(c.fecha_hora), 'd')}
          </p>
        </div>

        {/* Datos */}
        <div className="flex-1 min-w-0">
          <p className="font-body font-medium text-sm" style={{ color: '#1C1B18' }}>
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

        {/* Estado + flecha */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={c.estado === 'pendiente' ? 'badge-pendiente' : 'badge-confirmada'}>
            {c.estado === 'pendiente' ? 'Pendiente' : 'Confirmada'}
          </span>
          <ChevronRight size={14} className="transition-colors shrink-0"
            style={{ color: '#D4D2CC' }} />
        </div>
      </Link>

      {/* Campo de link de videollamada — solo si es online y está confirmada */}
      {c.tipo === 'online' && c.estado === 'confirmada' && (
        <div className="px-5 pb-4">
          {!editando ? (
            <div className="flex items-center gap-3">
              {link ? (
                <>
                  <a href={link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-body text-xs font-medium transition-colors"
                    style={{ color: '#B86030' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#8B4A1E'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#B86030'; }}
                  >
                    <Video size={12} /> Abrir videollamada
                  </a>
                  <span style={{ color: '#D4D2CC' }}>·</span>
                </>
              ) : (
                <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                  Sin link de videollamada
                </p>
              )}
              <button
                onClick={() => setEditando(true)}
                className="font-body text-xs transition-colors"
                style={{ color: '#8A8780' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
              >
                {link ? 'Cambiar link' : '+ Agregar link'}
              </button>
            </div>
          ) : (
            <form onSubmit={guardarLink} className="flex gap-2" onClick={e => e.stopPropagation()}>
              <input
                type="url"
                autoFocus
                placeholder="https://meet.google.com/... o https://zoom.us/j/..."
                value={link}
                onChange={e => setLink(e.target.value)}
                className="input-field flex-1 text-xs py-2"
              />
              <button type="submit" disabled={guardandoLink}
                className="px-3 py-2 rounded-xl font-body text-xs font-medium text-white transition-colors shrink-0"
                style={{ background: '#2C2B27' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
              >
                {guardandoLink ? '...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setEditando(false)}
                className="px-3 py-2 rounded-xl font-body text-xs border transition-colors"
                style={{ borderColor: '#E8E6E3', color: '#56534A' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                Cancelar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
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
  const [notifPlan,     setNotifPlan]     = useState([]);
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

        // Notificaciones de cambios de plan (no leídas)
        try {
          const notifRes = await api.get('/abogados/me/notificaciones-plan');
          setNotifPlan((notifRes.data.notificaciones || []).filter(n => !n.leida));
        } catch { /* silencioso */ }
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

        {/* ── Banners de notificaciones de plan ─────── */}
        {notifPlan.length > 0 && (
          <div className="space-y-3 mb-2">
            {notifPlan.map(n => (
              <div
                key={n.id}
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: 'rgba(184,96,48,0.08)', border: '1px solid rgba(184,96,48,0.25)' }}
              >
                <AlertCircle size={18} style={{ color: '#B86030' }} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
                    {n.titulo}
                  </p>
                  <p className="font-body text-xs mt-0.5 leading-relaxed" style={{ color: '#56534A' }}>
                    {n.mensaje}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await api.patch(`/abogados/me/notificaciones-plan/${n.id}/leida`);
                      setNotifPlan(prev => prev.filter(x => x.id !== n.id));
                    } catch {}
                  }}
                  className="p-1.5 rounded-lg transition-colors shrink-0"
                  style={{ color: '#B0AEA8' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#56534A'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#B0AEA8'; }}
                  title="Marcar como leída"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {notifPlan.length > 1 && (
              <button
                onClick={async () => {
                  try {
                    await api.patch('/abogados/me/notificaciones-plan/marcar-todas');
                    setNotifPlan([]);
                  } catch {}
                }}
                className="font-body text-xs w-full text-center transition-colors"
                style={{ color: '#8A8780' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        )}

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
                    <ConsultaItem key={c.id} consulta={c} />
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
