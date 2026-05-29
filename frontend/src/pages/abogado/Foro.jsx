// ============================================================
// src/pages/abogado/Foro.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, Clock, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Foro() {
  const [categorias, setCategorias] = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [sinAcceso,  setSinAcceso]  = useState(false);

  useEffect(() => {
    api.get('/foro/categorias')
      .then(r => setCategorias(r.data.categorias))
      .catch(err => { if (err.response?.status === 403) setSinAcceso(true); })
      .finally(() => setCargando(false));
  }, []);

  if (sinAcceso) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFED' }}>
      <div className="card p-12 max-w-md text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(44,43,39,0.06)' }}>
          <Lock size={36} style={{ color: '#2C2B27' }} />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: '#1C1B18' }}>
          Foro de la Comunidad
        </h2>
        <p className="font-body mb-6 leading-relaxed" style={{ color: '#8A8780' }}>
          El foro de debate y networking es exclusivo para miembros del Plan Comunidad.
        </p>
        <Link to="/abogado/suscripcion" className="btn-primary w-full justify-center">
          Ver Plan Comunidad <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-4xl">

        <div className="mb-8">
          <h1 className="section-title">Foro de la Comunidad</h1>
          <p className="section-subtitle">Debate, consultá y conectate con otros profesionales del derecho.</p>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="card p-6 animate-pulse flex gap-4">
                <div className="w-12 h-12 rounded-2xl shrink-0" style={{ background: '#E8E6E3' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-5 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                  <div className="h-3 rounded w-2/3" style={{ background: '#E8E6E3' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categorías */}
        {!cargando && (
          <div className="space-y-3">
            {categorias.map(cat => (
              <Link
                key={cat.id}
                to={`/abogado/foro/${cat.id}`}
                className="card flex items-center gap-5 p-6 group transition-all hover:shadow-card-hover"
              >
                {/* Ícono */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-colors"
                  style={{ background: '#F0EFED' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F0EFED'; }}
                >
                  {cat.icono}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-display font-semibold text-lg transition-colors"
                    style={{ color: '#1C1B18' }}
                  >
                    {cat.nombre}
                  </h3>
                  {cat.descripcion && (
                    <p className="font-body text-sm mt-0.5 leading-relaxed" style={{ color: '#8A8780' }}>
                      {cat.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 font-body text-xs" style={{ color: '#8A8780' }}>
                      <MessageSquare size={12} />
                      {parseInt(cat.total_hilos) || 0} hilo{parseInt(cat.total_hilos) !== 1 ? 's' : ''}
                    </div>
                    {cat.ultima_actividad && (
                      <div className="flex items-center gap-1.5 font-body text-xs" style={{ color: '#8A8780' }}>
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(cat.ultima_actividad), { addSuffix: true, locale: es })}
                      </div>
                    )}
                  </div>
                </div>

                <ArrowRight size={18} className="shrink-0 transition-colors"
                  style={{ color: '#D4D2CC' }}
                />
              </Link>
            ))}
          </div>
        )}

        {/* Nota de comunidad */}
        <div
          className="rounded-2xl p-6 mt-6"
          style={{ background: '#2C2B27' }}
        >
          <div className="flex items-start gap-3">
            <MessageSquare size={20} className="shrink-0 mt-0.5" style={{ color: '#C4522E' }} />
            <div>
              <p className="font-body font-semibold text-white text-sm mb-1">
                Estándares de la Comunidad
              </p>
              <p className="font-body text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Este espacio es exclusivo para profesionales verificados. Mantené un tono respetuoso y constructivo. Queda prohibida la publicidad de servicios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
