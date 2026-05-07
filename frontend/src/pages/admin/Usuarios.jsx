// ============================================================
// src/pages/admin/Usuarios.jsx
// Gestión completa de usuarios desde el panel de administración
// Ver, filtrar, habilitar y deshabilitar cuentas de cualquier rol
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Search, UserCheck, UserX, Shield,
  RefreshCw, ChevronDown, X, Mail,
  User, Briefcase, Crown, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Badge de rol de usuario
// ─────────────────────────────────────────────────────────────
function BadgeRol({ rol }) {
  const mapa = {
    admin:   { clase: 'bg-purple-50 text-purple-700 border-purple-100', icono: <Crown size={11} />,    label: 'Admin' },
    abogado: { clase: 'bg-navy-50 text-navy-700 border-navy-100',       icono: <Briefcase size={11} />, label: 'Abogado' },
    cliente: { clase: 'bg-slate-50 text-slate-600 border-slate-200',    icono: <User size={11} />,      label: 'Cliente' },
  };
  const cfg = mapa[rol] || mapa.cliente;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-2.5 py-1 rounded-full border ${cfg.clase}`}>
      {cfg.icono} {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: Modal de detalle y acciones del usuario
// ─────────────────────────────────────────────────────────────
function ModalUsuario({ usuario, onCerrar, onActualizar }) {
  const [procesando, setProcesando] = useState(false);

  // Cambiar el estado activo/inactivo del usuario
  const toggleEstado = async () => {
    const nuevoEstado = !usuario.activo;
    const accion      = nuevoEstado ? 'habilitar' : 'deshabilitar';

    if (!window.confirm(`¿Estás seguro de que querés ${accion} la cuenta de ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }

    setProcesando(true);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/estado`, { activo: nuevoEstado });
      toast.success(`Usuario ${nuevoEstado ? 'habilitado' : 'deshabilitado'} correctamente.`);
      onActualizar();
      onCerrar();
    } catch {
      toast.error('Error al actualizar el estado del usuario.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-8 animate-slide-up">

        {/* Encabezado del modal */}
        <div className="flex items-start justify-between mb-6">
          <h3 className="font-display font-bold text-navy-900 text-xl">
            Detalle de usuario
          </h3>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Avatar y datos básicos */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-white text-2xl">
              {usuario.nombre[0]}{usuario.apellido[0]}
            </span>
          </div>
          <div>
            <p className="font-display font-bold text-navy-900 text-lg">
              {usuario.nombre} {usuario.apellido}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <BadgeRol rol={usuario.rol} />
              <span className={`text-xs font-body px-2 py-0.5 rounded-full ${
                usuario.activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}>
                {usuario.activo ? 'Activo' : 'Deshabilitado'}
              </span>
            </div>
          </div>
        </div>

        {/* Info del usuario */}
        <div className="space-y-3 mb-6">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-slate-400 shrink-0" />
              <div>
                <p className="font-body text-xs text-slate-400">Email</p>
                <p className="font-body text-sm text-navy-900">{usuario.email}</p>
              </div>
              {/* Indicador verificación email */}
              {usuario.email_verificado && (
                <Shield size={13} className="text-green-500 ml-auto shrink-0" title="Email verificado" />
              )}
            </div>

            <div className="border-t border-slate-100 pt-2.5 flex items-center gap-3">
              <RefreshCw size={15} className="text-slate-400 shrink-0" />
              <div>
                <p className="font-body text-xs text-slate-400">Registrado el</p>
                <p className="font-body text-sm text-navy-900">
                  {format(new Date(usuario.creado_en), "d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5 flex items-center gap-3">
              <User size={15} className="text-slate-400 shrink-0" />
              <div>
                <p className="font-body text-xs text-slate-400">Email verificado</p>
                <p className={`font-body text-sm font-medium ${usuario.email_verificado ? 'text-green-600' : 'text-amber-600'}`}>
                  {usuario.email_verificado ? 'Sí' : 'Pendiente de verificación'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Acciones ──────────────────────────────────── */}
        <div className="space-y-3">
          {/* No permitir deshabilitar admins para evitar quedarse sin acceso */}
          {usuario.rol !== 'admin' && (
            <button
              onClick={toggleEstado}
              disabled={procesando}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm transition-colors ${
                usuario.activo
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100'
              }`}
            >
              {procesando ? (
                <div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              ) : usuario.activo ? (
                <><UserX size={16} /> Deshabilitar cuenta</>
              ) : (
                <><UserCheck size={16} /> Habilitar cuenta</>
              )}
            </button>
          )}

          <button onClick={onCerrar} className="btn-secondary w-full">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function AdminUsuarios() {
  const [usuarios,    setUsuarios]    = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [busqueda,    setBusqueda]    = useState('');
  const [filtroRol,   setFiltroRol]   = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [usuarioSel,  setUsuarioSel]  = useState(null); // Modal

  // Cargar usuarios desde el backend
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/usuarios');
      setUsuarios(data.usuarios);
    } catch {
      toast.error('No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Filtrado combinado en cliente
  const usuariosFiltrados = usuarios.filter(u => {
    const texto = `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase();
    const coincideBusqueda = !busqueda || texto.includes(busqueda.toLowerCase());
    const coincideRol      = !filtroRol || u.rol === filtroRol;
    const coincideActivo   = filtroActivo === ''
      ? true
      : filtroActivo === 'true' ? u.activo : !u.activo;
    return coincideBusqueda && coincideRol && coincideActivo;
  });

  // Contadores para los tabs de filtro rápido
  const conteos = {
    total:   usuarios.length,
    admin:   usuarios.filter(u => u.rol === 'admin').length,
    abogado: usuarios.filter(u => u.rol === 'abogado').length,
    cliente: usuarios.filter(u => u.rol === 'cliente').length,
    inactivos: usuarios.filter(u => !u.activo).length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de usuarios</h1>
            <p className="section-subtitle">
              {cargando ? 'Cargando...' : `${usuariosFiltrados.length} de ${usuarios.length} usuarios`}
            </p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* ── Resumen rápido por rol ───────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total usuarios', valor: conteos.total,   icono: '👥', color: 'bg-slate-50' },
            { label: 'Abogados',       valor: conteos.abogado, icono: '⚖️', color: 'bg-navy-50' },
            { label: 'Clientes',       valor: conteos.cliente, icono: '👤', color: 'bg-blue-50' },
            { label: 'Deshabilitados', valor: conteos.inactivos, icono: '🚫', color: conteos.inactivos > 0 ? 'bg-red-50' : 'bg-slate-50' },
          ].map(({ label, valor, icono, color }) => (
            <div key={label} className={`card p-4 ${color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icono}</span>
                <p className="font-display font-bold text-navy-900 text-xl">{valor}</p>
              </div>
              <p className="font-body text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Filtros ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Filtro por rol */}
          <select
            value={filtroRol}
            onChange={e => setFiltroRol(e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="abogado">Abogado</option>
            <option value="cliente">Cliente</option>
          </select>

          {/* Filtro por estado */}
          <select
            value={filtroActivo}
            onChange={e => setFiltroActivo(e.target.value)}
            className="input-field sm:w-44"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Deshabilitados</option>
          </select>
        </div>

        {/* ── Tabla de usuarios ────────────────────────────── */}
        <div className="card overflow-hidden">

          {/* Encabezado de columnas (solo desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-body font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Usuario</div>
            <div className="col-span-2">Rol</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Registrado</div>
            <div className="col-span-1 text-right">Estado</div>
          </div>

          {/* Skeleton de carga */}
          {cargando && (
            <div className="divide-y divide-slate-50">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!cargando && usuariosFiltrados.length === 0 && (
            <div className="py-16 text-center">
              <Filter size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="font-body text-slate-500">
                No se encontraron usuarios con esos filtros.
              </p>
            </div>
          )}

          {/* Filas */}
          {!cargando && usuariosFiltrados.map(u => (
            <div
              key={u.id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center ${
                !u.activo ? 'opacity-60' : ''
              }`}
            >
              {/* Columna: Usuario */}
              <div className="md:col-span-4 flex items-center gap-3">
                {/* Avatar con inicial */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  u.activo ? 'bg-navy-900' : 'bg-slate-300'
                }`}>
                  <span className="font-display font-bold text-white text-sm">
                    {u.nombre[0]}{u.apellido[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-navy-900 text-sm truncate">
                    {u.nombre} {u.apellido}
                  </p>
                  {/* Email verificado */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {u.email_verificado
                      ? <Shield size={10} className="text-green-500" />
                      : <Shield size={10} className="text-amber-400" />
                    }
                    <span className="font-body text-xs text-slate-400">
                      {u.email_verificado ? 'Email verificado' : 'Pendiente verificación'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Columna: Rol */}
              <div className="md:col-span-2">
                <BadgeRol rol={u.rol} />
              </div>

              {/* Columna: Email */}
              <div className="md:col-span-3">
                <p className="font-body text-sm text-slate-600 truncate flex items-center gap-1">
                  <Mail size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
              </div>

              {/* Columna: Fecha de registro */}
              <div className="md:col-span-2">
                <p className="font-body text-xs text-slate-500">
                  {format(new Date(u.creado_en), "d MMM yyyy", { locale: es })}
                </p>
              </div>

              {/* Columna: Estado y acción */}
              <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-2">
                <button
                  onClick={() => setUsuarioSel(u)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Ver
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Nota de seguridad */}
        <p className="font-body text-xs text-slate-400 mt-4 text-center">
          Las cuentas de administrador no pueden ser deshabilitadas desde este panel por razones de seguridad.
        </p>
      </div>

      {/* Modal de usuario */}
      {usuarioSel && (
        <ModalUsuario
          usuario={usuarioSel}
          onCerrar={() => setUsuarioSel(null)}
          onActualizar={cargar}
        />
      )}
    </div>
  );
}
