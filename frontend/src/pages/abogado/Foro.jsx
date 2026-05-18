// ============================================================
// src/pages/abogado/Foro.jsx
// Foro interno de la comunidad de abogados
// Vista principal: lista de categorías con actividad reciente
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight, Clock, Users, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Foro() {
  const { usuario }              = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [sinAcceso,  setSinAcceso]  = useState(false);

  useEffect(() => {
    api.get('/foro/categorias')
      .then(r => setCategorias(r.data.categorias))
      .catch(err => {
        if (err.response?.status === 403) setSinAcceso(true);
      })
      .finally(() => setCargando(false));
  }, []);

  // ── Sin acceso ──────────────────────────────────────────────
  if (sinAcceso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-navy-900" />
          </div>
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-3">
            Foro de la Comunidad
          </h2>
          <p className="font-body text-slate-500 mb-6 leading-relaxed">
            El foro de debate y networking es exclusivo para miembros del Plan Comunidad.
          </p>
          <Link to="/abogado/suscripcion" className="btn-primary w-full justify-center">
            Ver Plan Comunidad <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8 max-w-4xl">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="section-title">Foro de la Comunidad</h1>
          <p className="section-subtitle">
            Debate, consultá y conectate con otros profesionales del derecho.
          </p>
        </div>

        {/* ── Skeleton ─────────────────────────────────────── */}
        {cargando && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-6 animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Lista de categorías ───────────────────────────── */}
        {!cargando && (
          <div className="space-y-3">
            {categorias.map(cat => (
              <Link
                key={cat.id}
                to={`/abogado/foro/${cat.id}`}
                className="card-hover p-6 flex items-center gap-5 group"
              >
                {/* Ícono de la categoría */}
                <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-navy-100 transition-colors">
                  {cat.icono}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-navy-900 text-lg group-hover:text-navy-700 transition-colors">
                    {cat.nombre}
                  </h3>
                  {cat.descripcion && (
                    <p className="font-body text-sm text-slate-500 mt-0.5 leading-relaxed">
                      {cat.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    {/* Cantidad de hilos */}
                    <div className="flex items-center gap-1.5 font-body text-xs text-slate-400">
                      <MessageSquare size={12} />
                      {parseInt(cat.total_hilos) || 0} hilo{parseInt(cat.total_hilos) !== 1 ? 's' : ''}
                    </div>
                    {/* Última actividad */}
                    {cat.ultima_actividad && (
                      <div className="flex items-center gap-1.5 font-body text-xs text-slate-400">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(cat.ultima_actividad), { addSuffix: true, locale: es })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Flecha */}
                <ArrowRight size={18} className="text-slate-300 group-hover:text-navy-700 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* ── Info de la comunidad ─────────────────────────── */}
        <div className="card p-6 mt-6 bg-navy-900 border-0">
          <div className="flex items-start gap-3">
            <Users size={20} className="text-gold-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-body font-semibold text-white text-sm mb-1">
                Estándares de la Comunidad
              </p>
              <p className="font-body text-white/60 text-xs leading-relaxed">
                Este espacio es exclusivo para profesionales verificados. Mantené un tono respetuoso y constructivo. Queda prohibida la publicidad de servicios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
