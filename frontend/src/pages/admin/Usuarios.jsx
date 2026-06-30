// ============================================================
// src/pages/admin/Usuarios.jsx — Paleta C: Gris carbón + Cobre
// Vista maestra de TODOS los usuarios del sistema
// Acciones completas según rol: habilitar/deshabilitar,
// para abogados: ver estado aprobación, plan, cambiar plan,
// permitir re-registro, eliminar definitivamente
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Search, UserCheck, UserX, Shield, RefreshCw,
  Mail, User, Briefcase, Crown, X, Filter,
  Trash2, RotateCcw, Check, ChevronDown, ChevronUp,
  MapPin, FileText, ExternalLink, FolderOpen, Save, Pencil, Phone, ArrowUpCircle, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────────────────────
function BadgeRol({ rol }) {
  const mapa = {
    admin:   { icono: <Crown size={11} />,     label: 'Admin',   bg: 'rgba(124,58,237,0.08)', color: '#6d28d9' },
    abogado: { icono: <Briefcase size={11} />, label: 'Abogado', bg: 'rgba(44,43,39,0.08)',   color: '#2C2B27' },
    cliente: { icono: <User size={11} />,      label: 'Cliente', bg: '#F0EFED',               color: '#56534A' },
  };
  const cfg = mapa[rol] || mapa.cliente;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-body font-medium px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.icono} {cfg.label}
    </span>
  );
}

