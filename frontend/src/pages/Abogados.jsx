// ============================================================
// src/pages/Abogados.jsx
// Grilla pública de abogados con filtros, paginación y búsqueda
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, MapPin, Star, Shield,
  Video, Building2, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de abogado en la grilla
// ─────────────────────────────────────────────────────────────
function TarjetaAbogado({ abogado }) {
  const {
    id, nombre, apellido, avatar_url, especialidades,
    descripcion, ciudad, provincia, calificacion_promedio,
    total_calificaciones, atiende_online, atiende_presencial,
    matricula_verificada, plan_slug, credencial_activa,
  } = abogado;

  // Clases del badge según el plan
  const badgePlan = {
    gratuito: 'badge-plan-gratuito',
    basico:   'badge-plan-basico',
    premium:  'badge-plan-premium',
  }[plan_slug] || 'badge-plan-gratuito';

  return (
    <Link to={`/abogados/${id}`} className="card-hover group p-6 flex flex-col gap-4 animate-fade-in">

      {/* Cabecera: avatar + nombre + plan */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-navy-100 overflow-hidden">
            {avatar_url
              ? <img src={avatar_url} alt={nombre} className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full flex items-center justify-center bg-navy-900">
                  <span className="font-display font-bold text-white text-xl">
                    {nombre[0]}{apellido[0]}
                  </span>
                </div>
              )
            }
          </div>
          {/* Indicador de matrícula verificada */}
          {matricula_verificada && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-navy-900 rounded-full flex items-center justify-center">
              <Shield size={10} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display font-semibold text-navy-900 text-base leading-tight group-hover:text-navy-700 transition-colors">
                Dr./Dra. {nombre} {apellido}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                <span className="font-body text-xs text-slate-500 truncate">{ciudad}, {provincia}</span>
              </div>
            </div>
            <span className={`${badgePlan} shrink-0`}>
              {plan_slug === 'premium' ? '★ Premium' : plan_slug === 'basico' ? 'Básico' : 'Gratuito'}
            </span>
          </div>

          {/* Calificación */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star
                  key={i}
                  size={12}
                  className={i <= Math.round(calificacion_promedio)
                    ? 'fill-gold-500 text-gold-500'
                    : 'text-slate-200 fill-slate-200'
                  }
                />
              ))}
            </div>
            <span className="font-body text-xs font-medium text-slate-700">
              {calificacion_promedio > 0 ? calificacion_promedio.toFixed(1) : '—'}
            </span>
            {total_calificaciones > 0 && (
              <span className="font-body text-xs text-slate-400">
                ({total_calificaciones} {total_calificaciones === 1 ? 'reseña' : 'reseñas'})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Especialidades */}
      {especialidades?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {especialidades.slice(0, 3).map(esp => (
            <span key={esp} className="px-2.5 py-1 bg-navy-50 text-navy-700 text-xs rounded-full font-body">
              {esp}
            </span>
          ))}
          {especialidades.length > 3 && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-body">
              +{especialidades.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Descripción */}
      {descripcion && (
        <p className="font-body text-sm text-slate-500 leading-relaxed line-clamp-2">
          {descripcion}
        </p>
      )}

      {/* Pie: modalidades */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <div className="flex gap-3">
          {atiende_online && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-body">
              <Video size={12} className="text-navy-700" /> Online
            </div>
          )}
          {atiende_presencial && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-body">
              <Building2 size={12} className="text-navy-700" /> Presencial
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-navy-700 font-body group-hover:underline">
          Ver perfil →
        </span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function Abogados() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Estado de filtros (sincronizado con la URL)
  const [filtros, setFiltros] = useState({
    ciudad:       searchParams.get('ciudad')       || '',
    especialidad: searchParams.get('especialidad') || '',
    online:       searchParams.get('online')       || '',
    orden:        searchParams.get('orden')        || 'calificacion',
  });

  const [abogados,  setAbogados]  = useState([]);
  const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, total_paginas: 1 });
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [especialidades, setEspecialidades]   = useState([]);

  // Cargar catálogo de especialidades al montar
  useEffect(() => {
    api.get('/abogados/especialidades')
      .then(r => setEspecialidades(r.data.especialidades))
      .catch(() => {});
  }, []);

  // Buscar abogados cuando cambian los filtros o la página
  const buscar = useCallback(async (pagina = 1) => {
    setCargando(true);
    setError(null);
    try {
      const params = { pagina, limite: 12, ...filtros };
      // Limpiar parámetros vacíos
      Object.keys(params).forEach(k => !params[k] && delete params[k]);

      const { data } = await api.get('/abogados', { params });
      setAbogados(data.abogados);
      setPaginacion(data.paginacion);

      // Sincronizar filtros con la URL para que sea compartible
      setSearchParams(params, { replace: true });
    } catch {
      setError('No se pudo cargar el listado de abogados. Intentá nuevamente.');
    } finally {
      setCargando(false);
    }
  }, [filtros, setSearchParams]);

  // Re-buscar cuando cambian los filtros
  useEffect(() => { buscar(1); }, [filtros]); // eslint-disable-line

  const actualizarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({ ciudad: '', especialidad: '', online: '', orden: 'calificacion' });
  };

  const hayFiltrosActivos = filtros.ciudad || filtros.especialidad || filtros.online;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header de la sección ──────────────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="page-container py-8">
          <h1 className="section-title mb-1">Abogados disponibles</h1>
          <p className="section-subtitle">
            {cargando ? 'Buscando...' : `${paginacion.total} profesional${paginacion.total !== 1 ? 'es' : ''} encontrado${paginacion.total !== 1 ? 's' : ''}`}
          </p>

          {/* Barra de búsqueda y filtros */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">

            {/* Campo ciudad */}
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ciudad o zona..."
                value={filtros.ciudad}
                onChange={e => actualizarFiltro('ciudad', e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Selector especialidad */}
            <select
              value={filtros.especialidad}
              onChange={e => actualizarFiltro('especialidad', e.target.value)}
              className="input-field sm:w-56"
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map(e => (
                <option key={e.id} value={e.nombre}>{e.icono} {e.nombre}</option>
              ))}
            </select>

            {/* Selector orden */}
            <select
              value={filtros.orden}
              onChange={e => actualizarFiltro('orden', e.target.value)}
              className="input-field sm:w-48"
            >
              <option value="calificacion">Mejor calificados</option>
              <option value="experiencia">Más experiencia</option>
              <option value="nombre">Por nombre</option>
            </select>

            {/* Botón filtros extra */}
            <button
              onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
              className={`btn-secondary gap-2 shrink-0 ${filtrosAbiertos ? 'bg-navy-50 border-navy-200' : ''}`}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {hayFiltrosActivos && (
                <span className="w-2 h-2 bg-navy-900 rounded-full" />
              )}
            </button>
          </div>

          {/* Filtros expandibles */}
          {filtrosAbiertos && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-4 animate-slide-down">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.online === 'true'}
                  onChange={e => actualizarFiltro('online', e.target.checked ? 'true' : '')}
                  className="rounded border-slate-300 text-navy-900 focus:ring-navy-900"
                />
                <span className="font-body text-sm text-slate-700">Solo atiende online</span>
              </label>

              {hayFiltrosActivos && (
                <button onClick={limpiarFiltros} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-body ml-auto">
                  <X size={14} /> Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Grilla de abogados ────────────────────────────── */}
      <div className="page-container py-8">

        {/* Estado de carga */}
        {cargando && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-6 h-56 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded" />
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !cargando && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">{error}</p>
            <button onClick={() => buscar(1)} className="btn-primary">Reintentar</button>
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && !error && abogados.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display text-xl text-navy-900 mb-2">Sin resultados</p>
            <p className="text-slate-500 mb-6">No encontramos abogados con esos criterios.</p>
            <button onClick={limpiarFiltros} className="btn-secondary">Limpiar filtros</button>
          </div>
        )}

        {/* Resultados */}
        {!cargando && !error && abogados.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {abogados.map(abogado => (
                <TarjetaAbogado key={abogado.id} abogado={abogado} />
              ))}
            </div>

            {/* Paginación */}
            {paginacion.total_paginas > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => buscar(paginacion.pagina - 1)}
                  disabled={paginacion.pagina === 1}
                  className="btn-secondary p-2.5 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: paginacion.total_paginas }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - paginacion.pagina) <= 2)
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => buscar(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-body font-medium transition-all ${
                          p === paginacion.pagina
                            ? 'bg-navy-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))
                  }
                </div>

                <button
                  onClick={() => buscar(paginacion.pagina + 1)}
                  disabled={paginacion.pagina === paginacion.total_paginas}
                  className="btn-secondary p-2.5 disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
