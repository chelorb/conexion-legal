// ============================================================
// src/components/layout/Navbar.jsx
// Barra de navegación — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scale, Menu, X, Bell, ChevronDown, LogOut, User, Settings, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { usuario, estaAutenticado, esAbogado, esCliente, esAdmin, logout } = useAuth();
  const [menuAbierto,   setMenuAbierto]   = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [campanaAbierta, setCampana]      = useState(false);
  const campanaRef = useRef(null);

  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } =
    useNotificaciones(estaAutenticado ? usuario : null);
  const navigate  = useNavigate();
  const location  = useLocation();

  const linksAbogado = [
    { href: '/abogado/dashboard',   label: 'Panel' },
    { href: '/abogado/consultas',   label: 'Consultas' },
    { href: '/abogado/campus',      label: 'Campus' },
    { href: '/abogado/agenda',      label: 'Agenda' },
    { href: '/abogado/foro',        label: 'Foro' },
    { href: '/abogado/beneficios',  label: 'Beneficios' },
  ];

  const linksCliente = [
    { href: '/clientes',      label: 'Buscar Abogado' },
    { href: '/mis-consultas', label: 'Mis Consultas' },
  ];

  const linksAdmin = [
    { href: '/admin/dashboard',  label: 'Dashboard'  },
    { href: '/admin/abogados',   label: 'Abogados'   },
    { href: '/admin/usuarios',   label: 'Usuarios'   },
    { href: '/admin/planes',     label: 'Planes'     },
    { href: '/admin/campus',     label: 'Campus'     },
    { href: '/admin/eventos',    label: 'Eventos'    },
    { href: '/admin/links',      label: 'Links'      },
    { href: '/admin/comunicado', label: '📢 Comunicado' },
  ];

  const linksPublicos = [
    { href: '/clientes',      label: 'Buscar Abogado' },
    { href: '/para-abogados', label: 'Para Abogados' },
    { href: '/planes',        label: 'Planes' },
  ];

  const links = esAbogado ? linksAbogado
    : esCliente           ? linksCliente
    : esAdmin             ? linksAdmin
    : linksPublicos;

  const esLinkActivo = (href) =>
    location.pathname === href ||
    (href !== '/' && location.pathname.startsWith(href));

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/');
    setPerfilAbierto(false);
  };

  return (
    // Fondo carbón 50 con efecto glass
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(247,246,244,0.92)',
        backdropFilter: 'blur(12px)',
        borderColor: '#E8E6E3',
      }}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ──────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: '#2C2B27' }}
            >
              <Scale size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: '#1C1B18' }}>
              Conexión<span style={{ color: '#B86030' }}>Legal</span>
            </span>
          </Link>

          {/* ── Links desktop ──────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium font-body transition-all duration-150"
                style={esLinkActivo(link.href)
                  ? { background: 'rgba(44,43,39,0.08)', color: '#1C1B18' }
                  : { color: '#56534A' }
                }
                onMouseEnter={e => {
                  if (!esLinkActivo(link.href)) {
                    e.currentTarget.style.background = 'rgba(44,43,39,0.05)';
                    e.currentTarget.style.color = '#1C1B18';
                  }
                }}
                onMouseLeave={e => {
                  if (!esLinkActivo(link.href)) {
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.color = '#56534A';
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Acciones derecha ───────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {estaAutenticado ? (
              <>
                {/* Notificaciones */}
                {/* ── Campana de notificaciones ─────────── */}
                <div className="relative" ref={campanaRef}>
                  <button
                    onClick={() => setCampana(!campanaAbierta)}
                    className="relative p-2 rounded-lg transition-colors"
                    style={{ color: '#56534A' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(44,43,39,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    <Bell size={18} />
                    {noLeidas > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-body font-bold text-[10px] px-1"
                        style={{ background: '#C4522E' }}
                      >
                        {noLeidas > 9 ? '9+' : noLeidas}
                      </span>
                    )}
                  </button>

                  {/* Dropdown de notificaciones */}
                  {campanaAbierta && (
                    <div
                      className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden animate-slide-down"
                      style={{ background: '#fff', border: '1px solid #E8E6E3', boxShadow: '0 8px 32px rgba(28,27,24,0.14)', zIndex: 49 }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#F0EFED' }}>
                        <p className="font-display font-semibold text-sm" style={{ color: '#1C1B18' }}>
                          Notificaciones {noLeidas > 0 && <span className="text-xs font-body font-medium px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(196,82,46,0.1)', color: '#C4522E' }}>{noLeidas} nuevas</span>}
                        </p>
                        {noLeidas > 0 && (
                          <button
                            onClick={() => { marcarTodasLeidas(); }}
                            className="font-body text-xs transition-colors flex items-center gap-1"
                            style={{ color: '#8A8780' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
                          >
                            <Check size={11} /> Marcar todas
                          </button>
                        )}
                      </div>

                      {/* Lista */}
                      <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
                        {notificaciones.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell size={28} className="mx-auto mb-2" style={{ color: '#D4D2CC' }} />
                            <p className="font-body text-sm" style={{ color: '#8A8780' }}>Sin notificaciones</p>
                          </div>
                        ) : (
                          notificaciones.map(n => (
                            <div
                              key={n.id}
                              onClick={() => {
                                // Actualizar estado local ANTES del fetch y navegación
                                if (!n.leida) marcarLeida(n.id);
                                setCampana(false);
                                if (n.link) navigate(n.link);
                              }}
                              className="flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b last:border-0"
                              style={{
                                background: n.leida ? '#fff' : 'rgba(184,96,48,0.04)',
                                borderColor: '#F7F6F4',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = n.leida ? '#fff' : 'rgba(184,96,48,0.04)'; }}
                            >
                              {/* Ícono */}
                              <span className="text-lg shrink-0 mt-0.5">
                                {n.tipo === 'nueva_consulta'      ? '📅'
                                 : n.tipo === 'consulta_confirmada' ? '✅'
                                 : n.tipo === 'consulta_rechazada'  ? '❌'
                                 : n.tipo === 'mensaje_abogado'     ? '💬'
                                 : n.tipo === 'mensaje_cliente'     ? '💬'
                                 : n.tipo === 'perfil_aprobado'     ? '🎉'
                                 : n.tipo === 'perfil_rechazado'    ? '❌'
                                 : n.tipo === 'nuevo_abogado'       ? '👤'
                                 : n.tipo === 'nueva_calificacion'  ? '⭐'
                                 : n.tipo === 'documento_aprobado'  ? '✅'
                                 : n.tipo === 'documento_rechazado' ? '❌'
                                 : n.tipo === 'nuevo_documento'     ? '📄'
                                 : '🔔'}
                              </span>
                              {/* Contenido */}
                              <div className="flex-1 min-w-0">
                                <p className="font-body font-semibold text-xs leading-snug" style={{ color: '#1C1B18' }}>
                                  {n.titulo}
                                </p>
                                <p className="font-body text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: '#56534A' }}>
                                  {n.mensaje}
                                </p>
                                <p className="font-body text-xs mt-1" style={{ color: '#B0AEA8' }}>
                                  {formatDistanceToNow(new Date(n.creado_en), { addSuffix: true, locale: es })}
                                </p>
                              </div>
                              {/* Punto no leída */}
                              {!n.leida && (
                                <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: '#C4522E' }} />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Menú de perfil */}
                <div className="relative">
                  <button
                    onClick={() => setPerfilAbierto(!perfilAbierto)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(44,43,39,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium overflow-hidden"
                      style={{ background: '#2C2B27' }}
                    >
                      {usuario?.avatar_url
                        ? <img src={usuario.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        : `${usuario?.nombre?.[0]}${usuario?.apellido?.[0]}`
                      }
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium font-body leading-none" style={{ color: '#1C1B18' }}>
                        {usuario?.nombre}
                      </p>
                      <p className="text-xs capitalize leading-none mt-0.5 font-body" style={{ color: '#8A8780' }}>
                        {usuario?.rol}
                      </p>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`transition-transform`}
                      style={{ color: '#8A8780', transform: perfilAbierto ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {/* Dropdown */}
                  {perfilAbierto && (
                    <div
                      className="absolute right-0 top-full mt-2 w-56 rounded-2xl py-2 animate-slide-down border"
                      style={{ background: '#fff', borderColor: '#E8E6E3', boxShadow: '0 8px 32px rgba(28,27,24,0.12)' }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: '#F0EFED' }}>
                        <p className="font-medium text-sm" style={{ color: '#1C1B18' }}>
                          {usuario?.nombre} {usuario?.apellido}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#8A8780' }}>{usuario?.email}</p>
                      </div>
                      <div className="py-1">
                        {esAbogado && (
                          <>
                            <Link
                              to="/abogado/perfil"
                              onClick={() => setPerfilAbierto(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-body transition-colors"
                              style={{ color: '#3A3832' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                            >
                              <User size={15} /> Mi Perfil
                            </Link>
                            <Link
                              to="/abogado/suscripcion"
                              onClick={() => setPerfilAbierto(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-body transition-colors"
                              style={{ color: '#3A3832' }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                            >
                              <Settings size={15} /> Mi Suscripción
                            </Link>
                          </>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body text-red-500 transition-colors"
                          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                        >
                          <LogOut size={15} /> Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-body font-medium border transition-all"
                  style={{ color: '#2C2B27', borderColor: '#D4D2CC', background: '#fff' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="px-4 py-2 rounded-xl text-sm font-body font-medium text-white transition-colors"
                  style={{ background: '#2C2B27' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#3A3832'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* ── Botón menú mobile ──────────────────────────── */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: '#56534A' }}
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* ── Menú mobile ────────────────────────────────── */}
        {menuAbierto && (
          <div
            className="md:hidden border-t py-4 space-y-1 animate-slide-down"
            style={{ borderColor: '#E8E6E3' }}
          >
            {links.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuAbierto(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium font-body"
                style={esLinkActivo(link.href)
                  ? { background: 'rgba(44,43,39,0.08)', color: '#1C1B18' }
                  : { color: '#56534A' }
                }
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t flex flex-col gap-2 px-2" style={{ borderColor: '#E8E6E3' }}>
              {estaAutenticado ? (
                <button onClick={handleLogout} className="btn-secondary text-sm w-full">
                  Cerrar sesión
                </button>
              ) : (
                <>
                  <Link to="/login"    onClick={() => setMenuAbierto(false)} className="btn-secondary text-center">Iniciar sesión</Link>
                  <Link to="/registro" onClick={() => setMenuAbierto(false)} className="btn-primary  text-center">Registrarse</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cerrar dropdowns al hacer click fuera */}
      {perfilAbierto && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setPerfilAbierto(false)} />
      )}
      {campanaAbierta && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 48 }}
          onClick={() => setCampana(false)}
        />
      )}
    </nav>
  );
}
