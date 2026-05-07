// ============================================================
// src/pages/abogado/Suscripcion.jsx
// Gestión de la suscripción del abogado
// Muestra el plan actual, permite cambiar de plan y ver historial
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Check, X, Crown, ArrowRight,
  CreditCard, Calendar, AlertCircle, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Funcionalidades que aparecen en la comparativa de planes
const FEATURES = [
  { key: 'aparece_en_grilla',       label: 'Visible en búsqueda de clientes' },
  { key: 'gestion_turnos',          label: 'Gestión de consultas y turnos' },
  { key: 'perfil_validado',         label: 'Perfil profesional validado' },
  { key: 'acceso_campus',           label: 'Campus multimedia básico' },
  { key: 'acceso_campus_completo',  label: 'Campus completo + videoconferencias' },
  { key: 'networking',              label: 'Networking profesional' },
  { key: 'credencial_virtual',      label: 'Credencial virtual' },
  { key: 'beneficios_exclusivos',   label: 'Descuentos y convenios exclusivos' },
  { key: 'difusion_profesional',    label: 'Difusión profesional destacada' },
];

export default function Suscripcion() {
  const { usuario }           = useAuth();
  const perfil                = usuario?.perfil_abogado;

  const [planes,    setPlanes]    = useState([]);
  const [historial, setHistorial] = useState([]);
  const [periodo,   setPeriodo]   = useState('mensual');
  const [cargando,  setCargando]  = useState(true);
  const [procesando, setProcesando] = useState(null); // ID del plan en proceso

  // Cargar planes y historial de pagos
  useEffect(() => {
    Promise.all([
      api.get('/pagos/planes'),
      api.get('/pagos/historial'),
    ])
      .then(([planesRes, historialRes]) => {
        setPlanes(planesRes.data.planes);
        setHistorial(historialRes.data.pagos);
      })
      .catch(() => toast.error('Error al cargar la información de suscripción.'))
      .finally(() => setCargando(false));
  }, []);

  // Iniciar proceso de pago con MercadoPago
  const suscribirse = async (planSlug) => {
    if (planSlug === 'gratuito') return;
    setProcesando(planSlug);
    try {
      const { data } = await api.post('/pagos/crear-preferencia', {
        plan_slug: planSlug,
        periodo,
      });
      // Redirigir al checkout de MercadoPago
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

  // ── Estado de carga ─────────────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="section-title">Mi suscripción</h1>
          <p className="section-subtitle">
            Gestioná tu plan y accedé a todas las funcionalidades de Conexión Legal.
          </p>
        </div>

        {/* ── Estado actual de la suscripción ──────────────── */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Ícono del plan */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                perfil?.plan_slug === 'premium' ? 'bg-gold-300/20' : 'bg-navy-50'
              }`}>
                <Crown size={24} className={
                  perfil?.plan_slug === 'premium' ? 'text-gold-500' : 'text-navy-700'
                } />
              </div>

              <div>
                <p className="font-body text-sm text-slate-500">Plan actual</p>
                <p className="font-display font-bold text-navy-900 text-xl">
                  {perfil?.plan_nombre || 'Gratuito'}
                </p>
                {/* Fecha de vencimiento */}
                {perfil?.suscripcion_fin && (
                  <p className="font-body text-xs text-slate-400 mt-0.5">
                    {perfil.suscripcion_activa ? 'Vence el' : 'Venció el'}{' '}
                    {format(new Date(perfil.suscripcion_fin), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                )}
              </div>
            </div>

            {/* Indicador de estado */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium ${
              perfil?.suscripcion_activa
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                perfil?.suscripcion_activa ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {perfil?.suscripcion_activa ? 'Activa' : 'Inactiva'}
            </div>
          </div>

          {/* Alerta si vence pronto o ya venció */}
          {perfil?.suscripcion_fin && new Date(perfil.suscripcion_fin) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
            <div className="mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <p className="font-body text-sm text-amber-700">
                {perfil.suscripcion_activa
                  ? 'Tu suscripción vence pronto. Renovála para no perder el acceso.'
                  : 'Tu suscripción venció. Renovála para recuperar el acceso a todas las funciones.'
                }
              </p>
            </div>
          )}
        </div>

        {/* ── Toggle mensual/anual ─────────────────────────── */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full p-1.5">
            <button
              onClick={() => setPeriodo('mensual')}
              className={`px-5 py-2 rounded-full text-sm font-body font-medium transition-all ${
                periodo === 'mensual' ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setPeriodo('anual')}
              className={`px-5 py-2 rounded-full text-sm font-body font-medium transition-all flex items-center gap-2 ${
                periodo === 'anual' ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Anual
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">-20%</span>
            </button>
          </div>
        </div>

        {/* ── Comparativa de planes ────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {planes.map(plan => {
            const esPlanActual = perfil?.plan_slug === plan.slug;
            const esPremium    = plan.slug === 'premium';
            const esGratuito   = plan.slug === 'gratuito';

            return (
              <div
                key={plan.id}
                className={`relative card flex flex-col ${
                  esPremium ? 'border-2 border-navy-900' : ''
                } ${esPlanActual ? 'ring-2 ring-gold-400 ring-offset-2' : ''}`}
              >
                {/* Badge "Tu plan actual" */}
                {esPlanActual && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gold-500 text-white text-xs font-body font-medium px-3 py-1 rounded-full">
                      Plan actual
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Nombre y precio */}
                  <div className="mb-6">
                    <h3 className="font-display font-bold text-navy-900 text-xl mb-3">
                      {plan.nombre}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-bold text-navy-900">
                        {precio(plan)}
                      </span>
                      {plan.precio_mensual > 0 && (
                        <span className="font-body text-slate-400 text-sm">/mes</span>
                      )}
                    </div>
                    {periodo === 'anual' && plan.precio_anual > 0 && (
                      <p className="font-body text-xs text-green-600 mt-1 font-medium">
                        ${Math.round(plan.precio_anual).toLocaleString('es-AR')}/año
                      </p>
                    )}
                  </div>

                  {/* Lista de funcionalidades */}
                  <div className="space-y-2.5 flex-1 mb-6">
                    {FEATURES.map(({ key, label }) => (
                      <div key={key} className="flex items-start gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan[key] ? 'bg-navy-900' : 'bg-slate-100'
                        }`}>
                          {plan[key]
                            ? <Check size={10} className="text-white" />
                            : <X size={10} className="text-slate-300" />
                          }
                        </div>
                        <span className={`font-body text-xs ${plan[key] ? 'text-slate-700' : 'text-slate-400'}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                    {/* Límite de consultas */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-navy-900 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={10} className="text-white" />
                      </div>
                      <span className="font-body text-xs text-slate-700">
                        {plan.max_consultas_mes === null
                          ? 'Consultas ilimitadas'
                          : `Hasta ${plan.max_consultas_mes} consultas/mes`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Botón de acción */}
                  {esPlanActual ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-slate-400 font-body text-sm">
                      <Check size={14} /> Plan activo
                    </div>
                  ) : esGratuito ? (
                    <div className="text-center py-3 font-body text-sm text-slate-400">
                      Plan sin costo
                    </div>
                  ) : (
                    <button
                      onClick={() => suscribirse(plan.slug)}
                      disabled={!!procesando}
                      className={`w-full justify-center ${esPremium ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {procesando === plan.slug
                        ? <><div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" /> Procesando...</>
                        : <>{perfil?.plan_slug === 'gratuito' ? 'Suscribirme' : 'Cambiar a'} {plan.nombre} <ArrowRight size={14} /></>
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Historial de pagos ───────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-navy-900 text-lg mb-5 flex items-center gap-2">
            <CreditCard size={18} /> Historial de pagos
          </h2>

          {historial.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="font-body text-slate-400 text-sm">
                No hay pagos registrados aún.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historial.map(pago => (
                <div key={pago.id} className="flex items-center justify-between py-4 gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {/* Ícono de estado */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      pago.mp_status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {pago.mp_status === 'approved'
                        ? <Check size={16} className="text-green-600" />
                        : <X size={16} className="text-red-500" />
                      }
                    </div>

                    <div>
                      <p className="font-body font-medium text-navy-900 text-sm">
                        {pago.plan_nombre} · {pago.periodo === 'anual' ? 'Anual' : 'Mensual'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar size={11} className="text-slate-400" />
                        <span className="font-body text-xs text-slate-400">
                          {format(new Date(pago.creado_en), "d 'de' MMMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monto */}
                  <div className="text-right">
                    <p className="font-body font-semibold text-navy-900">
                      ${parseFloat(pago.monto).toLocaleString('es-AR')} {pago.moneda}
                    </p>
                    <span className={`font-body text-xs ${
                      pago.mp_status === 'approved' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {pago.mp_status === 'approved' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Nota sobre pagos ─────────────────────────────── */}
        <div className="flex items-start gap-3 mt-6 px-2">
          <RefreshCw size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="font-body text-xs text-slate-400 leading-relaxed">
            Los pagos se procesan de forma segura a través de MercadoPago. Podés cancelar tu suscripción en cualquier momento desde esta sección o contactando al soporte.
          </p>
        </div>
      </div>
    </div>
  );
}
