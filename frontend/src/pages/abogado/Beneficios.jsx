// ============================================================
// src/pages/abogado/Beneficios.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Lock, Copy, ExternalLink, ArrowRight, Tag, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

function TarjetaBeneficio({ beneficio }) {
  const [copiado, setCopiado] = useState(false);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(beneficio.codigo_descuento);
    setCopiado(true);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="card p-6 flex flex-col gap-4 hover:shadow-card-hover transition-shadow">

      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3">
        {/* Logo/inicial */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: '#F0EFED' }}
        >
          {beneficio.logo_url
            ? <img src={beneficio.logo_url} alt={beneficio.nombre} className="w-full h-full object-contain p-2" />
            : <span className="font-display font-bold text-2xl" style={{ color: '#2C2B27' }}>
                {beneficio.nombre[0]}
              </span>
          }
        </div>

        {/* Categoría */}
        <span
          className="text-xs font-body font-medium px-2.5 py-1 rounded-full"
          style={{ background: '#F0EFED', color: '#56534A' }}
        >
          {beneficio.categoria}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="font-display font-semibold text-base mb-1" style={{ color: '#1C1B18' }}>
          {beneficio.nombre}
        </h3>
        <p className="font-body text-sm leading-relaxed" style={{ color: '#8A8780' }}>
          {beneficio.descripcion}
        </p>
      </div>

      {/* Descuento */}
      {beneficio.descuento_pct && (
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}
          >
            <Tag size={13} />
            <span className="font-body font-semibold text-sm">{beneficio.descuento_pct}% de descuento</span>
          </div>
        </div>
      )}

      {/* Código */}
      {beneficio.codigo_descuento && (
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-dashed"
          style={{ background: '#F7F6F4', borderColor: '#D4D2CC' }}
        >
          <div>
            <p className="font-body text-xs" style={{ color: '#8A8780' }}>Código de descuento</p>
            <p className="font-mono font-semibold text-sm tracking-widest" style={{ color: '#1C1B18' }}>
              {beneficio.codigo_descuento}
            </p>
          </div>
          <button
            onClick={copiarCodigo}
            className="p-2 rounded-lg transition-colors"
            style={copiado
              ? { background: 'rgba(22,163,74,0.1)', color: '#16a34a' }
              : { color: '#8A8780' }
            }
            onMouseEnter={e => { if (!copiado) e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { if (!copiado) e.currentTarget.style.background = ''; }}
            title="Copiar código"
          >
            {copiado ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      )}

      {/* Link externo */}
      {beneficio.link_externo && (
        <a
          href={beneficio.link_externo}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-body font-medium text-sm border transition-colors"
          style={{ borderColor: '#D4D2CC', color: '#2C2B27' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; }}
        >
          Ir al sitio <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

export default function Beneficios() {
  const [beneficios,       setBeneficios]       = useState([]);
  const [cargando,         setCargando]         = useState(true);
  const [sinAcceso,        setSinAcceso]        = useState(false);
  const [categoriaFiltro,  setCategoriaFiltro]  = useState('');

  useEffect(() => {
    api.get('/beneficios')
      .then(r => setBeneficios(r.data.beneficios))
      .catch(err => { if (err.response?.status === 403) setSinAcceso(true); })
      .finally(() => setCargando(false));
  }, []);

  const categorias = [...new Set(beneficios.map(b => b.categoria))].filter(Boolean);
  const filtrados  = categoriaFiltro ? beneficios.filter(b => b.categoria === categoriaFiltro) : beneficios;

  if (sinAcceso) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFED' }}>
      <div className="card p-12 max-w-md text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(184,96,48,0.08)' }}>
          <Gift size={36} style={{ color: '#B86030' }} />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: '#1C1B18' }}>
          Beneficios exclusivos
        </h2>
        <p className="font-body mb-6 leading-relaxed" style={{ color: '#8A8780' }}>
          Los descuentos y convenios están disponibles en el plan Comunidad.
        </p>
        <Link to="/abogado/suscripcion" className="btn-gold w-full justify-center">
          Ver Plan Comunidad <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="mb-8">
          <h1 className="section-title">Mis beneficios</h1>
          <p className="section-subtitle">Descuentos y convenios exclusivos para miembros de IUSTIXIUM.</p>
        </div>

        {/* Filtros */}
        {!cargando && categorias.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCategoriaFiltro('')}
              className="px-4 py-2 rounded-full text-sm font-body font-medium transition-all"
              style={!categoriaFiltro
                ? { background: '#2C2B27', color: '#fff' }
                : { background: '#fff', color: '#56534A', border: '1px solid #E8E6E3' }
              }
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                className="px-4 py-2 rounded-full text-sm font-body font-medium transition-all"
                style={categoriaFiltro === cat
                  ? { background: '#2C2B27', color: '#fff' }
                  : { background: '#fff', color: '#56534A', border: '1px solid #E8E6E3' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Skeleton */}
        {cargando && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="card p-6 animate-pulse space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-xl" style={{ background: '#E8E6E3' }} />
                  <div className="h-6 w-24 rounded-full" style={{ background: '#E8E6E3' }} />
                </div>
                <div className="space-y-2">
                  <div className="h-5 rounded w-2/3" style={{ background: '#E8E6E3' }} />
                  <div className="h-3 rounded" style={{ background: '#E8E6E3' }} />
                </div>
                <div className="h-10 rounded-xl" style={{ background: '#E8E6E3' }} />
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && filtrados.length === 0 && (
          <div className="card p-16 text-center">
            <Gift size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>Sin beneficios</p>
            <p className="font-body text-sm" style={{ color: '#8A8780' }}>
              {categoriaFiltro ? 'Probá con otra categoría.' : 'Pronto incorporaremos más convenios.'}
            </p>
          </div>
        )}

        {/* Grilla */}
        {!cargando && filtrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrados.map(b => <TarjetaBeneficio key={b.id} beneficio={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
