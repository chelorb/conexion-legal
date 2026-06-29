// ============================================================
// src/pages/admin/Planes.jsx — Paleta C
// Gestión completa: crear/editar/borrar planes + features custom
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Check, X, Save,
  RefreshCw, AlertCircle, Users, Infinity,
  ChevronDown, ChevronUp, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const FEATURES_BASE = [
  { key: 'aparece_en_grilla',      label: 'Visible en búsqueda de clientes',  grupo: 'Visibilidad'     },
  { key: 'perfil_validado',        label: 'Sello de perfil verificado',        grupo: 'Visibilidad'     },
  { key: 'difusion_profesional',   label: 'Difusión profesional destacada',    grupo: 'Visibilidad'     },
  { key: 'gestion_turnos',         label: 'Gestión de consultas y turnos',     grupo: 'Funcionalidades' },
  { key: 'acceso_campus',          label: 'Acceso al campus multimedia',       grupo: 'Funcionalidades' },
  { key: 'acceso_campus_completo', label: 'Campus completo (cursos + videos)', grupo: 'Funcionalidades' },
  { key: 'networking',             label: 'Foro y red profesional',            grupo: 'Comunidad'       },
  { key: 'credencial_virtual',     label: 'Credencial virtual',                grupo: 'Comunidad'       },
  { key: 'beneficios_exclusivos',  label: 'Descuentos y convenios exclusivos', grupo: 'Comunidad'       },
];
const GRUPOS = ['Visibilidad', 'Funcionalidades', 'Comunidad'];

// ── Toggle feature base ──────────────────────────────────────
function Toggle({ activo, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!activo)}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-left"
      style={activo ? { background: 'rgba(44,43,39,0.06)' } : { background: '#FAFAF9' }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={activo ? { background: '#2C2B27' } : { background: '#E8E6E3' }}>
        {activo ? <Check size={10} className="text-white" /> : <X size={10} style={{ color: '#B0AEA8' }} />}
      </div>
      <span className="font-body text-sm" style={{ color: activo ? '#1C1B18' : '#8A8780' }}>{label}</span>
    </button>
  );
}

