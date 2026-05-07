// ============================================================
// src/pages/admin/Abogados.jsx
// Gestión de abogados desde el panel de administración
// Aprobar perfiles, verificar matrículas, cambiar visibilidad
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Eye, EyeOff, Check, X,
  Search, Filter, ChevronDown, Star,
  MapPin, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Badge de plan de suscripción
// ─────────────────────────────────────────────────────────────
function BadgePlan({ slug }) {
  const mapa = {
    gratuito: 'badge-plan-gratuito',
    basico:   'badge-plan-basico',
    premium:  'badge-plan-premium',
  };
  const labels = { gratuito: 'Gratuito', basico: 'Básico', premium: '★ Premium' };
  return (
    <span className={mapa[slug] || 'badge-plan-gratuito'}>
      {labels[slug] || slug}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: Modal de detalle y acciones del abogado
// ─────────────────────────────────────────────────────────────
function ModalAbogado({ abogado, onCerrar, onActualizar }) {
  const [guardando, setGuardando] = useState(false);
  const [datos, setDatos] = useState({
    visible:            abogado.visible_en_grilla,
    matricula_verificada: abogado.matricula_verificada,
  });

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, datos);
      toast.success('Perfil actualizado correctamente.');
      onActualizar();
      onCerrar();
    } catch {
      toast.error('Error al actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg p-8 animate-slide-up max-h-[90vh] overflow-y-auto">

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-navy-100 overflow-hidden shrink-0">
              {abogado.avatar_url
                ? <img src={abogado.avatar_url} alt="" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex items-center justify-center bg-navy-900">
                    <span className="font-display font-bold text-white text-xl">
                      {abogado.nombre[0]}{abogado.apellido[0]}
                    </span>
                  </div>
                )
              }
            </div>
            <div>
              <h3 className="font-display font-bold text-navy-900 text-xl">
                Dr./Dra. {abogado.nombre} {abogado.apellido}
              </h3>
              <p className="font-body text-sm text-slate-500">{abogado.email}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Datos del perfil */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3 text-sm font-body">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Plan</p>
              <BadgePlan slug={abogado.plan_slug} />
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Calificación</p>
              <div className="flex items-center gap-1">
                <Star size={13} className="fill-gold-500 text-gold-500" />
                <span className="font-semibold text-navy-900">
                  {abogado.calificacion_promedio > 0 ? abogado.calificacion_promedio.toFixed(1) : '—'}
                </span>
                <span className="text-slate-400 text-xs">({abogado.total_calificaciones})</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Ubicación</p>
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-slate-400" />
                <span className="text-navy-900">{abogado.ciudad || '—'}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Matrícula</p>
              <span className="text-navy-900">{abogado.matricula || '—'}</span>
            </div>
          </div>

          {/* Especialidades */}
          {abogado.especialidades?.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 text-xs font-body mb-2">Especialidades</p>
              <div className="flex flex-wrap gap-1.5">
                {abogado.especialidades.map(esp => (
                  <span key={esp} className="px-2.5 py-1 bg-navy-50 text-navy-700 text-xs rounded-full font-body">
                    {esp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          {abogado.descripcion && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 text-xs font-body mb-2">Descripción profesional</p>
              <p className="font-body text-sm text-slate-700 leading-relaxed line-clamp-4">
                {abogado.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* ── Controles de moderación ─────────────────────── */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h4 className="font-body font-semibold text-navy-900 text-sm">
            Controles de moderación
          </h4>

          {/* Toggle: Visible en grilla */}
          <label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-navy-300 transition-colors">
            <div className="flex items-center gap-3">
              {datos.visible ? <Eye size={18} className="text-navy-700" /> : <EyeOff size={18} className="text-slate-400" />}
              <div>
                <p className="font-body font-medium text-navy-900 text-sm">Visible en búsqueda</p>
                <p className="font-body text-xs text-slate-400">El abogado aparece en la grilla pública</p>
              </div>
            </div>
            {/* Toggle switch */}
            <div
              onClick={() => setDatos(d => ({ ...d, visible: !d.visible }))}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${datos.visible ? 'bg-navy-900' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${datos.visible ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </label>

          {/* Toggle: Matrícula verificada */}
          <label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-navy-300 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={18} className={datos.matricula_verificada ? 'text-navy-700' : 'text-slate-400'} />
              <div>
                <p className="font-body font-medium text-navy-900 text-sm">Matrícula verificada</p>
                <p className="font-body text-xs text-slate-400">Muestra el sello de verificación en el perfil</p>
              </div>
            </div>
            <div
              onClick={() => setDatos(d => ({ ...d, matricula_verificada: !d.matricula_verificada }))}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${datos.matricula_verificada ? 'bg-navy-900' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${datos.matricula_verificada ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <button onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="btn-primary flex-1">
            {guardando ? 'Guardando...' : <><Check size={15} /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function AdminAbogados() {
  const [abogados,      setAbogados]      = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [busqueda,      setBusqueda]      = useState('');
  const [filtroPlan,    setFiltroPlan]    = useState('');
  const [filtroVisible, setFiltroVisible] = useState(''); // '' | 'true' | 'false'
  const [abogadoSel,    setAbogadoSel]    = useState(null); // Para el modal

  // Cargar abogados desde la API de admin
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      // Usamos el endpoint de abogados público pero con paginación alta
      // En producción se haría un endpoint admin dedicado con más datos
      const { data } = await api.get('/abogados', {
        params: { limite: 100, orden: 'nombre' }
      });
      setAbogados(data.abogados || []);
    } catch {
      toast.error('No se pudieron cargar los abogados.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Filtrado combinado en el cliente
  const abogadosFiltrados = abogados.filter(a => {
    const nombreCompleto = `${a.nombre} ${a.apellido} ${a.email || ''}`.toLowerCase();
    const coincideBusqueda = !busqueda || nombreCompleto.includes(busqueda.toLowerCase());
    const coincidePlan     = !filtroPlan || a.plan_slug === filtroPlan;
    const coincideVisible  = filtroVisible === ''
      ? true
      : filtroVisible === 'true'
        ? a.visible_en_grilla
        : !a.visible_en_grilla;
    return coincideBusqueda && coincidePlan && coincideVisible;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de abogados</h1>
            <p className="section-subtitle">
              {cargando ? 'Cargando...' : `${abogadosFiltrados.length} de ${abogados.length} abogados`}
            </p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
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

          {/* Filtro por plan */}
          <select
            value={filtroPlan}
            onChange={e => setFiltroPlan(e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">Todos los planes</option>
            <option value="gratuito">Gratuito</option>
            <option value="basico">Básico</option>
            <option value="premium">Premium</option>
          </select>

          {/* Filtro visibilidad */}
          <select
            value={filtroVisible}
            onChange={e => setFiltroVisible(e.target.value)}
            className="input-field sm:w-44"
          >
            <option value="">Todas las visibilidades</option>
            <option value="true">Visibles en grilla</option>
            <option value="false">Ocultos / pendientes</option>
          </select>
        </div>

        {/* ── Tabla de abogados ────────────────────────────── */}
        <div className="card overflow-hidden">

          {/* Encabezado de la tabla */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-body font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Abogado</div>
            <div className="col-span-2">Plan</div>
            <div className="col-span-2">Ubicación</div>
            <div className="col-span-2">Calificación</div>
            <div className="col-span-2 text-right">Estado / Acción</div>
          </div>

          {/* Skeleton de carga */}
          {cargando && (
            <div className="divide-y divide-slate-50">
              {[1, 2, 3, 4, 5].map(i => (
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
          {!cargando && abogadosFiltrados.length === 0 && (
            <div className="py-16 text-center">
              <Filter size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="font-body text-slate-500">
                No se encontraron abogados con esos filtros.
              </p>
            </div>
          )}

          {/* Filas de abogados */}
          {!cargando && abogadosFiltrados.map(a => (
            <div
              key={a.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors items-center"
            >
              {/* Columna: Abogado */}
              <div className="md:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy-100 overflow-hidden shrink-0">
                  {a.avatar_url
                    ? <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center bg-navy-900">
                        <span className="font-display font-bold text-white text-sm">
                          {a.nombre[0]}{a.apellido[0]}
                        </span>
                      </div>
                    )
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-navy-900 text-sm truncate">
                    {a.nombre} {a.apellido}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.matricula_verificada && (
                      <Shield size={11} className="text-navy-700 shrink-0" />
                    )}
                    <p className="font-body text-xs text-slate-400 truncate">
                      {a.especialidades?.slice(0, 2).join(', ') || 'Sin especialidades'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Columna: Plan */}
              <div className="md:col-span-2">
                <BadgePlan slug={a.plan_slug} />
              </div>

              {/* Columna: Ubicación */}
              <div className="md:col-span-2">
                <p className="font-body text-sm text-slate-600 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{a.ciudad || '—'}</span>
                </p>
              </div>

              {/* Columna: Calificación */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-1.5">
                  <Star size={13} className={a.calificacion_promedio > 0 ? 'fill-gold-500 text-gold-500' : 'fill-slate-200 text-slate-200'} />
                  <span className="font-body text-sm text-navy-900 font-medium">
                    {a.calificacion_promedio > 0 ? a.calificacion_promedio.toFixed(1) : '—'}
                  </span>
                  <span className="font-body text-xs text-slate-400">
                    ({a.total_calificaciones})
                  </span>
                </div>
              </div>

              {/* Columna: Estado y acción */}
              <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3">
                {/* Indicador de visibilidad */}
                <div className={`flex items-center gap-1.5 text-xs font-body px-2.5 py-1 rounded-full ${
                  a.visible_en_grilla
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${a.visible_en_grilla ? 'bg-green-500' : 'bg-amber-500'}`} />
                  {a.visible_en_grilla ? 'Visible' : 'Oculto'}
                </div>

                {/* Botón de gestionar */}
                <button
                  onClick={() => setAbogadoSel(a)}
                  className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                >
                  Gestionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalle */}
      {abogadoSel && (
        <ModalAbogado
          abogado={abogadoSel}
          onCerrar={() => setAbogadoSel(null)}
          onActualizar={cargar}
        />
      )}
    </div>
  );
}
