// ============================================================
// src/pages/PortalClientes.jsx
// Catálogo público de abogados — Paleta C: Gris carbón + Cobre
// Sin login requerido, filtros por especialidad y zona
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, MapPin, Star, Shield,
  Video, Building2, ChevronDown, X, SlidersHorizontal
} from 'lucide-react';
import api from '../services/api';

const ESPECIALIDADES = [
  'Derecho Civil', 'Derecho Penal', 'Derecho Laboral',
  'Derecho de Familia', 'Derecho Comercial', 'Derecho Administrativo',
  'Derecho Tributario', 'Derecho Inmobiliario', 'Derecho de Daños',
  'Derecho del Consumidor', 'Propiedad Intelectual', 'Mediación',
];

// ─────────────────────────────────────────────────────────────
// Tarjeta de abogado
// ─────────────────────────────────────────────────────────────
function TarjetaAbogado({ abogado }) {
  const cal = parseFloat(abogado.calificacion_promedio || 0);

  return (
    <Link
      to={`/abogados/${abogado.id}`}
      className="card block hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group"
    >
      <div className="p-6">
        {/* Cabecera */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: '#2C2B27' }}
          >
            {abogado.avatar_url
              ? <img src={abogado.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span className="font-display font-bold text-white text-xl">
                  {abogado.nombre[0]}{abogado.apellido[0]}
                </span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className="font-display font-semibold text-base leading-snug group-hover:underline"
                style={{ color: '#1C1B18' }}
              >
                Dr./Dra. {abogado.nombre} {abogado.apellido}
              </h3>
              {/* Badge plan comunidad */}
              {abogado.plan_slug === 'comunidad' && (
                <span
                  className="text-xs font-body font-medium px-2 py-0.5 rounded-full text-white shrink-0"
                  style={{ background: '#B86030' }}
                >
                  ★ Comunidad
                </span>
              )}
            </div>

            {/* Ubicación */}
            {abogado.ciudad && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={12} style={{ color: '#8A8780' }} />
                <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                  {abogado.ciudad}{abogado.provincia ? `, ${abogado.provincia}` : ''}
                </span>
              </div>
            )}

            {/* Calificación */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {cal > 0 ? (
                <>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star
                        key={i}
                        size={11}
                        style={{
                          fill: i <= Math.round(cal) ? '#B86030' : '#E8E6E3',
                          color: i <= Math.round(cal) ? '#B86030' : '#E8E6E3',
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-body text-xs font-medium" style={{ color: '#1C1B18' }}>
                    {cal.toFixed(1)}
                  </span>
                  <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                    ({abogado.total_calificaciones})
                  </span>
                </>
              ) : (
                <span className="font-body text-xs" style={{ color: '#8A8780' }}>Sin reseñas aún</span>
              )}
              {/* Verificado */}
              {abogado.matricula_verificada && (
                <div className="flex items-center gap-1 ml-1">
                  <Shield size={11} style={{ color: '#B86030' }} />
                  <span className="font-body text-xs" style={{ color: '#B86030' }}>Verificado</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Especialidades */}
        {abogado.especialidades?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {abogado.especialidades.slice(0, 3).map(esp => (
              <span
                key={esp}
                className="font-body text-xs px-2.5 py-1 rounded-full"
                style={{ background: '#F0EFED', color: '#3A3832' }}
              >
                {esp}
              </span>
            ))}
            {abogado.especialidades.length > 3 && (
              <span
                className="font-body text-xs px-2.5 py-1 rounded-full"
                style={{ background: '#F0EFED', color: '#8A8780' }}
              >
                +{abogado.especialidades.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Descripción */}
        {abogado.descripcion && (
          <p
            className="font-body text-xs leading-relaxed mb-4 line-clamp-2"
            style={{ color: '#8A8780' }}
          >
            {abogado.descripcion}
          </p>
        )}

        {/* Modalidades + CTA */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {abogado.atiende_online && (
              <div
                className="flex items-center gap-1.5 text-xs font-body px-2.5 py-1.5 rounded-lg"
                style={{ background: '#F0EFED', color: '#3A3832' }}
              >
                <Video size={11} style={{ color: '#B86030' }} /> Online
              </div>
            )}
            {abogado.atiende_presencial && (
              <div
                className="flex items-center gap-1.5 text-xs font-body px-2.5 py-1.5 rounded-lg"
                style={{ background: '#F0EFED', color: '#3A3832' }}
              >
                <Building2 size={11} style={{ color: '#B86030' }} /> Presencial
              </div>
            )}
          </div>
          <span
            className="font-body text-xs font-medium"
            style={{ color: '#B86030' }}
          >
            Ver perfil →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function PortalClientes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [abogados,  setAbogados]  = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [total,     setTotal]     = useState(0);
  const [pagina,    setPagina]    = useState(1);
  const [filtros,   setFiltros]   = useState({
    busqueda:     searchParams.get('busqueda')    || '',
    especialidad: searchParams.get('especialidad') || '',
    ciudad:       searchParams.get('ciudad')       || '',
    modalidad:    searchParams.get('modalidad')    || '',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const cargar = useCallback(async (pg = 1) => {
    setCargando(true);
    try {
      const params = { pagina: pg, limite: 12, orden: 'calificacion' };
      if (filtros.busqueda)     params.busqueda     = filtros.busqueda;
      if (filtros.especialidad) params.especialidad = filtros.especialidad;
      if (filtros.ciudad)       params.ciudad       = filtros.ciudad;
      if (filtros.modalidad)    params.modalidad    = filtros.modalidad;

      const { data } = await api.get('/abogados', { params });
      setAbogados(pg === 1 ? data.abogados : prev => [...prev, ...data.abogados]);
      setTotal(data.total || 0);
      setPagina(pg);
    } catch {
      // silencioso
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => { cargar(1); }, [cargar]);

  const aplicarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setFiltros({ busqueda: '', especialidad: '', ciudad: '', modalidad: '' });
    setSearchParams({});
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>

      {/* ── Cabecera con búsqueda ──────────────────────────── */}
      <div style={{ background: '#1C1B18' }} className="py-12">
        <div className="page-container">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
            Encontrá tu abogado
          </h1>
          <p className="font-body mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {total > 0 ? `${total} profesionales verificados` : 'Catálogo de profesionales verificados'}
          </p>

          {/* Buscador principal */}
          <div className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
              <input
                type="text"
                placeholder="Buscar por nombre, especialidad..."
                value={filtros.busqueda}
                onChange={e => aplicarFiltro('busqueda', e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl font-body text-sm border-0 outline-none"
                style={{ background: '#fff', color: '#1C1B18' }}
              />
            </div>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-body text-sm font-medium transition-colors"
              style={{
                background: mostrarFiltros ? '#B86030' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {hayFiltrosActivos && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#C4522E' }}
                />
              )}
            </button>
          </div>

          {/* Panel de filtros expandible */}
          {mostrarFiltros && (
            <div
              className="mt-4 p-5 rounded-2xl animate-slide-down max-w-2xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Especialidad */}
                <div>
                  <label className="font-body text-xs font-medium block mb-2"
                    style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Especialidad
                  </label>
                  <select
                    value={filtros.especialidad}
                    onChange={e => aplicarFiltro('especialidad', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl font-body text-sm border-0 outline-none"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  >
                    <option value="" style={{ background: '#2C2B27' }}>Todas</option>
                    {ESPECIALIDADES.map(e => (
                      <option key={e} value={e} style={{ background: '#2C2B27' }}>{e}</option>
                    ))}
                  </select>
                </div>

                {/* Ciudad */}
                <div>
                  <label className="font-body text-xs font-medium block mb-2"
                    style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Ciudad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Buenos Aires"
                    value={filtros.ciudad}
                    onChange={e => aplicarFiltro('ciudad', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl font-body text-sm border-0 outline-none"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </div>

                {/* Modalidad */}
                <div>
                  <label className="font-body text-xs font-medium block mb-2"
                    style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Modalidad
                  </label>
                  <select
                    value={filtros.modalidad}
                    onChange={e => aplicarFiltro('modalidad', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl font-body text-sm border-0 outline-none"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                  >
                    <option value="" style={{ background: '#2C2B27' }}>Todas</option>
                    <option value="online" style={{ background: '#2C2B27' }}>Online</option>
                    <option value="presencial" style={{ background: '#2C2B27' }}>Presencial</option>
                  </select>
                </div>
              </div>

              {hayFiltrosActivos && (
                <button
                  onClick={limpiarFiltros}
                  className="mt-4 flex items-center gap-1.5 font-body text-xs transition-colors"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#C4522E'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <X size={13} /> Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Grilla de abogados ────────────────────────────── */}
      <div className="page-container py-10">

        {/* Tags de filtros activos */}
        {hayFiltrosActivos && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(filtros).filter(([,v]) => v).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full font-body text-xs font-medium"
                style={{ background: 'rgba(184,96,48,0.1)', color: '#B86030', border: '1px solid rgba(184,96,48,0.2)' }}
              >
                {v}
                <button onClick={() => aplicarFiltro(k, '')}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Skeleton */}
        {cargando && abogados.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl shrink-0" style={{ background: '#E8E6E3' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded" style={{ background: '#E8E6E3', width: '70%' }} />
                    <div className="h-3 rounded" style={{ background: '#E8E6E3', width: '50%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 rounded" style={{ background: '#E8E6E3' }} />
                  <div className="h-3 rounded" style={{ background: '#E8E6E3', width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && abogados.length === 0 && (
          <div className="card p-16 text-center">
            <Search size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>
              Sin resultados
            </p>
            <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
              Probá con otros filtros o buscá por nombre.
            </p>
            <button onClick={limpiarFiltros} className="btn-primary">
              Ver todos los abogados
            </button>
          </div>
        )}

        {/* Grilla */}
        {abogados.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {abogados.map(a => <TarjetaAbogado key={a.id} abogado={a} />)}
            </div>

            {/* Cargar más */}
            {abogados.length < total && (
              <div className="text-center mt-10">
                <button
                  onClick={() => cargar(pagina + 1)}
                  disabled={cargando}
                  className="btn-secondary px-8"
                >
                  {cargando ? 'Cargando...' : `Ver más abogados (${total - abogados.length} restantes)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
