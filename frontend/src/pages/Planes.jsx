// ============================================================
// src/pages/Planes.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';
import api from '../services/api';

const FEATURES = [
  { key: 'aparece_en_grilla',      label: 'Visible en búsqueda de clientes' },
  { key: 'gestion_turnos',         label: 'Gestión de consultas y turnos' },
  { key: 'perfil_validado',        label: 'Perfil profesional validado' },
  { key: 'acceso_campus',          label: 'Acceso al campus multimedia' },
  { key: 'acceso_campus_completo', label: 'Campus completo + videoconferencias' },
  { key: 'networking',             label: 'Foro y networking profesional' },
  { key: 'credencial_virtual',     label: 'Credencial virtual' },
  { key: 'beneficios_exclusivos',  label: 'Descuentos y convenios exclusivos' },
  { key: 'difusion_profesional',   label: 'Difusión profesional destacada' },
];

export default function Planes() {
  const [planes,  setPlanes]  = useState([]);
  const [periodo, setPeriodo] = useState('mensual');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/pagos/planes')
      .then(r => setPlanes(r.data.planes || []))
      .catch(() => {
        // Fallback con datos por defecto
        setPlanes([
          {
            id: 1, nombre: 'Básico', slug: 'basico',
            precio_mensual: 4999, precio_anual: 49990,
            aparece_en_grilla: true, max_consultas_mes: 20,
            acceso_campus: false, acceso_campus_completo: false,
            gestion_turnos: true, perfil_validado: true,
            credencial_virtual: false, networking: false,
            beneficios_exclusivos: false, difusion_profesional: false,
          },
          {
            id: 2, nombre: 'Comunidad', slug: 'comunidad',
            precio_mensual: 9999, precio_anual: 99990,
            aparece_en_grilla: true, max_consultas_mes: null,
            acceso_campus: true, acceso_campus_completo: true,
            gestion_turnos: true, perfil_validado: true,
            credencial_virtual: true, networking: true,
            beneficios_exclusivos: true, difusion_profesional: true,
          },
        ]);
      })
      .finally(() => setCargando(false));
  }, []);

  const precio = (plan) => {
    if (plan.precio_mensual === 0) return 'Gratis';
    const p = periodo === 'anual' ? plan.precio_anual / 12 : plan.precio_mensual;
    return `$${Math.round(p).toLocaleString('es-AR')}`;
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>

      {/* Hero */}
      <div style={{ background: '#1C1B18' }} className="py-16 text-center">
        <p className="font-body text-sm font-medium uppercase tracking-widest mb-4"
          style={{ color: '#B86030' }}>
          Planes y precios
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Elegí el plan ideal
        </h1>
        <p className="font-body max-w-xl mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Sin costos ocultos. Sin permanencia mínima. Cancelá cuando quieras.
        </p>

        {/* Toggle mensual/anual */}
        <div
          className="inline-flex items-center gap-2 p-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          {['mensual', 'anual'].map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-body font-medium transition-all"
              style={periodo === p
                ? { background: '#fff', color: '#1C1B18' }
                : { color: 'rgba(255,255,255,0.6)' }
              }
            >
              {p === 'mensual' ? 'Mensual' : 'Anual'}
              {p === 'anual' && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(184,96,48,0.3)', color: '#C4522E' }}>
                  -20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de planes */}
      <div className="page-container py-16">
        {cargando ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[1,2].map(i => (
              <div key={i} className="card p-8 animate-pulse space-y-4">
                <div className="h-8 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                <div className="h-10 rounded w-1/2" style={{ background: '#E8E6E3' }} />
                <div className="space-y-2">
                  {[1,2,3,4,5].map(j => (
                    <div key={j} className="h-4 rounded" style={{ background: '#E8E6E3' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {planes.map((plan, idx) => {
              const esComunidad = plan.slug === 'comunidad';
              return (
                <div
                  key={plan.id}
                  className="card flex flex-col relative"
                  style={esComunidad ? { borderColor: '#2C2B27', borderWidth: '2px' } : {}}
                >
                  {esComunidad && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="text-white text-xs font-body font-medium px-4 py-1.5 rounded-full"
                        style={{ background: '#B86030' }}>
                        ★ Recomendado
                      </span>
                    </div>
                  )}

                  <div className="p-8 flex flex-col flex-1">
                    {/* Nombre y precio */}
                    <div className="mb-6">
                      <h2 className="font-display text-2xl font-bold mb-3" style={{ color: '#1C1B18' }}>
                        {plan.nombre}
                      </h2>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-4xl font-bold" style={{ color: '#1C1B18' }}>
                          {precio(plan)}
                        </span>
                        {plan.precio_mensual > 0 && (
                          <span className="font-body text-sm" style={{ color: '#8A8780' }}>/mes</span>
                        )}
                      </div>
                      {periodo === 'anual' && plan.precio_anual > 0 && (
                        <p className="font-body text-xs mt-1 font-medium" style={{ color: '#16a34a' }}>
                          ${Math.round(plan.precio_anual).toLocaleString('es-AR')}/año
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 flex-1 mb-8">
                      {FEATURES.map(({ key, label }) => (
                        <div key={key} className="flex items-start gap-3">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={plan[key]
                              ? { background: '#2C2B27' }
                              : { background: '#F0EFED' }
                            }
                          >
                            {plan[key]
                              ? <Check size={11} className="text-white" />
                              : <X size={11} style={{ color: '#D4D2CC' }} />
                            }
                          </div>
                          <span className="font-body text-sm"
                            style={{ color: plan[key] ? '#3A3832' : '#B0AEA8' }}>
                            {label}
                          </span>
                        </div>
                      ))}
                      {/* Consultas */}
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: '#2C2B27' }}>
                          <Check size={11} className="text-white" />
                        </div>
                        <span className="font-body text-sm" style={{ color: '#3A3832' }}>
                          {plan.max_consultas_mes === null
                            ? 'Consultas ilimitadas'
                            : `Hasta ${plan.max_consultas_mes} consultas/mes`
                          }
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      to={`/registro?rol=abogado&plan=${plan.slug}`}
                      className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-body font-medium text-sm text-white w-full transition-colors"
                      style={{ background: esComunidad ? '#B86030' : '#2C2B27' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = esComunidad ? '#8B4A1E' : '#1C1B18';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = esComunidad ? '#B86030' : '#2C2B27';
                      }}
                    >
                      Suscribirme a {plan.nombre} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ simple */}
        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="font-display text-2xl font-bold text-center mb-8" style={{ color: '#1C1B18' }}>
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {[
              { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. No hay permanencia mínima. Podés cancelar desde tu panel en cualquier momento.' },
              { q: '¿Cómo se procesan los pagos?', a: 'Los pagos se procesan de forma segura a través de MercadoPago. Aceptamos tarjetas de crédito y débito.' },
              { q: '¿Puedo cambiar de plan después?', a: 'Podés subir o bajar de plan en cualquier momento. El cambio se aplica al inicio del siguiente período.' },
              { q: '¿Hay período de prueba?', a: 'Podés registrarte con el plan Básico y evaluar la plataforma antes de pasar al plan Comunidad.' },
            ].map(({ q, a }) => (
              <div key={q} className="card p-6">
                <p className="font-body font-semibold text-sm mb-2" style={{ color: '#1C1B18' }}>{q}</p>
                <p className="font-body text-sm leading-relaxed" style={{ color: '#8A8780' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
