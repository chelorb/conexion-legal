// ============================================================
// src/pages/abogado/Beneficios.jsx
// Descuentos y convenios exclusivos para abogados Premium
// Muestra los beneficios disponibles según el plan
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Lock, Copy, ExternalLink, ArrowRight, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Colores por categoría de beneficio
// ─────────────────────────────────────────────────────────────
const COLORES_CATEGORIA = {
  'Librería':    'bg-blue-50   text-blue-700   border-blue-100',
  'Coworking':   'bg-purple-50 text-purple-700 border-purple-100',
  'Gastronomía': 'bg-amber-50  text-amber-700  border-amber-100',
  'Universidad': 'bg-green-50  text-green-700  border-green-100',
  'Seguro':      'bg-red-50    text-red-700    border-red-100',
  'Capacitación':'bg-navy-50   text-navy-700   border-navy-100',
};
const COLOR_DEFAULT = 'bg-slate-50 text-slate-700 border-slate-100';

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de beneficio individual
// ─────────────────────────────────────────────────────────────
function TarjetaBeneficio({ beneficio }) {
  const [copiado, setCopiado] = useState(false);
  const colorClase = COLORES_CATEGORIA[beneficio.categoria] || COLOR_DEFAULT;

  // Copiar código de descuento al portapapeles
  const copiarCodigo = () => {
    navigator.clipboard.writeText(beneficio.codigo_descuento);
    setCopiado(true);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="card p-6 flex flex-col gap-4 hover:shadow-card-hover transition-shadow">

      {/* Cabecera: logo/icono + categoría */}
      <div className="flex items-start justify-between gap-3">
        {/* Logo del comercio o inicial */}
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
          {beneficio.logo_url
            ? <img src={beneficio.logo_url} alt={beneficio.nombre} className="w-full h-full object-contain p-2" />
            : (
              <span className="font-display font-bold text-navy-900 text-2xl">
                {beneficio.nombre[0]}
              </span>
            )
          }
        </div>

        {/* Badge de categoría */}
        <span className={`text-xs font-body font-medium px-2.5 py-1 rounded-full border ${colorClase}`}>
          {beneficio.categoria}
        </span>
      </div>

      {/* Nombre y descripción */}
      <div className="flex-1">
        <h3 className="font-display font-semibold text-navy-900 text-base mb-1">
          {beneficio.nombre}
        </h3>
        <p className="font-body text-sm text-slate-500 leading-relaxed">
          {beneficio.descripcion}
        </p>
      </div>

      {/* Badge de descuento */}
      {beneficio.descuento_pct && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 px-3 py-1.5 rounded-xl">
            <Tag size={13} />
            <span className="font-body font-semibold text-sm">
              {beneficio.descuento_pct}% de descuento
            </span>
          </div>
        </div>
      )}

      {/* Código de descuento */}
      {beneficio.codigo_descuento && (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-dashed border-slate-300 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div>
              <p className="font-body text-xs text-slate-400 mb-0.5">Código de descuento</p>
              <p className="font-mono font-semibold text-navy-900 text-sm tracking-widest">
                {beneficio.codigo_descuento}
              </p>
            </div>
            <button
              onClick={copiarCodigo}
              className={`p-2 rounded-lg transition-colors ${
                copiado ? 'bg-green-100 text-green-600' : 'hover:bg-slate-200 text-slate-500'
              }`}
              title="Copiar código"
            >
              <Copy size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Link externo si tiene */}
      {beneficio.link_externo && (
        <a
          href={beneficio.link_externo}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm w-full justify-center"
        >
          Ir al sitio <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function Beneficios() {
  const [beneficios,  setBeneficios]  = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [sinAcceso,   setSinAcceso]   = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  useEffect(() => {
    api.get('/beneficios')
      .then(r => setBeneficios(r.data.beneficios))
      .catch(err => {
        if (err.response?.status === 403) setSinAcceso(true);
        else toast.error('No se pudieron cargar los beneficios.');
      })
      .finally(() => setCargando(false));
  }, []);

  // Obtener categorías únicas para el filtro
  const categorias = [...new Set(beneficios.map(b => b.categoria))].filter(Boolean);

  // Aplicar filtro de categoría
  const beneficiosFiltrados = categoriaFiltro
    ? beneficios.filter(b => b.categoria === categoriaFiltro)
    : beneficios;

  // ── Sin acceso por plan insuficiente ───────────────────────
  if (sinAcceso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-gold-300/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift size={36} className="text-gold-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-3">
            Beneficios exclusivos
          </h2>
          <p className="font-body text-slate-500 mb-6 leading-relaxed">
            Los descuentos y convenios con librerías, coworkings, universidades y más están disponibles en el plan Premium.
          </p>
          <Link to="/abogado/suscripcion" className="btn-gold w-full justify-center">
            Ver plan Premium <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="section-title">Mis beneficios</h1>
          <p className="section-subtitle">
            Descuentos y convenios exclusivos para miembros de Conexión Legal.
          </p>
        </div>

        {/* ── Filtros por categoría ────────────────────────── */}
        {!cargando && categorias.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCategoriaFiltro('')}
              className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all ${
                !categoriaFiltro ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300'
              }`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all ${
                  categoriaFiltro === cat ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Skeleton ─────────────────────────────────────── */}
        {cargando && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-6 animate-pulse space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-slate-200 rounded-xl" />
                  <div className="h-6 w-24 bg-slate-200 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded" />
                  <div className="h-3 bg-slate-200 rounded w-4/5" />
                </div>
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* ── Sin resultados ───────────────────────────────── */}
        {!cargando && beneficiosFiltrados.length === 0 && (
          <div className="card p-16 text-center">
            <Gift size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display text-xl text-navy-900 mb-2">
              {categoriaFiltro ? 'Sin beneficios en esta categoría' : 'Sin beneficios disponibles'}
            </p>
            <p className="font-body text-slate-500 text-sm">
              Pronto incorporaremos más convenios y descuentos.
            </p>
          </div>
        )}

        {/* ── Grilla de beneficios ─────────────────────────── */}
        {!cargando && beneficiosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficiosFiltrados.map(b => (
              <TarjetaBeneficio key={b.id} beneficio={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
