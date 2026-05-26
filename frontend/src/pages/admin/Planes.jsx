// ============================================================
// src/pages/admin/Planes.jsx — Paleta C: Gris carbón + Cobre
// Gestión de planes de suscripción desde el admin
// El admin puede editar precios, features y condiciones
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Check, X, Edit2, RefreshCw, Save,
  DollarSign, Users, Infinity, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Definición de features con label legible
// ─────────────────────────────────────────────────────────────
const FEATURES = [
  { key: 'aparece_en_grilla',      label: 'Visible en búsqueda de clientes',      grupo: 'Visibilidad' },
  { key: 'perfil_validado',        label: 'Sello de perfil verificado',            grupo: 'Visibilidad' },
  { key: 'difusion_profesional',   label: 'Difusión profesional destacada',        grupo: 'Visibilidad' },
  { key: 'gestion_turnos',         label: 'Gestión de consultas y turnos',         grupo: 'Funcionalidades' },
  { key: 'acceso_campus',          label: 'Acceso al campus multimedia',           grupo: 'Funcionalidades' },
  { key: 'acceso_campus_completo', label: 'Campus completo (cursos + videos)',     grupo: 'Funcionalidades' },
  { key: 'networking',             label: 'Foro y red profesional',                grupo: 'Comunidad' },
  { key: 'credencial_virtual',     label: 'Credencial virtual',                    grupo: 'Comunidad' },
  { key: 'beneficios_exclusivos',  label: 'Descuentos y convenios exclusivos',     grupo: 'Comunidad' },
];

const GRUPOS = ['Visibilidad', 'Funcionalidades', 'Comunidad'];