// ── Modal: crear nuevo plan ──────────────────────────────────
function ModalNuevoPlan({ onCerrar, onCreado }) {
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: '', slug: '',
    precio_mensual: '', precio_anual: '',
    max_consultas_mes: '',
    aparece_en_grilla: true, gestion_turnos: true, perfil_validado: true,
    acceso_campus: false, acceso_campus_completo: false,
    credencial_virtual: false, networking: false,
    beneficios_exclusivos: false, difusion_profesional: false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto-generar slug desde el nombre
  const handleNombre = (val) => {
    set('nombre', val);
    set('slug', val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.slug) { toast.error('Nombre y slug son obligatorios.'); return; }
    setGuardando(true);
    try {
      await api.post('/admin/planes-gestion', {
        ...form,
        precio_mensual: parseFloat(form.precio_mensual) || 0,
        precio_anual: parseFloat(form.precio_anual) || 0,
        max_consultas_mes: form.max_consultas_mes === '' ? null : parseInt(form.max_consultas_mes),
      });
      toast.success(`Plan "${form.nombre}" creado.`);
      onCreado();
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear el plan.');
    } finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-2xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>Nuevo plan</h3>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Nombre del plan *</label>
              <input type="text" placeholder="Ej: Exclusivo" className="input-field"
                value={form.nombre} onChange={e => handleNombre(e.target.value)} required />
            </div>
            <div>
              <label className="input-label">Slug (identificador) *</label>
              <input type="text" placeholder="exclusivo" className="input-field"
                value={form.slug} onChange={e => set('slug', e.target.value)} required />
              <p className="font-body text-xs mt-1" style={{ color: '#8A8780' }}>Solo letras, números y guiones</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Precio mensual ($)</label>
              <input type="number" min="0" step="1" placeholder="0" className="input-field"
                value={form.precio_mensual} onChange={e => set('precio_mensual', e.target.value)} />
            </div>
            <div>
              <label className="input-label">Precio anual ($) <span className="font-normal" style={{ color: '#8A8780' }}>(total)</span></label>
              <input type="number" min="0" step="1" placeholder="0" className="input-field"
                value={form.precio_anual} onChange={e => set('precio_anual', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="input-label">Consultas por mes <span className="font-normal" style={{ color: '#8A8780' }}>(vacío = ilimitado)</span></label>
            <input type="number" min="1" placeholder="Ej: 20" className="input-field"
              value={form.max_consultas_mes} onChange={e => set('max_consultas_mes', e.target.value)} />
          </div>

          <div>
            <p className="input-label mb-3">Funcionalidades incluidas</p>
            {GRUPOS.map(grupo => (
              <div key={grupo} className="mb-4">
                <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8A8780' }}>{grupo}</p>
                <div className="space-y-1">
                  {FEATURES_BASE.filter(f => f.grupo === grupo).map(({ key, label }) => (
                    <Toggle key={key} activo={!!form[key]} onChange={v => set(key, v)} label={label} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creando...</>
                : <><Plus size={15} /> Crear plan</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tarjeta de plan ──────────────────────────────────────────
function TarjetaPlan({ plan: planOrig, onActualizar }) {
  const [plan,       setPlan]       = useState(planOrig);
  const [editando,   setEditando]   = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [expandido,  setExpandido]  = useState(false);
  const [nuevaFunc,  setNuevaFunc]  = useState('');
  const [nuevoIcono, setNuevoIcono] = useState('✓');
  const [agregando,  setAgregando]  = useState(false);

  useEffect(() => { if (!editando) setPlan(planOrig); }, [planOrig, editando]);

  const set = (k, v) => setPlan(p => ({ ...p, [k]: v }));

  const guardar = async () => {
    setGuardando(true);
    try {
      const { data } = await api.put(`/admin/planes-gestion/${plan.id}`, {
        nombre: plan.nombre,
        precio_mensual: parseFloat(plan.precio_mensual) || 0,
        precio_anual: parseFloat(plan.precio_anual) || 0,
        max_consultas_mes: plan.max_consultas_mes === '' ? null : plan.max_consultas_mes,
        aparece_en_grilla: plan.aparece_en_grilla,
        perfil_validado: plan.perfil_validado,
        difusion_profesional: plan.difusion_profesional,
        gestion_turnos: plan.gestion_turnos,
        acceso_campus: plan.acceso_campus,
        acceso_campus_completo: plan.acceso_campus_completo,
        networking: plan.networking,
        credencial_virtual: plan.credencial_virtual,
        beneficios_exclusivos: plan.beneficios_exclusivos,
        activo: plan.activo,
      });
      const notif = data.notificados > 0 ? ` · ${data.notificados} abogado(s) notificado(s)` : '';
      toast.success(`Plan "${plan.nombre}" guardado.${notif}`);
      setEditando(false);
      onActualizar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar.');
    } finally { setGuardando(false); }
  };

  const eliminar = async () => {
    const subs = parseInt(plan.suscriptores || 0);
    const msg = subs > 0
      ? `¿Eliminar el plan "${plan.nombre}"? ${subs} abogado(s) serán migrados automáticamente al plan más cercano.`
      : `¿Eliminar el plan "${plan.nombre}"?`;
    if (!window.confirm(msg)) return;
    try {
      const { data } = await api.delete(`/admin/planes-gestion/${plan.id}`);
      toast.success(data.mensaje);
      onActualizar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar.');
    }
  };

  const agregarFunc = async (e) => {
    e.preventDefault();
    if (!nuevaFunc.trim()) return;
    setAgregando(true);
    try {
      await api.post(`/admin/planes-gestion/${plan.id}/funcionalidades`, {
        nombre: nuevaFunc.trim(), icono: nuevoIcono,
      });
      toast.success('Funcionalidad agregada.');
      setNuevaFunc(''); setNuevoIcono('✓');
      onActualizar();
    } catch { toast.error('Error al agregar.'); }
    finally { setAgregando(false); }
  };

  const eliminarFunc = async (funcId) => {
    try {
      await api.delete(`/admin/planes-gestion/funcionalidades/${funcId}`);
      toast.success('Funcionalidad eliminada.');
      onActualizar();
    } catch { toast.error('Error al eliminar.'); }
  };

  const descuentoPct = plan.precio_mensual > 0 && plan.precio_anual > 0
    ? Math.round((1 - (parseFloat(plan.precio_anual) / 12) / parseFloat(plan.precio_mensual)) * 100)
    : 0;

  return (
    <div className="card overflow-hidden" style={!plan.activo ? { opacity: 0.65 } : {}}>

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ background: '#1C1B18' }}>
        <div className="flex-1 min-w-0 mr-4">
          {editando
            ? <input type="text" value={plan.nombre} onChange={e => set('nombre', e.target.value)}
                className="font-display font-bold text-xl text-white bg-transparent border-b border-white/30 focus:border-white outline-none pb-1 w-full" />
            : <h3 className="font-display font-bold text-xl text-white">{plan.nombre}</h3>
          }
          <div className="flex items-center gap-3 mt-1">
            <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>/{plan.slug}</p>
            {parseInt(plan.suscriptores) > 0 && (
              <div className="flex items-center gap-1 font-body text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                <Users size={10} /> {plan.suscriptores} suscriptor(es)
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editando
            ? <button type="button" onClick={() => set('activo', !plan.activo)}
                className="text-xs font-body px-3 py-1.5 rounded-full transition-colors"
                style={plan.activo
                  ? { background: 'rgba(22,163,74,0.2)', color: '#4ade80' }
                  : { background: 'rgba(220,38,38,0.2)', color: '#f87171' }}>
                {plan.activo ? '● Activo' : '○ Inactivo'}
              </button>
            : <span className="text-xs font-body px-3 py-1.5 rounded-full"
                style={plan.activo
                  ? { background: 'rgba(22,163,74,0.2)', color: '#4ade80' }
                  : { background: 'rgba(220,38,38,0.2)', color: '#f87171' }}>
                {plan.activo ? '● Activo' : '○ Inactivo'}
              </span>
          }
          {!editando && (
            <>
              <button onClick={() => setEditando(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-xs font-medium transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
                <Edit2 size={12} /> Editar
              </button>
              <button onClick={eliminar}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(220,38,38,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = ''; }}>
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* Precios */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Mensual', key: 'precio_mensual', suffix: '/mes' },
            { label: 'Anual',   key: 'precio_anual',   suffix: '/año', badge: descuentoPct > 0 ? `-${descuentoPct}%` : null },
          ].map(({ label, key, suffix, badge }) => (
            <div key={key} className="rounded-xl p-4 relative" style={{ background: '#F7F6F4', border: '1px solid #E8E6E3' }}>
              {badge && !editando && (
                <span className="absolute -top-2 -right-2 text-xs font-body font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ background: '#B86030' }}>{badge}</span>
              )}
              <p className="font-body text-xs mb-1" style={{ color: '#8A8780' }}>{label}</p>
              {editando
                ? <div className="flex items-center gap-1">
                    <span style={{ color: '#56534A' }}>$</span>
                    <input type="number" min="0" step="1" value={plan[key]}
                      onChange={e => set(key, e.target.value)}
                      className="font-display font-bold text-2xl bg-transparent outline-none w-full"
                      style={{ color: '#1C1B18' }} />
                  </div>
                : <p className="font-display font-bold text-2xl" style={{ color: '#1C1B18' }}>
                    {parseFloat(plan[key]) === 0 ? (key === 'precio_mensual' ? 'Gratis' : '—') : `$${parseFloat(plan[key]).toLocaleString('es-AR')}`}
                  </p>
              }
              {parseFloat(plan[key]) > 0 && (
                <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>{suffix}</p>
              )}
            </div>
          ))}
        </div>

        {/* Consultas */}
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8A8780' }}>Consultas por mes</p>
          {editando
            ? <div className="flex items-center gap-2">
                <input type="number" min="1" placeholder="Número o vacío para ilimitado"
                  value={plan.max_consultas_mes ?? ''}
                  onChange={e => set('max_consultas_mes', e.target.value === '' ? null : parseInt(e.target.value))}
                  className="input-field flex-1" />
                <button type="button" onClick={() => set('max_consultas_mes', null)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-body text-sm border transition-colors shrink-0"
                  style={plan.max_consultas_mes === null
                    ? { background: '#2C2B27', color: '#fff', borderColor: '#2C2B27' }
                    : { borderColor: '#E8E6E3', color: '#56534A' }}>
                  <Infinity size={14} /> Ilimitado
                </button>
              </div>
            : <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F7F6F4' }}>
                <Users size={14} style={{ color: '#B86030' }} />
                <span className="font-body text-sm" style={{ color: '#1C1B18' }}>
                  {plan.max_consultas_mes === null ? 'Ilimitadas' : `${plan.max_consultas_mes} / mes`}
                </span>
              </div>
          }
        </div>

        {/* Features base — acordeón */}
        <div>
          <button type="button" onClick={() => setExpandido(!expandido)}
            className="flex items-center justify-between w-full mb-2">
            <p className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A8780' }}>
              Funcionalidades base
            </p>
            {expandido ? <ChevronUp size={14} style={{ color: '#8A8780' }} /> : <ChevronDown size={14} style={{ color: '#8A8780' }} />}
          </button>

          {expandido && (
            <div className="space-y-4">
              {GRUPOS.map(grupo => (
                <div key={grupo}>
                  <p className="font-body text-xs font-medium mb-1.5" style={{ color: '#B0AEA8' }}>{grupo}</p>
                  <div className="space-y-1">
                    {FEATURES_BASE.filter(f => f.grupo === grupo).map(({ key, label }) => (
                      editando
                        ? <Toggle key={key} activo={!!plan[key]} onChange={v => set(key, v)} label={label} />
                        : <div key={key} className="flex items-center gap-3 px-3 py-2">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                              style={plan[key] ? { background: '#2C2B27' } : { background: '#F0EFED' }}>
                              {plan[key] ? <Check size={9} className="text-white" /> : <X size={9} style={{ color: '#D4D2CC' }} />}
                            </div>
                            <span className="font-body text-sm" style={{ color: plan[key] ? '#1C1B18' : '#B0AEA8' }}>{label}</span>
                          </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Funcionalidades custom */}
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8A8780' }}>
            Funcionalidades adicionales
          </p>

          {plan.funcionalidades_custom?.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {plan.funcionalidades_custom.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: '#F7F6F4' }}>
                  <span className="text-base shrink-0">{f.icono}</span>
                  <span className="font-body text-sm flex-1" style={{ color: '#1C1B18' }}>{f.nombre}</span>
                  <button onClick={() => eliminarFunc(f.id)}
                    className="p-1 rounded-lg transition-colors shrink-0"
                    style={{ color: '#D4D2CC' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#D4D2CC'; }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar funcionalidad custom */}
          <form onSubmit={agregarFunc} className="flex gap-2">
            <input type="text" maxLength={2} value={nuevoIcono}
              onChange={e => setNuevoIcono(e.target.value || '✓')}
              className="input-field text-center text-lg w-14 shrink-0 px-2" />
            <input type="text" placeholder="Ej: Acceso a sala VIP, Webinars exclusivos..."
              value={nuevaFunc} onChange={e => setNuevaFunc(e.target.value)}
              className="input-field flex-1 text-sm" />
            <button type="submit" disabled={!nuevaFunc.trim() || agregando}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-body text-sm font-medium text-white shrink-0 transition-colors disabled:opacity-40"
              style={{ background: '#B86030' }}
              onMouseEnter={e => { if (!agregando) e.currentTarget.style.background = '#8B4A1E'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}>
              <Plus size={14} /> Agregar
            </button>
          </form>
          <p className="font-body text-xs mt-1" style={{ color: '#B0AEA8' }}>
            El emoji/ícono va en el primer campo. Los suscriptores recibirán notificación automática.
          </p>
        </div>

        {/* Botones guardar / cancelar */}
        {editando && (
          <div className="flex gap-3 pt-2 border-t" style={{ borderColor: '#F0EFED' }}>
            <button type="button" onClick={() => { setPlan(planOrig); setEditando(false); }} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="button" onClick={guardar} disabled={guardando} className="btn-primary flex-1">
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : <><Save size={15} /> Guardar y notificar</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function AdminPlanes() {
  const [planes,   setPlanes]   = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal,    setModal]    = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/planes-gestion');
      setPlanes(data.planes || []);
    } catch { toast.error('No se pudieron cargar los planes.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de planes</h1>
            <p className="section-subtitle">Editá precios, funcionalidades y condiciones. Los cambios se notifican automáticamente.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
            </button>
            <button onClick={() => setModal(true)} className="btn-primary gap-2">
              <Plus size={16} /> Nuevo plan
            </button>
          </div>
        </div>

        {/* Aviso */}
        <div className="rounded-2xl p-4 mb-8 flex items-start gap-3"
          style={{ background: 'rgba(184,96,48,0.08)', border: '1px solid rgba(184,96,48,0.2)' }}>
          <Bell size={16} style={{ color: '#B86030' }} className="shrink-0 mt-0.5" />
          <p className="font-body text-sm leading-relaxed" style={{ color: '#56534A' }}>
            Cualquier cambio de precio o funcionalidad envía una <strong>notificación en la app</strong> y un <strong>email</strong> a todos los abogados suscriptos al plan afectado. Si eliminás un plan, sus suscriptores se migran automáticamente al plan más cercano por precio.
          </p>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-20 rounded-t-2xl" style={{ background: '#E8E6E3' }} />
                <div className="p-6 space-y-4">
                  {[1,2,3].map(j => <div key={j} className="h-8 rounded-xl" style={{ background: '#E8E6E3' }} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid de planes */}
        {!cargando && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planes.map(plan => (
              <TarjetaPlan key={plan.id} plan={plan} onActualizar={cargar} />
            ))}
            {/* Botón agregar */}
            <button onClick={() => setModal(true)}
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-16 transition-all"
              style={{ borderColor: '#D4D2CC' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#B86030'; e.currentTarget.style.background = 'rgba(184,96,48,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#D4D2CC'; e.currentTarget.style.background = ''; }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#F0EFED' }}>
                <Plus size={22} style={{ color: '#8A8780' }} />
              </div>
              <p className="font-body font-medium text-sm" style={{ color: '#8A8780' }}>Crear nuevo plan</p>
            </button>
          </div>
        )}
      </div>

      {modal && <ModalNuevoPlan onCerrar={() => setModal(false)} onCreado={cargar} />}
    </div>
  );
}
