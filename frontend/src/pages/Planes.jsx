// ============================================================
// src/pages/Planes.jsx
// Página pública de planes con comparativa y precios
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Star, ArrowRight, Award } from 'lucide-react';
import api from '../services/api';

// Íconos y descripciones para cada feature del plan
const FEATURES = [
  { key: 'aparece_en_grilla',       label: 'Visible en búsqueda de clientes' },
  { key: 'gestion_turnos',          label: 'Gestión de consultas y turnos' },
  { key: 'perfil_validado',         label: 'Perfil profesional validado' },
  { key: 'acceso_campus',           label: 'Campus multimedia (cursos, biblioteca)' },
  { key: 'acceso_campus_completo',  label: 'Campus completo + videoconferencias' },
  { key: 'networking',              label: 'Networking profesional' },
  { key: 'credencial_virtual',      label: 'Credencial virtual exclusiva' },
  { key: 'beneficios_exclusivos',   label: 'Descuentos en librerías, coworkings y más' },
  { key: 'difusion_profesional',    label: 'Difusión profesional destacada' },
];

export default function Planes() {
  const [planes,   setPlanes]   = useState([]);
  const [periodo,  setPeriodo]  = useState('mensual'); // 'mensual' | 'anual'
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/pagos/planes')
      .then(r => setPlanes(r.data.planes))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const precio = (plan) => {
    if (plan.precio_mensual === 0) return 'Gratis';
    const p = periodo === 'anual' ? plan.precio_anual / 12 : plan.precio_mensual;
    return `$${Math.round(p).toLocaleString('es-AR')}`;
  };

  const ahorroAnual = (plan) => {
    if (!plan.precio_anual || !plan.precio_mensual) return 0;
    const sinDescuento = plan.precio_mensual * 12;
    return Math.round(((sinDescuento - plan.precio_anual) / sinDescuento) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ────────────────────────────────────────── */}
      <section className="bg-navy-900 text-white py-16">
        <div className="page-container text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Planes para <span className="text-gradient-gold">profesionales</span>
          </h1>
          <p className="font-body text-white/60 text-lg max-w-xl mx-auto mb-8">
            Elegí el plan que mejor se adapta a tu práctica. Sin costos ocultos. Cancelá cuando quieras.
          </p>

          {/* Toggle mensual/anual */}
          <div className="inline-flex items-center gap-3 bg-white/10 rounded-full p-1.5">
            <button
              onClick={() => setPeriodo('mensual')}
              className={`px-6 py-2 rounded-full text-sm font-body font-medium transition-all ${
                periodo === 'mensual' ? 'bg-white text-navy-900' : 'text-white/70 hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setPeriodo('anual')}
              className={`px-6 py-2 rounded-full text-sm font-body font-medium transition-all flex items-center gap-2 ${
                periodo === 'anual' ? 'bg-white text-navy-900' : 'text-white/70 hover:text-white'
              }`}
            >
              Anual
              <span className="text-xs bg-gold-500 text-white px-2 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Tarjetas de planes ────────────────────────────── */}
      <section className="page-container py-16">

        {cargando ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="card p-8 h-96 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-10 bg-slate-200 rounded w-1/2 mb-8" />
                <div className="space-y-3">
                  {[1,2,3,4].map(j => <div key={j} className="h-4 bg-slate-200 rounded" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {planes.map((plan) => {
              const esPremium  = plan.slug === 'premium';
              const esGratuito = plan.slug === 'gratuito';
              const ahorro     = ahorroAnual(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative card flex flex-col ${
                    esPremium
                      ? 'border-2 border-navy-900 shadow-card-hover'
                      : ''
                  }`}
                >
                  {/* Badge "Más popular" */}
                  {esPremium && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1.5 bg-navy-900 text-white px-4 py-1.5 rounded-full text-xs font-body font-medium">
                        <Star size={11} className="fill-gold-400 text-gold-400" />
                        Más popular
                      </div>
                    </div>
                  )}

                  <div className="p-8 flex flex-col flex-1">

                    {/* Nombre del plan */}
                    <div className="mb-6">
                      <span className={`text-xs font-body font-medium uppercase tracking-wider ${
                        esPremium ? 'text-gold-500' : 'text-slate-400'
                      }`}>
                        Plan
                      </span>
                      <h2 className="font-display text-2xl font-bold text-navy-900 mt-1">{plan.nombre}</h2>
                    </div>

                    {/* Precio */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-4xl font-bold text-navy-900">
                          {precio(plan)}
                        </span>
                        {plan.precio_mensual > 0 && (
                          <span className="font-body text-slate-400 text-sm">/mes</span>
                        )}
                      </div>
                      {periodo === 'anual' && ahorro > 0 && (
                        <p className="font-body text-xs text-green-600 mt-1 font-medium">
                          Ahorrás {ahorro}% vs mensual
                        </p>
                      )}
                      {esGratuito && (
                        <p className="font-body text-xs text-slate-400 mt-1">Para siempre</p>
                      )}
                    </div>

                    {/* Funcionalidades */}
                    <div className="space-y-3 flex-1 mb-8">
                      {FEATURES.map(({ key, label }) => {
                        const incluido = plan[key];
                        return (
                          <div key={key} className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              incluido ? 'bg-navy-900' : 'bg-slate-100'
                            }`}>
                              {incluido
                                ? <Check size={11} className="text-white" />
                                : <X size={11} className="text-slate-300" />
                              }
                            </div>
                            <span className={`font-body text-sm ${incluido ? 'text-slate-700' : 'text-slate-400'}`}>
                              {label}
                            </span>
                          </div>
                        );
                      })}

                      {/* Max consultas */}
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-navy-900 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} className="text-white" />
                        </div>
                        <span className="font-body text-sm text-slate-700">
                          {plan.max_consultas_mes === null
                            ? 'Consultas ilimitadas'
                            : `Hasta ${plan.max_consultas_mes} consultas por mes`
                          }
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      to={esGratuito ? '/registro?rol=abogado' : `/registro?rol=abogado&plan=${plan.slug}`}
                      className={esPremium ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}
                    >
                      {esGratuito ? 'Comenzar gratis' : `Elegir plan ${plan.nombre}`}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ o info adicional */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-slate-500 font-body text-sm">
            <Award size={16} className="text-gold-500" />
            Todos los planes incluyen soporte por email · Sin permanencia mínima · Pagos seguros con MercadoPago
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────── */}
      <section className="bg-white border-t border-slate-100 py-16">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold text-navy-900 mb-3">
            ¿Tenés dudas sobre qué plan elegir?
          </h2>
          <p className="font-body text-slate-500 mb-6">
            Empezá con el plan gratuito y escalá cuando lo necesites.
          </p>
          <Link to="/registro?rol=abogado" className="btn-primary px-8 py-3.5">
            Empezar gratis <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