// ─────────────────────────────────────────────────────────────
// Componente: Toggle de feature
// ─────────────────────────────────────────────────────────────
function ToggleFeature({ activo, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!activo)}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-left"
      style={activo
        ? { background: 'rgba(44,43,39,0.06)' }
        : { background: '#FAFAF9' }
      }
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
        style={activo
          ? { background: '#2C2B27' }
          : { background: '#E8E6E3' }
        }
      >
        {activo
          ? <Check size={11} className="text-white" />
          : <X size={11} style={{ color: '#B0AEA8' }} />
        }
      </div>
      <span
        className="font-body text-sm"
        style={{ color: activo ? '#1C1B18' : '#8A8780' }}
      >
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de plan editable
// ─────────────────────────────────────────────────────────────
function TarjetaPlan({ plan: planOriginal, onGuardado }) {
  const [editando,  setEditando]  = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [plan,      setPlan]      = useState(planOriginal);

  // Sincronizar cuando cambia el plan original desde afuera
  useEffect(() => {
    if (!editando) setPlan(planOriginal);
  }, [planOriginal, editando]);

  const setField = (key, value) => setPlan(prev => ({ ...prev, [key]: value }));

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.put(`/admin/planes/${plan.id}`, {
        nombre:                 plan.nombre,
        precio_mensual:         parseFloat(plan.precio_mensual) || 0,
        precio_anual:           parseFloat(plan.precio_anual) || 0,
        max_consultas_mes:      plan.max_consultas_mes === '' ? null : plan.max_consultas_mes,
        aparece_en_grilla:      plan.aparece_en_grilla,
        perfil_validado:        plan.perfil_validado,
        difusion_profesional:   plan.difusion_profesional,
        gestion_turnos:         plan.gestion_turnos,
        acceso_campus:          plan.acceso_campus,
        acceso_campus_completo: plan.acceso_campus_completo,
        networking:             plan.networking,
        credencial_virtual:     plan.credencial_virtual,
        beneficios_exclusivos:  plan.beneficios_exclusivos,
        activo:                 plan.activo,
      });
      toast.success(`Plan "${plan.nombre}" actualizado correctamente.`);
      setEditando(false);
      onGuardado();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar el plan.');
    } finally {
      setGuardando(false);
    }
  };

  const cancelar = () => {
    setPlan(planOriginal);
    setEditando(false);
  };

  // Calcular descuento anual
  const descuentoPct = plan.precio_mensual > 0 && plan.precio_anual > 0
    ? Math.round((1 - (plan.precio_anual / 12) / plan.precio_mensual) * 100)
    : 0;

  return (
    <div
      className="card overflow-hidden"
      style={!plan.activo ? { opacity: 0.6 } : {}}
    >
      {/* ── Header del plan ─────────────────────────── */}
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ background: '#1C1B18' }}
      >
        <div>
          {editando ? (
            <input
              type="text"
              value={plan.nombre}
              onChange={e => setField('nombre', e.target.value)}
              className="font-display font-bold text-xl text-white bg-transparent border-b border-white/30 focus:border-white outline-none pb-1 w-48"
            />
          ) : (
            <h3 className="font-display font-bold text-xl text-white">{plan.nombre}</h3>
          )}
          <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            slug: {plan.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Badge activo */}
          {editando ? (
            <button
              type="button"
              onClick={() => setField('activo', !plan.activo)}
              className="text-xs font-body px-3 py-1.5 rounded-full transition-colors"
              style={plan.activo
                ? { background: 'rgba(22,163,74,0.2)', color: '#4ade80' }
                : { background: 'rgba(220,38,38,0.2)', color: '#f87171' }
              }
            >
              {plan.activo ? '● Activo' : '○ Inactivo'}
            </button>
          ) : (
            <span
              className="text-xs font-body px-3 py-1.5 rounded-full"
              style={plan.activo
                ? { background: 'rgba(22,163,74,0.2)', color: '#4ade80' }
                : { background: 'rgba(220,38,38,0.2)', color: '#f87171' }
              }
            >
              {plan.activo ? '● Activo' : '○ Inactivo'}
            </span>
          )}
          {/* Botón editar */}
          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            >
              <Edit2 size={12} /> Editar
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Precios ─────────────────────────────────── */}
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: '#8A8780' }}>
            Precios
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Precio mensual */}
            <div
              className="rounded-xl p-4"
              style={{ background: '#F7F6F4', border: '1px solid #E8E6E3' }}
            >
              <p className="font-body text-xs mb-1" style={{ color: '#8A8780' }}>
                Precio mensual
              </p>
              {editando ? (
                <div className="flex items-center gap-1">
                  <span className="font-body text-sm" style={{ color: '#56534A' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={plan.precio_mensual}
                    onChange={e => setField('precio_mensual', e.target.value)}
                    className="font-display font-bold text-2xl bg-transparent outline-none w-full"
                    style={{ color: '#1C1B18' }}
                  />
                </div>
              ) : (
                <p className="font-display font-bold text-2xl" style={{ color: '#1C1B18' }}>
                  {plan.precio_mensual === 0 ? 'Gratis' : `$${parseFloat(plan.precio_mensual).toLocaleString('es-AR')}`}
                </p>
              )}
              {plan.precio_mensual > 0 && (
                <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>/ mes</p>
              )}
            </div>

            {/* Precio anual */}
            <div
              className="rounded-xl p-4 relative"
              style={{ background: '#F7F6F4', border: '1px solid #E8E6E3' }}
            >
              {descuentoPct > 0 && !editando && (
                <span
                  className="absolute -top-2 -right-2 text-xs font-body font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ background: '#B86030' }}
                >
                  -{descuentoPct}%
                </span>
              )}
              <p className="font-body text-xs mb-1" style={{ color: '#8A8780' }}>
                Precio anual
              </p>
              {editando ? (
                <div className="flex items-center gap-1">
                  <span className="font-body text-sm" style={{ color: '#56534A' }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={plan.precio_anual}
                    onChange={e => setField('precio_anual', e.target.value)}
                    className="font-display font-bold text-2xl bg-transparent outline-none w-full"
                    style={{ color: '#1C1B18' }}
                  />
                </div>
              ) : (
                <p className="font-display font-bold text-2xl" style={{ color: '#1C1B18' }}>
                  {plan.precio_anual === 0 ? '—' : `$${parseFloat(plan.precio_anual).toLocaleString('es-AR')}`}
                </p>
              )}
              {plan.precio_anual > 0 && (
                <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>/ año</p>
              )}
            </div>
          </div>

          {/* Equivalente mensual con plan anual */}
          {plan.precio_anual > 0 && plan.precio_mensual > 0 && (
            <p className="font-body text-xs mt-2 text-center" style={{ color: '#8A8780' }}>
              Con plan anual: ${Math.round(parseFloat(plan.precio_anual) / 12).toLocaleString('es-AR')}/mes
              {descuentoPct > 0 && ` (${descuentoPct}% de ahorro)`}
            </p>
          )}
        </div>

        {/* ── Límite de consultas ──────────────────────── */}
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: '#8A8780' }}>
            Consultas por mes
          </p>
          {editando ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                placeholder="Número o vacío para ilimitado"
                value={plan.max_consultas_mes ?? ''}
                onChange={e => setField('max_consultas_mes', e.target.value === '' ? null : parseInt(e.target.value))}
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={() => setField('max_consultas_mes', null)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-body text-sm border transition-colors shrink-0"
                style={plan.max_consultas_mes === null
                  ? { background: '#2C2B27', color: '#fff', borderColor: '#2C2B27' }
                  : { borderColor: '#E8E6E3', color: '#56534A' }
                }
              >
                <Infinity size={14} /> Ilimitado
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#F7F6F4' }}
            >
              <Users size={16} style={{ color: '#B86030' }} />
              <span className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
                {plan.max_consultas_mes === null
                  ? 'Ilimitadas'
                  : `${plan.max_consultas_mes} consultas / mes`
                }
              </span>
            </div>
          )}
        </div>

        {/* ── Features por grupo ───────────────────────── */}
        {GRUPOS.map(grupo => {
          const featuresGrupo = FEATURES.filter(f => f.grupo === grupo);
          return (
            <div key={grupo}>
              <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: '#8A8780' }}>
                {grupo}
              </p>
              <div className="space-y-1">
                {featuresGrupo.map(({ key, label }) => (
                  editando ? (
                    <ToggleFeature
                      key={key}
                      activo={!!plan[key]}
                      onChange={val => setField(key, val)}
                      label={label}
                    />
                  ) : (
                    <div key={key} className="flex items-center gap-3 px-3 py-2">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={plan[key]
                          ? { background: '#2C2B27' }
                          : { background: '#F0EFED' }
                        }
                      >
                        {plan[key]
                          ? <Check size={9} className="text-white" />
                          : <X size={9} style={{ color: '#D4D2CC' }} />
                        }
                      </div>
                      <span
                        className="font-body text-sm"
                        style={{ color: plan[key] ? '#1C1B18' : '#B0AEA8' }}
                      >
                        {label}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          );
        })}

        {/* ── Botones de acción ────────────────────────── */}
        {editando && (
          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: '#F0EFED' }}>
            <button onClick={cancelar} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="btn-primary flex-1"
            >
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : <><Save size={15} /> Guardar cambios</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function AdminPlanes() {
  const [planes,   setPlanes]   = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/planes');
      setPlanes(data.planes || []);
    } catch {
      toast.error('No se pudieron cargar los planes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de planes</h1>
            <p className="section-subtitle">
              Editá precios, funcionalidades y condiciones de cada plan de suscripción.
            </p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Aviso importante */}
        <div
          className="rounded-2xl p-4 mb-8 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <AlertCircle size={18} style={{ color: '#b45309' }} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-body font-semibold text-sm" style={{ color: '#92400e' }}>
              Los cambios de precio aplican a nuevas suscripciones
            </p>
            <p className="font-body text-xs mt-0.5 leading-relaxed" style={{ color: '#b45309' }}>
              Los abogados con suscripción activa mantienen las condiciones de su plan hasta el próximo período de renovación.
            </p>
          </div>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-20 rounded-t-2xl" style={{ background: '#E8E6E3' }} />
                <div className="p-6 space-y-4">
                  <div className="h-16 rounded-xl" style={{ background: '#E8E6E3' }} />
                  <div className="space-y-2">
                    {[1,2,3,4].map(j => (
                      <div key={j} className="h-8 rounded-xl" style={{ background: '#E8E6E3' }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid de planes */}
        {!cargando && planes.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planes.map(plan => (
              <TarjetaPlan
                key={plan.id}
                plan={plan}
                onGuardado={cargar}
              />
            ))}
          </div>
        )}

        {/* Info de slugs */}
        {!cargando && (
          <div className="mt-8 card p-5">
            <p className="font-body font-semibold text-sm mb-3" style={{ color: '#1C1B18' }}>
              Nota técnica — Slugs de plan
            </p>
            <p className="font-body text-xs leading-relaxed" style={{ color: '#8A8780' }}>
              Los <strong>slugs</strong> identifican los planes en el código y no pueden modificarse desde acá. Si necesitás crear un plan nuevo o cambiar el slug, hacelo directamente en la base de datos.
              Los slugs actuales son: <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">gratuito</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">basico</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">premium</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
