// ============================================================
// src/pages/abogado/Suscripcion.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Crown, ArrowRight, CreditCard, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const FEATURES = [
  { key: 'aparece_en_grilla',      label: 'Visible en búsqueda' },
  { key: 'gestion_turnos',         label: 'Gestión de consultas' },
  { key: 'perfil_validado',        label: 'Perfil validado' },
  { key: 'acceso_campus',          label: 'Acceso al campus' },
  { key: 'acceso_campus_completo', label: 'Campus completo' },
  { key: 'networking',             label: 'Foro y networking' },
  { key: 'credencial_virtual',     label: 'Credencial virtual' },
  { key: 'beneficios_exclusivos',  label: 'Beneficios exclusivos' },
];

export default function Suscripcion() {
  const { usuario }               = useAuth();
  const perfil                    = usuario?.perfil_abogado;
  const [planes,     setPlanes]   = useState([]);
  const [historial,  setHistorial] = useState([]);
  const [periodo,    setPeriodo]  = useState('mensual');
  const [cargando,   setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/pagos/planes'), api.get('/pagos/historial')])
      .then(([p, h]) => { setPlanes(p.data.planes); setHistorial(h.data.pagos); })
      .catch(() => toast.error('Error al cargar la suscripción.'))
      .finally(() => setCargando(false));
  }, []);

  const suscribirse = async (planSlug) => {
    setProcesando(planSlug);
    try {
      const { data } = await api.post('/pagos/crear-preferencia', { plan_slug: planSlug, periodo });
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al procesar el pago.');
      setProcesando(null);
    }
  };

  const precio = (plan) => {
    if (plan.precio_mensual === 0) return 'Gratis';
    const p = periodo === 'anual' ? plan.precio_anual / 12 : plan.precio_mensual;
    return `$${Math.round(p).toLocaleString('es-AR')}`;
  };

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0EFED' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#2C2B27', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="mb-8">
          <h1 className="section-title">Mi suscripción</h1>
          <p className="section-subtitle">Gestioná tu plan y accedé a todas las funcionalidades.</p>
        </div>

        {/* Estado actual */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: perfil?.plan_slug === 'comunidad' ? 'rgba(184,96,48,0.1)' : '#F0EFED' }}>
                <Crown size={24} style={{ color: perfil?.plan_slug === 'comunidad' ? '#B86030' : '#56534A' }} />
              </div>
              <div>
                <p className="font-body text-sm" style={{ color: '#8A8780' }}>Plan actual</p>
                <p className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>
                  {perfil?.plan_nombre || 'Básico'}
                </p>
                {perfil?.suscripcion_fin && (
                  <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>
                    {perfil.suscripcion_activa ? 'Vence el' : 'Venció el'}{' '}
                    {format(new Date(perfil.suscripcion_fin), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                )}
              </div>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium"
              style={perfil?.suscripcion_activa
                ? { background: 'rgba(22,163,74,0.08)', color: '#16a34a' }
                : { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }
              }
            >
              <div className="w-2 h-2 rounded-full"
                style={{ background: perfil?.suscripcion_activa ? '#16a34a' : '#dc2626' }} />
              {perfil?.suscripcion_activa ? 'Activa' : 'Inactiva'}
            </div>
          </div>

          {/* Alerta vencimiento */}
          {perfil?.suscripcion_fin &&
            new Date(perfil.suscripcion_fin) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
            <div className="mt-4 flex items-center gap-3 rounded-xl p-4"
              style={{ background: 'rgba(184,96,48,0.08)', border: '1px solid rgba(184,96,48,0.2)' }}>
              <AlertCircle size={16} style={{ color: '#B86030' }} className="shrink-0" />
              <p className="font-body text-sm" style={{ color: '#56534A' }}>
                {perfil.suscripcion_activa
                  ? 'Tu suscripción vence pronto. Renovála para mantener el acceso.'
                  : 'Tu suscripción venció. Renovála para recuperar el acceso.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Toggle mensual/anual */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full border"
            style={{ background: '#fff', borderColor: '#E8E6E3' }}>
            {['mensual', 'anual'].map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className="px-5 py-2 rounded-full text-sm font-body font-medium transition-all flex items-center gap-2"
                style={periodo === p
                  ? { background: '#2C2B27', color: '#fff' }
                  : { color: '#56534A' }
                }
              >
                {p === 'mensual' ? 'Mensual' : 'Anual'}
                {p === 'anual' && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={periodo === 'anual'
                      ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                      : { background: 'rgba(22,163,74,0.1)', color: '#16a34a' }
                    }>
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Planes */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {planes.map(plan => {
            const esPlanActual = perfil?.plan_slug === plan.slug;
            const esComunidad  = plan.slug === 'comunidad';

            return (
              <div
                key={plan.id}
                className="card flex flex-col relative"
                style={esPlanActual
                  ? { border: '2px solid #B86030', boxShadow: '0 0 0 4px rgba(184,96,48,0.08)' }
                  : esComunidad ? { border: '2px solid #2C2B27' } : {}
                }
              >
                {esPlanActual && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="text-white text-xs font-body font-medium px-3 py-1 rounded-full"
                      style={{ background: '#B86030' }}>
                      Plan actual
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-6">
                    <h3 className="font-display font-bold text-xl mb-3" style={{ color: '#1C1B18' }}>
                      {plan.nombre}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-bold" style={{ color: '#1C1B18' }}>
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
                  <div className="space-y-2.5 flex-1 mb-6">
                    {FEATURES.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={plan[key] ? { background: '#2C2B27' } : { background: '#F0EFED' }}>
                          {plan[key]
                            ? <Check size={10} className="text-white" />
                            : <X size={10} style={{ color: '#D4D2CC' }} />
                          }
                        </div>
                        <span className="font-body text-xs" style={{ color: plan[key] ? '#3A3832' : '#B0AEA8' }}>
                          {label}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: '#2C2B27' }}>
                        <Check size={10} className="text-white" />
                      </div>
                      <span className="font-body text-xs" style={{ color: '#3A3832' }}>
                        {plan.max_consultas_mes === null ? 'Consultas ilimitadas' : `Hasta ${plan.max_consultas_mes} consultas/mes`}
                      </span>
                    </div>
                  </div>

                  {/* Botón */}
                  {esPlanActual ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl font-body text-sm"
                      style={{ background: '#F7F6F4', color: '#8A8780' }}>
                      <Check size={14} /> Plan activo
                    </div>
                  ) : (
                    <button
                      onClick={() => suscribirse(plan.slug)}
                      disabled={!!procesando}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm text-white transition-colors disabled:opacity-50"
                      style={{ background: esComunidad ? '#B86030' : '#2C2B27' }}
                      onMouseEnter={e => { e.currentTarget.style.background = esComunidad ? '#8B4A1E' : '#1C1B18'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = esComunidad ? '#B86030' : '#2C2B27'; }}
                    >
                      {procesando === plan.slug
                        ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando...</>
                        : <>Cambiar a {plan.nombre} <ArrowRight size={14} /></>
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Historial de pagos */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-lg mb-5 flex items-center gap-2" style={{ color: '#1C1B18' }}>
            <CreditCard size={18} style={{ color: '#B86030' }} /> Historial de pagos
          </h2>

          {historial.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard size={32} className="mx-auto mb-3" style={{ color: '#D4D2CC' }} />
              <p className="font-body text-sm" style={{ color: '#8A8780' }}>No hay pagos registrados.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
              {historial.map(pago => (
                <div key={pago.id} className="flex items-center justify-between py-4 gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={pago.mp_status === 'approved'
                        ? { background: 'rgba(22,163,74,0.08)' }
                        : { background: 'rgba(220,38,38,0.08)' }
                      }>
                      {pago.mp_status === 'approved'
                        ? <Check size={16} style={{ color: '#16a34a' }} />
                        : <X size={16} style={{ color: '#dc2626' }} />
                      }
                    </div>
                    <div>
                      <p className="font-body font-medium text-sm" style={{ color: '#1C1B18' }}>
                        {pago.plan_nombre} · {pago.periodo === 'anual' ? 'Anual' : 'Mensual'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar size={11} style={{ color: '#8A8780' }} />
                        <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                          {format(new Date(pago.creado_en), "d 'de' MMMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-body font-semibold" style={{ color: '#1C1B18' }}>
                      ${parseFloat(pago.monto).toLocaleString('es-AR')}
                    </p>
                    <span className="font-body text-xs"
                      style={{ color: pago.mp_status === 'approved' ? '#16a34a' : '#dc2626' }}>
                      {pago.mp_status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 mt-6 px-2">
          <RefreshCw size={14} style={{ color: '#B0AEA8' }} className="shrink-0 mt-0.5" />
          <p className="font-body text-xs leading-relaxed" style={{ color: '#B0AEA8' }}>
            Los pagos se procesan de forma segura a través de MercadoPago. Podés cancelar tu suscripción en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  );
}
