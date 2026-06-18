// ============================================================
// src/pages/admin/Usuarios.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Search, UserCheck, UserX, Shield, RefreshCw,
  Mail, User, Briefcase, Crown, X, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

function BadgeRol({ rol }) {
  const mapa = {
    admin:   { icono: <Crown size={11} />,     label: 'Admin',   bg: 'rgba(124,58,237,0.08)', color: '#6d28d9' },
    abogado: { icono: <Briefcase size={11} />, label: 'Abogado', bg: 'rgba(44,43,39,0.08)',   color: '#2C2B27' },
    cliente: { icono: <User size={11} />,      label: 'Cliente', bg: '#F0EFED',               color: '#56534A' },
  };
  const cfg = mapa[rol] || mapa.cliente;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-body font-medium px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.icono} {cfg.label}
    </span>
  );
}

function ModalUsuario({ usuario, onCerrar, onActualizar }) {
  const [procesando, setProcesando] = useState(false);

  const toggleEstado = async () => {
    const nuevoEstado = !usuario.activo;
    if (!window.confirm(`¿${nuevoEstado ? 'Habilitar' : 'Deshabilitar'} la cuenta de ${usuario.nombre} ${usuario.apellido}?`)) return;
    setProcesando(true);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/estado`, { activo: nuevoEstado });
      toast.success(`Usuario ${nuevoEstado ? 'habilitado' : 'deshabilitado'}.`);
      onActualizar();
      onCerrar();
    } catch { toast.error('Error al actualizar el estado.'); }
    finally { setProcesando(false); }
  };

  // Permitir re-registro — solo para abogados rechazados
  const permitirReregistro = async () => {
    if (!window.confirm(
      `¿Permitir que ${usuario.nombre} ${usuario.apellido} se vuelva a registrar?\n\n` +
      `El email "${usuario.email}" quedará libre para un nuevo registro. ` +
      `El historial del perfil actual se conserva en la base de datos.`
    )) return;
    setProcesando(true);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/permitir-reregistro`);
      toast.success(`Email liberado. ${usuario.nombre} puede volver a registrarse.`);
      onActualizar();
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar la acción.');
    } finally {
      setProcesando(false);
    }
  };

  // Mostrar el botón de re-registro si es abogado rechazado
  const esAbogadoRechazado = usuario.rol === 'abogado' && usuario.estado_aprobacion === 'rechazado';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-md p-8 animate-slide-up">

        <div className="flex items-start justify-between mb-6">
          <h3 className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>Detalle de usuario</h3>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: '#2C2B27' }}>
            <span className="font-display font-bold text-white text-2xl">
              {usuario.nombre[0]}{usuario.apellido[0]}
            </span>
          </div>
          <div>
            <p className="font-display font-bold text-lg" style={{ color: '#1C1B18' }}>
              {usuario.nombre} {usuario.apellido}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <BadgeRol rol={usuario.rol} />
              <span className="text-xs font-body px-2 py-0.5 rounded-full"
                style={usuario.activo
                  ? { background: 'rgba(22,163,74,0.08)', color: '#16a34a' }
                  : { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }
                }>
                {usuario.activo ? 'Activo' : 'Deshabilitado'}
              </span>
              {/* Badge de estado de aprobación para abogados */}
              {usuario.rol === 'abogado' && usuario.estado_aprobacion && (
                <span className="text-xs font-body px-2 py-0.5 rounded-full"
                  style={usuario.estado_aprobacion === 'aprobado'
                    ? { background: 'rgba(22,163,74,0.08)',   color: '#16a34a' }
                    : usuario.estado_aprobacion === 'rechazado'
                      ? { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }
                      : { background: 'rgba(245,158,11,0.08)',color: '#b45309' }
                  }>
                  {usuario.estado_aprobacion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl p-4 space-y-3 mb-6" style={{ background: '#F7F6F4' }}>
          <div className="flex items-center gap-3">
            <Mail size={15} style={{ color: '#8A8780' }} className="shrink-0" />
            <div>
              <p className="font-body text-xs" style={{ color: '#8A8780' }}>Email</p>
              <p className="font-body text-sm" style={{ color: '#1C1B18' }}>{usuario.email}</p>
            </div>
            {usuario.email_verificado && <Shield size={13} style={{ color: '#16a34a' }} className="ml-auto" />}
          </div>
          <div className="border-t pt-3" style={{ borderColor: '#E8E6E3' }}>
            <p className="font-body text-xs" style={{ color: '#8A8780' }}>Registrado el</p>
            <p className="font-body text-sm" style={{ color: '#1C1B18' }}>
              {format(new Date(usuario.creado_en), "d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Habilitar / Deshabilitar — no para admins */}
          {usuario.rol !== 'admin' && (
            <button onClick={toggleEstado} disabled={procesando}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm transition-colors"
              style={usuario.activo
                ? { background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }
                : { background: 'rgba(22,163,74,0.08)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }
              }>
              {procesando
                ? <div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                : usuario.activo
                  ? <><UserX size={16} /> Deshabilitar cuenta</>
                  : <><UserCheck size={16} /> Habilitar cuenta</>
              }
            </button>
          )}

          {/* Permitir re-registro — solo para abogados rechazados */}
          {esAbogadoRechazado && (
            <div className="pt-1">
              <button
                onClick={permitirReregistro}
                disabled={procesando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                style={{ borderColor: '#B86030', color: '#B86030', background: 'rgba(184,96,48,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.04)'; }}
              >
                <RefreshCw size={15} /> Permitir re-registro
              </button>
              <p className="font-body text-xs mt-2 text-center" style={{ color: '#B0AEA8' }}>
                El historial del perfil actual se conserva en la base de datos.
              </p>
            </div>
          )}

          <button onClick={onCerrar} className="btn-secondary w-full">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsuarios() {
  const [usuarios,     setUsuarios]     = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [busqueda,     setBusqueda]     = useState('');
  const [filtroRol,    setFiltroRol]    = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [usuarioSel,   setUsuarioSel]   = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/usuarios');
      setUsuarios(data.usuarios);
    } catch { toast.error('No se pudieron cargar los usuarios.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = usuarios.filter(u => {
    const texto = `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase();
    return (!busqueda || texto.includes(busqueda.toLowerCase())) &&
      (!filtroRol || u.rol === filtroRol) &&
      (filtroActivo === '' ? true : filtroActivo === 'true' ? u.activo : !u.activo);
  });

  const conteos = {
    total:     usuarios.length,
    abogado:   usuarios.filter(u => u.rol === 'abogado').length,
    cliente:   usuarios.filter(u => u.rol === 'cliente').length,
    inactivos: usuarios.filter(u => !u.activo).length,
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de usuarios</h1>
            <p className="section-subtitle">
              {cargando ? 'Cargando...' : `${filtrados.length} de ${usuarios.length} usuarios`}
            </p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total',          val: conteos.total,     icono: '👥' },
            { label: 'Abogados',       val: conteos.abogado,   icono: '⚖️' },
            { label: 'Clientes',       val: conteos.cliente,   icono: '👤' },
            { label: 'Deshabilitados', val: conteos.inactivos, icono: '🚫' },
          ].map(({ label, val, icono }) => (
            <div key={label} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icono}</span>
                <p className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>{val}</p>
              </div>
              <p className="font-body text-xs" style={{ color: '#8A8780' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
            <input type="text" placeholder="Buscar por nombre o email..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10" />
          </div>
          <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} className="input-field sm:w-40">
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="abogado">Abogado</option>
            <option value="cliente">Cliente</option>
          </select>
          <select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)} className="input-field sm:w-44">
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Deshabilitados</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-body font-semibold uppercase tracking-wider"
            style={{ background: '#F7F6F4', borderColor: '#F0EFED', color: '#8A8780' }}>
            <div className="col-span-4">Usuario</div>
            <div className="col-span-2">Rol</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Registrado</div>
            <div className="col-span-1 text-right">Acción</div>
          </div>

          {cargando && (
            <div className="divide-y" style={{ borderColor: '#F7F6F4' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: '#E8E6E3' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                    <div className="h-3 rounded w-1/4" style={{ background: '#E8E6E3' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!cargando && filtrados.length === 0 && (
            <div className="py-16 text-center">
              <Filter size={32} className="mx-auto mb-3" style={{ color: '#D4D2CC' }} />
              <p className="font-body" style={{ color: '#8A8780' }}>No se encontraron usuarios.</p>
            </div>
          )}

          {!cargando && filtrados.map(u => (
            <div key={u.id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 border-b last:border-0 items-center transition-colors ${!u.activo ? 'opacity-60' : ''}`}
              style={{ borderColor: '#F7F6F4' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
            >
              <div className="md:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: u.activo ? '#2C2B27' : '#D4D2CC' }}>
                  <span className="font-display font-bold text-white text-sm">
                    {u.nombre[0]}{u.apellido[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-sm truncate" style={{ color: '#1C1B18' }}>
                    {u.nombre} {u.apellido}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield size={10} style={{ color: u.email_verificado ? '#16a34a' : '#B86030' }} />
                    <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                      {u.email_verificado ? 'Verificado' : 'Pendiente'}
                    </span>
                    {/* Indicador de abogado rechazado */}
                    {u.rol === 'abogado' && u.estado_aprobacion === 'rechazado' && (
                      <span className="font-body text-xs ml-1 px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
                        rechazado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2"><BadgeRol rol={u.rol} /></div>
              <div className="md:col-span-3">
                <p className="font-body text-sm truncate flex items-center gap-1" style={{ color: '#56534A' }}>
                  <Mail size={12} style={{ color: '#8A8780' }} className="shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                  {format(new Date(u.creado_en), "d MMM yyyy", { locale: es })}
                </p>
              </div>
              <div className="md:col-span-1 flex justify-end">
                <button onClick={() => setUsuarioSel(u)}
                  className="text-xs px-3 py-1.5 rounded-xl font-body font-medium border transition-colors"
                  style={{ borderColor: '#E8E6E3', color: '#56534A' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  Ver
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="font-body text-xs text-center mt-4" style={{ color: '#B0AEA8' }}>
          Las cuentas de administrador no pueden deshabilitarse desde este panel.
        </p>
      </div>

      {usuarioSel && (
        <ModalUsuario usuario={usuarioSel}
          onCerrar={() => setUsuarioSel(null)} onActualizar={cargar} />
      )}
    </div>
  );
}
