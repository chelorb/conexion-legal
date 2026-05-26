// ============================================================
// src/components/layout/Navbar.jsx
// Barra de navegación — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scale, Menu, X, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { usuario, estaAutenticado, esAbogado, esCliente, esAdmin, logout } = useAuth();
  const [menuAbierto,   setMenuAbierto]   = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
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
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/abogados',  label: 'Abogados' },
    { href: '/admin/usuarios',  label: 'Usuarios' },
    { href: '/admin/planes',    label: 'Planes' },
    { href: '/admin/campus',    label: 'Campus' },
    { href: '/admin/eventos',   label: 'Eventos' },
    { href: '/admin/links',     label: 'Links' },
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
                <button
                  className="relative p-2 rounded-lg transition-colors"
                  style={{ color: '#56534A' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(44,43,39,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#C4522E' }} />
                </button>

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

      {/* Cerrar dropdown al hacer click fuera */}
      {perfilAbierto && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setPerfilAbierto(false)} />
      )}
    </nav>
  );
}