function BadgeEstado({ estado }) {
  const mapa = {
    aprobado:  { bg: 'rgba(22,163,74,0.1)',   color: '#15803d', label: 'Aprobado'  },
    pendiente: { bg: 'rgba(245,158,11,0.1)',  color: '#b45309', label: 'Pendiente' },
    rechazado: { bg: 'rgba(220,38,38,0.1)',   color: '#dc2626', label: 'Rechazado' },
  };
  const cfg = mapa[estado] || { bg: '#F0EFED', color: '#8A8780', label: estado };
  return (
    <span className="text-xs font-body font-medium px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function BadgePlan({ slug }) {
  const mapa = {
    basico:    { label: 'Básico',      bg: 'rgba(184,96,48,0.1)', color: '#8B4A1E' },
    comunidad: { label: '★ Comunidad', bg: '#B86030',             color: '#fff'    },
  };
  const cfg = mapa[slug] || { label: slug || '—', bg: '#F0EFED', color: '#56534A' };
  return (
    <span className="text-xs font-body font-medium px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab documentos del abogado
// ─────────────────────────────────────────────────────────────
function TabDocumentos({ usuario }) {
  const docs = [
    { campo: 'doc_titulo_url',     label: 'Título universitario', desc: usuario.titulo_universitario || 'No especificado' },
    { campo: 'doc_cuil_url',       label: 'Constancia de CUIL',   desc: usuario.cuil || 'No especificado' },
    { campo: 'doc_credencial_url', label: 'Credencial de letrado', desc: usuario.nro_credencial_letrado ? `Nro. ${usuario.nro_credencial_letrado}` : 'Sin número' },
  ];
  const hay = docs.some(d => usuario[d.campo]);

  if (!hay) return (
    <div className="py-8 text-center">
      <FolderOpen size={32} className="mx-auto mb-2" style={{ color: '#D4D2CC' }} />
      <p className="font-body text-sm" style={{ color: '#8A8780' }}>Sin documentos adjuntos</p>
    </div>
  );

  return (
    <div className="space-y-2 pt-2">
      <p className="font-body text-xs px-3 py-2 rounded-lg"
        style={{ background: 'rgba(184,96,48,0.06)', color: '#B86030' }}>
        ⚠️ Verificá la autenticidad antes de aprobar el perfil.
      </p>
      {docs.map(({ campo, label, desc }) => {
        const url = usuario[campo];
        return (
          <div key={campo} className="flex items-center justify-between gap-3 p-3 rounded-xl"
            style={{ background: '#F7F6F4' }}>
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={14} style={{ color: url ? '#B86030' : '#B0AEA8' }} className="shrink-0" />
              <div className="min-w-0">
                <p className="font-body font-semibold text-xs" style={{ color: '#1C1B18' }}>{label}</p>
                <p className="font-body text-xs truncate" style={{ color: '#8A8780' }}>{desc}</p>
              </div>
            </div>
            {url
              ? <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-body text-xs font-medium text-white shrink-0"
                  style={{ background: '#2C2B27' }}>
                  <ExternalLink size={11} /> Ver
                </a>
              : <span className="font-body text-xs shrink-0" style={{ color: '#B0AEA8' }}>No adjunto</span>
            }
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal principal — acciones completas según rol
// ─────────────────────────────────────────────────────────────
function ModalUsuario({ usuario, onCerrar, onActualizar }) {
  const [procesando,  setProcesando]  = useState(false);
  const [tab,         setTab]         = useState('info');      // 'info' | 'documentos' | 'perfil'
  const [planes,      setPlanes]      = useState([]);
  const [planSel,     setPlanSel]     = useState(usuario.plan_slug || '');
  const [accionApro,  setAccionApro]  = useState('');          // 'aprobar' | 'rechazar'
  const [motivo,      setMotivo]      = useState('');
  const [toggleVis,   setToggleVis]   = useState(usuario.visible_en_grilla ?? false);
  const [toggleMat,   setToggleMat]   = useState(usuario.matricula_verificada ?? false);
  const [editandoDatos, setEditandoDatos] = useState(false); // toggle del formulario de datos personales

  const esAbogado = usuario.rol === 'abogado';

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      descripcion:      usuario.descripcion || '',
      anos_experiencia: usuario.anos_experiencia || '',
      ciudad:           usuario.ciudad || '',
      provincia:        usuario.provincia || '',
      matricula:        usuario.matricula || '',
    }
  });

  // Formulario separado para datos personales (nombre, apellido, email, teléfono)
  const { register: regDatos, handleSubmit: handleDatos, formState: { errors: errDatos } } = useForm({
    defaultValues: {
      nombre:   usuario.nombre   || '',
      apellido: usuario.apellido || '',
      email:    usuario.email    || '',
      telefono: usuario.telefono || '',
    }
  });

  useEffect(() => {
    if (esAbogado) {
      api.get('/admin/planes')
        .then(r => setPlanes(r.data.planes || []))
        .catch(() => {});
    }
  }, [esAbogado]);

  // ── Habilitar / deshabilitar cuenta ────────────────────────
  const toggleEstado = async () => {
    const nuevo = !usuario.activo;
    if (!window.confirm(`¿${nuevo ? 'Habilitar' : 'Deshabilitar'} la cuenta de ${usuario.nombre} ${usuario.apellido}?`)) return;
    setProcesando(true);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/estado`, { activo: nuevo });
      toast.success(`Cuenta ${nuevo ? 'habilitada' : 'deshabilitada'}.`);
      onActualizar(); onCerrar();
    } catch { toast.error('Error al actualizar.'); }
    finally { setProcesando(false); }
  };

  // ── Aprobar / rechazar abogado ──────────────────────────────
  const ejecutarAprobacion = async () => {
    if (accionApro === 'rechazar' && !motivo.trim()) { toast.error('Ingresá el motivo del rechazo.'); return; }
    setProcesando(true);
    try {
      await api.patch(`/admin/abogados/${usuario.id}/aprobar`, {
        accion: accionApro,
        motivo: accionApro === 'rechazar' ? motivo : undefined,
        visible: toggleVis,
        matricula_verificada: toggleMat,
      });
      toast.success(accionApro === 'aprobar' ? '✅ Perfil aprobado.' : '❌ Perfil rechazado.');
      onActualizar(); onCerrar();
    } catch { toast.error('Error al procesar.'); }
    finally { setProcesando(false); }
  };

  // ── Guardar visibilidad y verificación ─────────────────────
  const guardarEstadoAbogado = async () => {
    setProcesando(true);
    try {
      await api.patch(`/admin/abogados/${usuario.id}/aprobar`, {
        visible: toggleVis, matricula_verificada: toggleMat,
      });
      toast.success('Estado actualizado.');
      onActualizar(); onCerrar();
    } catch { toast.error('Error al guardar.'); }
    finally { setProcesando(false); }
  };

  // ── Guardar perfil del abogado ──────────────────────────────
  const onSubmitPerfil = async (datos) => {
    setProcesando(true);
    try {
      await api.put(`/admin/abogados/${usuario.id}/perfil`, {
        ...datos,
        plan_slug: planSel,
      });
      toast.success('Perfil actualizado.');
      onActualizar(); onCerrar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar.'); }
    finally { setProcesando(false); }
  };

  // ── Guardar datos personales ────────────────────────────────
  const onSubmitDatos = async (datos) => {
    setProcesando(true);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/datos`, datos);
      toast.success('Datos personales actualizados.');
      setEditandoDatos(false);
      onActualizar(); onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar.');
    } finally { setProcesando(false); }
  };

  // ── Permitir re-registro ────────────────────────────────────
  const permitirReregistro = async () => {
    if (!window.confirm(
      `¿Permitir que ${usuario.nombre} ${usuario.apellido} se vuelva a registrar?\n\n` +
      `El email "${usuario.email}" quedará libre. El historial se conserva.`
    )) return;
    setProcesando(true);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/permitir-reregistro`);
      toast.success('Email liberado para nuevo registro.');
      onActualizar(); onCerrar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error.'); }
    finally { setProcesando(false); }
  };

  // ── Verificar email manualmente ─────────────────────────────────
  const verificarEmailManual = async () => {
    if (!window.confirm(
      `¿Verificar manualmente el email de ${usuario.nombre} ${usuario.apellido}?\n\n` +
      `Esto le permitirá iniciar sesión sin pasar por el proceso de verificación.`
    )) return;
    setProcesando(true);
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/verificar-email`);
      toast.success('Email verificado correctamente.');
      onActualizar(); onCerrar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al verificar.'); }
    finally { setProcesando(false); }
  };

  // ── Rechazar solicitud de cambio de plan ───────────────────────
  const rechazarSolicitudPlan = async () => {
    const motivoRechazo = window.prompt(
      `¿Rechazar la solicitud de cambio al plan "${usuario.plan_solicitado_nombre}" ` +
      `de ${usuario.nombre} ${usuario.apellido}?\n\nMotivo (opcional):`
    );
    if (motivoRechazo === null) return;
    setProcesando(true);
    try {
      await api.patch(`/admin/abogados/${usuario.id}/rechazar-plan`, { motivo: motivoRechazo });
      toast.success('Solicitud rechazada. El abogado fue notificado.');
      onActualizar(); onCerrar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al rechazar.'); }
    finally { setProcesando(false); }
  };

  // ── Eliminar definitivamente ────────────────────────────────
  const eliminarDefinitivamente = async () => {
    if (!window.confirm(
      `⚠️ ELIMINAR DEFINITIVAMENTE\n\n` +
      `¿Eliminás la cuenta de ${usuario.nombre} ${usuario.apellido}?\n\n` +
      `Se borrarán todos sus datos. Esta acción NO se puede deshacer.`
    )) return;
    if (!window.confirm(`Última confirmación: ¿eliminar a ${usuario.nombre} ${usuario.apellido}?`)) return;
    setProcesando(true);
    try {
      await api.delete(`/admin/usuarios/${usuario.id}`);
      toast.success('Cuenta eliminada definitivamente.');
      onActualizar(); onCerrar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al eliminar.'); }
    finally { setProcesando(false); }
  };

  // ── Pestañas según rol ──────────────────────────────────────
  const tabs = esAbogado
    ? [{ id: 'info', label: 'Info y estado' }, { id: 'documentos', label: 'Documentos' }, { id: 'perfil', label: 'Editar perfil' }, { id: 'datos', label: 'Datos personales' }]
    : [{ id: 'info', label: 'Info y estado' }, { id: 'datos', label: 'Datos personales' }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-lg animate-slide-up max-h-[90vh] flex flex-col">

        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b shrink-0" style={{ borderColor: '#F0EFED' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: usuario.activo ? '#2C2B27' : '#D4D2CC' }}>
              <span className="font-display font-bold text-white">
                {usuario.nombre[0]}{usuario.apellido[0]}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-bold" style={{ color: '#1C1B18' }}>
                  {esAbogado ? 'Dr./Dra. ' : ''}{usuario.nombre} {usuario.apellido}
                </h3>
                <BadgeRol rol={usuario.rol} />
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-body text-xs" style={{ color: '#8A8780' }}>{usuario.email}</span>
                {!usuario.activo && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-body"
                    style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>Deshabilitado</span>
                )}
                {esAbogado && usuario.estado_aprobacion && (
                  <BadgeEstado estado={usuario.estado_aprobacion} />
                )}
              </div>
            </div>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors shrink-0"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        {/* Pestañas — solo si hay más de una */}
        {tabs.length > 1 && (
          <div className="flex gap-1 px-6 pt-4 shrink-0">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="px-4 py-2 rounded-xl text-sm font-body font-medium transition-all"
                style={tab === t.id ? { background: '#2C2B27', color: '#fff' } : { color: '#56534A' }}
                onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = '#F0EFED'; }}
                onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = ''; }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ── Tab: Info y estado ─────────────────────── */}
          {tab === 'info' && (
            <>
              {/* Datos básicos */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: '#F7F6F4' }}>
                <div className="flex items-center gap-3">
                  <Mail size={14} style={{ color: '#8A8780' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>Email</p>
                    <p className="font-body text-sm truncate" style={{ color: '#1C1B18' }}>{usuario.email}</p>
                  </div>
                  {/* Badge de verificación de email */}
                  {usuario.email_verificado
                    ? <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-xs font-medium"
                        style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>
                        <CheckCircle size={11} /> Verificado
                      </span>
                    : <button
                        onClick={verificarEmailManual}
                        disabled={procesando}
                        className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-xs font-medium transition-colors"
                        style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}
                        title="Verificar email manualmente"
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; }}>
                        Sin verificar — click para verificar
                      </button>
                  }
                </div>
                <div className="border-t pt-3 grid grid-cols-2 gap-3" style={{ borderColor: '#E8E6E3' }}>
                  <div>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>Registrado el</p>
                    <p className="font-body text-sm" style={{ color: '#1C1B18' }}>
                      {format(new Date(usuario.creado_en), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  {esAbogado && (
                    <div>
                      <p className="font-body text-xs" style={{ color: '#8A8780' }}>Plan</p>
                      <BadgePlan slug={usuario.plan_slug} />
                    </div>
                  )}
                </div>
                {esAbogado && usuario.ciudad && (
                  <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: '#E8E6E3' }}>
                    <MapPin size={13} style={{ color: '#8A8780' }} />
                    <span className="font-body text-sm" style={{ color: '#56534A' }}>
                      {usuario.ciudad}{usuario.provincia ? `, ${usuario.provincia}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Toggles de visibilidad — solo abogados */}
              {esAbogado && (
                <div className="space-y-3">
                  {[
                    { campo: 'visible',   val: toggleVis,  set: setToggleVis,  label: 'Visible en búsqueda',  desc: 'Aparece en el catálogo público' },
                    { campo: 'matricula', val: toggleMat,  set: setToggleMat,  label: 'Matrícula verificada', desc: 'Muestra el sello de verificación' },
                  ].map(({ campo, val, set, label, desc }) => (
                    <div key={campo} className="flex items-center justify-between p-4 rounded-xl border-2 transition-all"
                      style={{ borderColor: val ? '#2C2B27' : '#E8E6E3' }}>
                      <div className="flex items-center gap-3">
                        <Shield size={15} style={{ color: val ? '#2C2B27' : '#B0AEA8' }} />
                        <div>
                          <p className="font-body font-medium text-sm" style={{ color: '#1C1B18' }}>{label}</p>
                          <p className="font-body text-xs" style={{ color: '#8A8780' }}>{desc}</p>
                        </div>
                      </div>
                      <div onClick={() => set(!val)}
                        className="relative w-11 h-6 rounded-full cursor-pointer transition-colors"
                        style={{ background: val ? '#2C2B27' : '#E8E6E3' }}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Acciones de aprobación — solo si está pendiente */}
              {esAbogado && usuario.estado_aprobacion === 'pendiente' && (
                <div className="space-y-3">
                  {!accionApro && (
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setAccionApro('aprobar')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                        style={{ background: 'rgba(22,163,74,0.08)', color: '#15803d', borderColor: 'rgba(22,163,74,0.2)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#15803d'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.2)'; }}>
                        <Check size={15} /> Aprobar perfil
                      </button>
                      <button onClick={() => setAccionApro('rechazar')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                        style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626', borderColor: 'rgba(220,38,38,0.15)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(220,38,38,0.15)'; }}>
                        <X size={15} /> Rechazar perfil
                      </button>
                    </div>
                  )}
                  {accionApro === 'rechazar' && (
                    <div>
                      <label className="input-label">Motivo del rechazo</label>
                      <textarea rows={3} placeholder="Se enviará al abogado por email..."
                        value={motivo} onChange={e => setMotivo(e.target.value)}
                        className="input-field resize-none" />
                    </div>
                  )}
                  {accionApro && (
                    <div className="flex gap-3">
                      <button onClick={() => setAccionApro('')} className="btn-secondary flex-1">Cancelar</button>
                      <button onClick={ejecutarAprobacion} disabled={procesando}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm text-white"
                        style={{ background: accionApro === 'rechazar' ? '#dc2626' : '#16a34a' }}>
                        {procesando ? 'Procesando...'
                          : accionApro === 'aprobar'
                            ? <><Check size={14} /> Confirmar aprobación</>
                            : <><X size={14} /> Confirmar rechazo</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Guardar estado (para abogados no pendientes) */}
              {esAbogado && usuario.estado_aprobacion !== 'pendiente' && (
                <button onClick={guardarEstadoAbogado} disabled={procesando} className="btn-primary w-full">
                  {procesando ? 'Guardando...' : <><Save size={14} /> Guardar cambios</>}
                </button>
              )}

              {/* Solicitud de cambio de plan pendiente — visible solo para abogados aprobados */}
              {esAbogado && usuario.plan_solicitado_id && usuario.estado_aprobacion === 'aprobado' && (
                <div className="rounded-xl p-4 space-y-3"
                  style={{ background: 'rgba(184,96,48,0.06)', border: '1px solid rgba(184,96,48,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle size={15} style={{ color: '#B86030' }} />
                    <p className="font-body text-sm font-semibold" style={{ color: '#B86030' }}>
                      Solicitud de cambio de plan
                    </p>
                  </div>
                  <p className="font-body text-xs" style={{ color: '#56534A' }}>
                    El abogado solicitó cambiar de <strong>{usuario.plan_nombre}</strong> a <strong>{usuario.plan_solicitado_nombre}</strong>.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Aprobar: usa plan_id directo — funciona con cualquier plan presente o futuro */}
                    <button
                      onClick={() => {
                        if (!window.confirm(
                          `¿Aprobar el cambio al plan "${usuario.plan_solicitado_nombre}" ` +
                          `para ${usuario.nombre} ${usuario.apellido}?`
                        )) return;
                        setProcesando(true);
                        api.put(`/admin/abogados/${usuario.id}/perfil`, {
                          plan_id: usuario.plan_solicitado_id,
                        }).then(() => {
                          toast.success('Plan actualizado. El abogado fue notificado.');
                          onActualizar(); onCerrar();
                        }).catch(() => {
                          toast.error('Error al cambiar el plan.');
                          setProcesando(false);
                        });
                      }}
                      disabled={procesando}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-body text-xs font-medium border-2 transition-colors"
                      style={{ borderColor: 'rgba(22,163,74,0.3)', color: '#15803d', background: 'rgba(22,163,74,0.06)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.06)'; }}>
                      <Check size={13} /> Aprobar
                    </button>
                    <button
                      onClick={rechazarSolicitudPlan}
                      disabled={procesando}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-body text-xs font-medium border-2 transition-colors"
                      style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626', background: 'rgba(220,38,38,0.04)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.04)'; }}>
                      <X size={13} /> Rechazar
                    </button>
                  </div>
                </div>
              )}

              {/* Separador de acciones de cuenta */}
              <div className="border-t pt-4 space-y-3" style={{ borderColor: '#F0EFED' }}>

                {/* Habilitar / deshabilitar — no para admins */}
                {usuario.rol !== 'admin' && (
                  <button onClick={toggleEstado} disabled={procesando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm transition-colors"
                    style={usuario.activo
                      ? { background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }
                      : { background: 'rgba(22,163,74,0.06)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }
                    }>
                    {procesando
                      ? <div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                      : usuario.activo
                        ? <><UserX size={15} /> Deshabilitar cuenta</>
                        : <><UserCheck size={15} /> Habilitar cuenta</>
                    }
                  </button>
                )}

                {/* Aprobar directamente + Permitir re-registro — solo abogados rechazados */}
                {esAbogado && usuario.estado_aprobacion === 'rechazado' && (
                  <>
                    {/* Aprobación directa: útil cuando el rechazo fue un error
                        o el abogado corrigió algo sin necesidad de volver a registrarse.
                        Reutiliza el mismo endpoint de aprobación de abogados pendientes. */}
                    <button
                      onClick={() => {
                        if (!window.confirm(
                          `¿Aprobar directamente a ${usuario.nombre} ${usuario.apellido}?\n\n` +
                          `Su perfil pasará a estado "Aprobado" y recibirá un email de confirmación.`
                        )) return;
                        setAccionApro('aprobar');
                        // Ejecutar inmediatamente después de setear la acción
                        api.patch(`/admin/abogados/${usuario.id}/aprobar`, {
                          accion: 'aprobar',
                          visible: toggleVis,
                          matricula_verificada: toggleMat,
                        }).then(() => {
                          toast.success('✅ Perfil aprobado directamente.');
                          onActualizar(); onCerrar();
                        }).catch(() => {
                          toast.error('Error al aprobar el perfil.');
                          setAccionApro('');
                        });
                      }}
                      disabled={procesando}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                      style={{ borderColor: 'rgba(22,163,74,0.3)', color: '#15803d', background: 'rgba(22,163,74,0.06)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.06)'; }}>
                      <Check size={15} /> Aprobar directamente
                    </button>

                    <button onClick={permitirReregistro} disabled={procesando}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                      style={{ borderColor: '#B86030', color: '#B86030', background: 'rgba(184,96,48,0.04)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.04)'; }}>
                      <RotateCcw size={15} /> Permitir re-registro
                    </button>
                  </>
                )}

                {/* Eliminar definitivamente — nunca para admins */}
                {usuario.rol !== 'admin' && (
                  <button onClick={eliminarDefinitivamente} disabled={procesando}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                    style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#dc2626', background: 'rgba(220,38,38,0.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.04)'; }}>
                    <Trash2 size={14} /> Eliminar cuenta definitivamente
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Tab: Documentos ────────────────────────── */}
          {tab === 'documentos' && <TabDocumentos usuario={usuario} />}

          {/* ── Tab: Editar perfil (solo abogados) ────── */}
          {tab === 'perfil' && esAbogado && (
            <form onSubmit={handleSubmit(onSubmitPerfil)} className="space-y-4">

              {/* Selector de plan */}
              <div>
                <label className="input-label">Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  {planes.filter(p => p.activo).map(plan => {
                    const sel = planSel === plan.slug;
                    return (
                      <button key={plan.id} type="button" onClick={() => setPlanSel(plan.slug)}
                        className="flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all"
                        style={sel ? { borderColor: '#2C2B27', background: 'rgba(44,43,39,0.04)' } : { borderColor: '#E8E6E3' }}>
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: sel ? '#2C2B27' : '#D4D2CC' }}>
                          {sel && <div className="w-2 h-2 rounded-full" style={{ background: '#2C2B27' }} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body font-semibold text-xs truncate" style={{ color: '#1C1B18' }}>{plan.nombre}</p>
                          <p className="font-body text-xs" style={{ color: '#8A8780' }}>${parseFloat(plan.precio_mensual).toLocaleString('es-AR')}/mes</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="input-label">Descripción</label>
                <textarea rows={3} className="input-field resize-none"
                  {...register('descripcion', { maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Matrícula</label>
                  <input type="text" className="input-field" {...register('matricula')} />
                </div>
                <div>
                  <label className="input-label">Años exp.</label>
                  <input type="number" min="0" max="70" className="input-field" {...register('anos_experiencia')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Ciudad</label>
                  <input type="text" className="input-field" {...register('ciudad')} />
                </div>
                <div>
                  <label className="input-label">Provincia</label>
                  <input type="text" className="input-field" {...register('provincia')} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={procesando} className="btn-primary flex-1">
                  {procesando ? 'Guardando...' : <><Save size={14} /> Guardar</>}
                </button>
              </div>
            </form>
          )}

          {/* ── Tab: Datos personales ───────────────────── */}
          {tab === 'datos' && usuario.rol !== 'admin' && (
            <form onSubmit={handleDatos(onSubmitDatos)} className="space-y-4">
              <div className="rounded-xl p-3 flex items-center gap-2"
                style={{ background: 'rgba(184,96,48,0.06)', border: '1px solid rgba(184,96,48,0.15)' }}>
                <Pencil size={13} style={{ color: '#B86030' }} className="shrink-0" />
                <p className="font-body text-xs" style={{ color: '#B86030' }}>
                  Estos cambios quedan registrados en el log de auditoría.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Nombre</label>
                  <input type="text" className={`input-field ${errDatos.nombre ? 'border-red-300' : ''}`}
                    {...regDatos('nombre', { required: 'Requerido' })} />
                  {errDatos.nombre && <p className="input-error">{errDatos.nombre.message}</p>}
                </div>
                <div>
                  <label className="input-label">Apellido</label>
                  <input type="text" className={`input-field ${errDatos.apellido ? 'border-red-300' : ''}`}
                    {...regDatos('apellido', { required: 'Requerido' })} />
                  {errDatos.apellido && <p className="input-error">{errDatos.apellido.message}</p>}
                </div>
              </div>

              <div>
                <label className="input-label">Email</label>
                <input type="email" className={`input-field ${errDatos.email ? 'border-red-300' : ''}`}
                  {...regDatos('email', {
                    required: 'Requerido',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
                  })} />
                {errDatos.email && <p className="input-error">{errDatos.email.message}</p>}
                <p className="font-body text-xs mt-1" style={{ color: '#8A8780' }}>
                  ⚠️ Cambiar el email modifica el login del usuario.
                </p>
              </div>

              <div>
                <label className="input-label">Teléfono</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
                  <input type="text" className="input-field pl-9"
                    placeholder="+54 299 000-0000"
                    {...regDatos('telefono')} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={procesando} className="btn-primary flex-1">
                  {procesando ? 'Guardando...' : <><Save size={14} /> Guardar</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function AdminUsuarios() {
  const [usuarios,     setUsuarios]     = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [busqueda,     setBusqueda]     = useState('');
  const [filtroRol,    setFiltroRol]    = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [usuarioSel,   setUsuarioSel]   = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      // Cargamos usuarios y abogados en paralelo para tener datos completos
      const [resUsuarios, resAbogados] = await Promise.all([
        api.get('/admin/usuarios'),
        api.get('/admin/abogados'),
      ]);

      const usuariosBase = resUsuarios.data.usuarios || [];
      const abogadosMap  = Object.fromEntries(
        (resAbogados.data.abogados || []).map(a => [a.id, a])
      );

      // Enriquecer cada usuario abogado con datos del perfil
      const enriquecidos = usuariosBase.map(u =>
        u.rol === 'abogado' && abogadosMap[u.id]
          ? { ...u, ...abogadosMap[u.id] }
          : u
      );

      setUsuarios(enriquecidos);
    } catch { toast.error('No se pudieron cargar los usuarios.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = usuarios.filter(u => {
    const texto = `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase();
    return (!busqueda || texto.includes(busqueda.toLowerCase())) &&
      (!filtroRol || u.rol === filtroRol) &&
      (filtroActivo === '' ? true : filtroActivo === 'true' ? u.activo : !u.activo);
  });

  const conteos = {
    total:      usuarios.length,
    abogados:   usuarios.filter(u => u.rol === 'abogado').length,
    clientes:   usuarios.filter(u => u.rol === 'cliente').length,
    inactivos:  usuarios.filter(u => !u.activo).length,
    pendientes: usuarios.filter(u => u.estado_aprobacion === 'pendiente').length,
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de usuarios</h1>
            <p className="section-subtitle">
              {cargando ? 'Cargando...' : `${filtrados.length} de ${usuarios.length} usuarios`}
            </p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {/* Alerta de abogados pendientes */}
        {conteos.pendientes > 0 && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <span style={{ color: '#b45309' }}>⚠️</span>
            <p className="font-body text-sm" style={{ color: '#92400e' }}>
              Hay <strong>{conteos.pendientes}</strong> abogado{conteos.pendientes > 1 ? 's' : ''} pendientes de aprobación.
            </p>
          </div>
        )}

        {/* Contadores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total',          val: conteos.total,      icono: '👥' },
            { label: 'Abogados',       val: conteos.abogados,   icono: '⚖️' },
            { label: 'Clientes',       val: conteos.clientes,   icono: '👤' },
            { label: 'Deshabilitados', val: conteos.inactivos,  icono: '🚫' },
          ].map(({ label, val, icono }) => (
            <div key={label} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span>{icono}</span>
                <p className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>{val}</p>
              </div>
              <p className="font-body text-xs" style={{ color: '#8A8780' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
            <input type="text" placeholder="Buscar por nombre o email..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10" />
          </div>
          <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} className="input-field sm:w-40">
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="abogado">Abogado</option>
            <option value="cliente">Cliente</option>
          </select>
          <select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)} className="input-field sm:w-44">
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Deshabilitados</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-body font-semibold uppercase tracking-wider"
            style={{ background: '#F7F6F4', borderColor: '#F0EFED', color: '#8A8780' }}>
            <div className="col-span-4">Usuario</div>
            <div className="col-span-2">Rol</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Registrado</div>
            <div className="col-span-1 text-right">Acción</div>
          </div>

          {cargando && (
            <div className="divide-y" style={{ borderColor: '#F7F6F4' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: '#E8E6E3' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                    <div className="h-3 rounded w-1/4" style={{ background: '#E8E6E3' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!cargando && filtrados.length === 0 && (
            <div className="py-16 text-center">
              <Filter size={32} className="mx-auto mb-3" style={{ color: '#D4D2CC' }} />
              <p className="font-body" style={{ color: '#8A8780' }}>No se encontraron usuarios.</p>
            </div>
          )}

          {!cargando && filtrados.map(u => (
            <div key={u.id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 border-b last:border-0 items-center transition-colors ${!u.activo ? 'opacity-60' : ''}`}
              style={{ borderColor: '#F7F6F4' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}>

              <div className="md:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: u.activo ? '#2C2B27' : '#D4D2CC' }}>
                  <span className="font-display font-bold text-white text-sm">
                    {u.nombre[0]}{u.apellido[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-sm truncate" style={{ color: '#1C1B18' }}>
                    {u.nombre} {u.apellido}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Shield size={10} style={{ color: u.email_verificado ? '#16a34a' : '#B86030' }} />
                    <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                      {u.email_verificado ? 'Verificado' : 'Sin verificar'}
                    </span>
                    {u.rol === 'abogado' && u.estado_aprobacion && (
                      <BadgeEstado estado={u.estado_aprobacion} />
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2"><BadgeRol rol={u.rol} /></div>

              <div className="md:col-span-3">
                <p className="font-body text-sm truncate flex items-center gap-1" style={{ color: '#56534A' }}>
                  <Mail size={12} style={{ color: '#8A8780' }} className="shrink-0" />
                  <span className="truncate">{u.email}</span>
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                  {format(new Date(u.creado_en), "d MMM yyyy", { locale: es })}
                </p>
              </div>

              <div className="md:col-span-1 flex justify-end">
                <button onClick={() => setUsuarioSel(u)}
                  className="text-xs px-3 py-1.5 rounded-xl font-body font-medium border transition-colors"
                  style={{ borderColor: '#E8E6E3', color: '#56534A' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                  Ver
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="font-body text-xs text-center mt-4" style={{ color: '#B0AEA8' }}>
          Las cuentas de administrador no pueden modificarse desde este panel.
        </p>
      </div>

      {usuarioSel && (
        <ModalUsuario usuario={usuarioSel}
          onCerrar={() => setUsuarioSel(null)}
          onActualizar={cargar} />
      )}
    </div>
  );
}
