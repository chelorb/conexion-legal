// ============================================================
// src/components/layout/Navbar.jsx
// Barra de navegación principal — cambia según rol del usuario
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scale, Menu, X, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { usuario, estaAutenticado, esAbogado, esCliente, esAdmin, logout } = useAuth();
  const [menuAbierto,  setMenuAbierto]  = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  // Links según el rol del usuario
  const linksAbogado = [
    { href: '/abogado/dashboard',   label: 'Panel' },
    { href: '/abogado/consultas',   label: 'Consultas' },
    { href: '/abogado/campus',      label: 'Campus' },
    { href: '/abogado/agenda',      label: 'Agenda' },
    { href: '/abogado/foro',        label: 'Foro' },
    { href: '/abogado/beneficios',  label: 'Beneficios' },
  ];

  const linksCliente = [
    { href: '/clientes',        label: 'Buscar Abogado' },
    { href: '/mis-consultas',   label: 'Mis Consultas' },
  ];

  const linksAdmin = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/abogados',  label: 'Abogados' },
    { href: '/admin/usuarios',  label: 'Usuarios' },
    { href: '/admin/campus',    label: 'Campus' },
    { href: '/admin/eventos',   label: 'Eventos' },
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

  const esLinkActivo = (href) => location.pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/');
    setPerfilAbierto(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 glass border-b border-slate-100 shadow-nav">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center group-hover:bg-navy-800 transition-colors">
              <Scale size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-navy-900 text-lg">
              Conexión<span className="text-gold-500">Legal</span>
            </span>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium font-body transition-all duration-150 ${
                  esLinkActivo(link.href)
                    ? 'bg-navy-50 text-navy-900'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Acciones derecha */}
          <div className="hidden md:flex items-center gap-3">
            {estaAutenticado ? (
              <>
                {/* Notificaciones */}
                <button className="relative p-2 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-50 transition-colors">
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Menú de perfil */}
                <div className="relative">
                  <button
                    onClick={() => setPerfilAbierto(!perfilAbierto)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                      {usuario?.avatar_url
                        ? <img src={usuario.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        : `${usuario?.nombre?.[0]}${usuario?.apellido?.[0]}`
                      }
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-navy-900 font-body leading-none">{usuario?.nombre}</p>
                      <p className="text-xs text-slate-400 capitalize leading-none mt-0.5">{usuario?.rol}</p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${perfilAbierto ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {perfilAbierto && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-slate-100 py-2 animate-slide-down">
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="font-medium text-sm text-navy-900">{usuario?.nombre} {usuario?.apellido}</p>
                        <p className="text-xs text-slate-400 truncate">{usuario?.email}</p>
                      </div>
                      <div className="py-1">
                        {esAbogado && (
                          <>
                            <Link to="/abogado/perfil" onClick={() => setPerfilAbierto(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-navy-900 transition-colors">
                              <User size={15} /> Mi Perfil
                            </Link>
                            <Link to="/abogado/suscripcion" onClick={() => setPerfilAbierto(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-navy-900 transition-colors">
                              <Settings size={15} /> Mi Suscripción
                            </Link>
                          </>
                        )}
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut size={15} /> Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary text-sm px-4 py-2">Iniciar sesión</Link>
                <Link to="/registro" className="btn-primary  text-sm px-4 py-2">Registrarse</Link>
              </>
            )}
          </div>

          {/* Botón mobile */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menú mobile */}
        {menuAbierto && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-1 animate-slide-down">
            {links.map(link => (
              <Link key={link.href} to={link.href} onClick={() => setMenuAbierto(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium ${
                  esLinkActivo(link.href) ? 'bg-navy-50 text-navy-900' : 'text-slate-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 px-2">
              {estaAutenticado
                ? <button onClick={handleLogout} className="btn-secondary text-sm w-full">Cerrar sesión</button>
                : <>
                    <Link to="/login"    onClick={() => setMenuAbierto(false)} className="btn-secondary text-center">Iniciar sesión</Link>
                    <Link to="/registro" onClick={() => setMenuAbierto(false)} className="btn-primary  text-center">Registrarse</Link>
                  </>
              }
            </div>
          </div>
        )}
      </div>

      {perfilAbierto && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setPerfilAbierto(false)} />
      )}
    </nav>
  );
}
