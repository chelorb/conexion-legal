// ============================================================
// src/pages/admin/Abogados.jsx — Paleta C: Gris carbón + Cobre
// Vista especializada de abogados — enfocada en aprobación
// Las acciones completas (deshabilitar, eliminar, editar plan)
// se realizan desde Admin → Usuarios para evitar duplicación
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Check, X, Search, MapPin,
  RefreshCw, Clock, AlertCircle, ExternalLink,
  FileText, FolderOpen, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

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

function TabDocumentos({ abogado }) {
  const docs = [
    { campo: 'doc_titulo_url',     label: 'Título universitario', desc: abogado.titulo_universitario || 'No especificado' },
    { campo: 'doc_cuil_url',       label: 'Constancia de CUIL',   desc: abogado.cuil || 'No especificado' },
    { campo: 'doc_credencial_url', label: 'Credencial de letrado', desc: abogado.nro_credencial_letrado ? `Nro. ${abogado.nro_credencial_letrado}` : 'Sin número' },
  ];
  const hay = docs.some(d => abogado[d.campo]);

  if (!hay) return (
    <div className="py-10 text-center">
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
        const url = abogado[campo];
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

function ModalRevision({ abogado, onCerrar, onActualizar }) {
  const [tab,       setTab]       = useState('revision');
  const [guardando, setGuardando] = useState(false);
  const [accion,    setAccion]    = useState('');
  const [motivo,    setMotivo]    = useState('');
  const [toggleVis, setToggleVis] = useState(abogado.visible_en_grilla ?? false);
  const [toggleMat, setToggleMat] = useState(abogado.matricula_verificada ?? false);

  const ejecutarAccion = async () => {
    if (accion === 'rechazar' && !motivo.trim()) { toast.error('Ingresá el motivo del rechazo.'); return; }
    setGuardando(true);
    try {
      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, {
        accion,
        motivo: accion === 'rechazar' ? motivo : undefined,
        visible: toggleVis,
        matricula_verificada: toggleMat,
      });
      toast.success(accion === 'aprobar' ? '✅ Perfil aprobado.' : '❌ Perfil rechazado.');
      onActualizar(); onCerrar();
    } catch { toast.error('Error al procesar la acción.'); }
    finally { setGuardando(false); }
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, {
        visible: toggleVis, matricula_verificada: toggleMat,
      });
      toast.success('Cambios guardados.');
      onActualizar(); onCerrar();
    } catch { toast.error('Error al guardar.'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-xl animate-slide-up max-h-[90vh] flex flex-col">

        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b shrink-0" style={{ borderColor: '#F0EFED' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#2C2B27' }}>
              <span className="font-display font-bold text-white">{abogado.nombre[0]}{abogado.apellido[0]}</span>
            </div>
            <div>
              <h3 className="font-display font-bold" style={{ color: '#1C1B18' }}>
                Dr./Dra. {abogado.nombre} {abogado.apellido}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-body text-xs" style={{ color: '#8A8780' }}>{abogado.email}</p>
                <BadgePlan slug={abogado.plan_slug} />
              </div>
            </div>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {[{ id: 'revision', label: 'Revisión' }, { id: 'documentos', label: 'Documentos' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-xl text-sm font-body font-medium transition-all"
              style={tab === t.id ? { background: '#2C2B27', color: '#fff' } : { color: '#56534A' }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = '#F0EFED'; }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = ''; }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ── Tab: Revisión ─────────────────────────── */}
          {tab === 'revision' && (
            <>
              {/* Datos del perfil */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Estado',     val: (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={abogado.estado_aprobacion === 'aprobado'
                        ? { background: 'rgba(22,163,74,0.1)',  color: '#15803d' }
                        : abogado.estado_aprobacion === 'rechazado'
                          ? { background: 'rgba(220,38,38,0.1)', color: '#dc2626' }
                          : { background: 'rgba(245,158,11,0.1)',color: '#b45309' }}>
                      {abogado.estado_aprobacion}
                    </span>
                  )},
                  { label: 'Ubicación', val: abogado.ciudad || '—' },
                  { label: 'Matrícula', val: abogado.matricula || '—' },
                  { label: 'Años exp.', val: abogado.anos_experiencia ? `${abogado.anos_experiencia} años` : '—' },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: '#F7F6F4' }}>
                    <p className="font-body text-xs mb-1" style={{ color: '#8A8780' }}>{label}</p>
                    <div className="font-body text-sm" style={{ color: '#1C1B18' }}>{val}</div>
                  </div>
                ))}
              </div>

              {abogado.descripcion && (
                <div className="rounded-xl p-4" style={{ background: '#F7F6F4' }}>
                  <p className="font-body text-xs mb-2" style={{ color: '#8A8780' }}>Descripción</p>
                  <p className="font-body text-sm leading-relaxed line-clamp-4" style={{ color: '#3A3832' }}>
                    {abogado.descripcion}
                  </p>
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3">
                {[
                  { val: toggleVis, set: setToggleVis, label: 'Visible en búsqueda',  desc: 'Aparece en el catálogo público' },
                  { val: toggleMat, set: setToggleMat, label: 'Matrícula verificada', desc: 'Muestra el sello de verificación' },
                ].map(({ val, set, label, desc }) => (
                  <div key={label} className="flex items-center justify-between p-4 rounded-xl border-2 transition-all"
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

              {/* Botones de aprobación — solo si está pendiente */}
              {abogado.estado_aprobacion === 'pendiente' && (
                <div className="space-y-3">
                  {!accion && (
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setAccion('aprobar')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                        style={{ background: 'rgba(22,163,74,0.08)', color: '#15803d', borderColor: 'rgba(22,163,74,0.2)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#15803d'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.2)'; }}>
                        <Check size={15} /> Aprobar perfil
                      </button>
                      <button onClick={() => setAccion('rechazar')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                        style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626', borderColor: 'rgba(220,38,38,0.15)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(220,38,38,0.15)'; }}>
                        <X size={15} /> Rechazar perfil
                      </button>
                    </div>
                  )}
                  {accion === 'rechazar' && (
                    <div>
                      <label className="input-label">Motivo del rechazo</label>
                      <textarea rows={3} placeholder="Se enviará al abogado por email..."
                        value={motivo} onChange={e => setMotivo(e.target.value)}
                        className="input-field resize-none" />
                    </div>
                  )}
                  {accion && (
                    <div className="flex gap-3">
                      <button onClick={() => setAccion('')} className="btn-secondary flex-1">Cancelar</button>
                      <button onClick={ejecutarAccion} disabled={guardando}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm text-white"
                        style={{ background: accion === 'rechazar' ? '#dc2626' : '#16a34a' }}>
                        {guardando ? 'Procesando...'
                          : accion === 'aprobar'
                            ? <><Check size={14} /> Confirmar aprobación</>
                            : <><X size={14} /> Confirmar rechazo</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Guardar cambios de visibilidad (para no pendientes) */}
              {abogado.estado_aprobacion !== 'pendiente' && (
                <button onClick={guardarCambios} disabled={guardando} className="btn-primary w-full">
                  {guardando ? 'Guardando...' : <><Check size={14} /> Guardar cambios</>}
                </button>
              )}

              {/* Link a Usuarios para acciones avanzadas */}
              <Link to="/admin/usuarios"
                className="flex items-center justify-between p-3 rounded-xl font-body text-sm transition-colors"
                style={{ background: '#F7F6F4', color: '#56534A' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F7F6F4'; }}>
                <span>Otras acciones (deshabilitar, cambiar plan, eliminar)</span>
                <ChevronRight size={15} style={{ color: '#B0AEA8' }} />
              </Link>
            </>
          )}

          {/* ── Tab: Documentos ────────────────────────── */}
          {tab === 'documentos' && <TabDocumentos abogado={abogado} />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function AdminAbogados() {
  const [abogados,   setAbogados]   = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [tabActivo,  setTabActivo]  = useState('pendiente');
  const [busqueda,   setBusqueda]   = useState('');
  const [abogadoSel, setAbogadoSel] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/abogados');
      setAbogados(data.abogados || []);
    } catch { toast.error('No se pudieron cargar los abogados.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = abogados.filter(a => {
    const coincideTab = a.estado_aprobacion === tabActivo;
    const texto       = `${a.nombre} ${a.apellido} ${a.email}`.toLowerCase();
    return coincideTab && (!busqueda || texto.includes(busqueda.toLowerCase()));
  });

  const conteos = {
    pendiente: abogados.filter(a => a.estado_aprobacion === 'pendiente').length,
    aprobado:  abogados.filter(a => a.estado_aprobacion === 'aprobado').length,
    rechazado: abogados.filter(a => a.estado_aprobacion === 'rechazado').length,
  };

  const coloresBadge = {
    pendiente: { bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
    aprobado:  { bg: 'rgba(22,163,74,0.12)',  color: '#15803d' },
    rechazado: { bg: 'rgba(220,38,38,0.12)',  color: '#dc2626' },
  };

  const TABS = [
    { valor: 'pendiente', label: 'Pendientes' },
    { valor: 'aprobado',  label: 'Aprobados'  },
    { valor: 'rechazado', label: 'Rechazados' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de abogados</h1>
            <p className="section-subtitle">Revisá y aprobá los perfiles de los profesionales.</p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {conteos.pendiente > 0 && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertCircle size={18} style={{ color: '#b45309' }} className="shrink-0" />
            <p className="font-body text-sm" style={{ color: '#92400e' }}>
              Hay <strong>{conteos.pendiente}</strong> abogado{conteos.pendiente > 1 ? 's' : ''} esperando revisión.
            </p>
          </div>
        )}

        {/* Aviso de dónde hacer las otras acciones */}
        <div className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-3"
          style={{ background: '#F7F6F4', border: '1px solid #E8E6E3' }}>
          <p className="font-body text-sm" style={{ color: '#56534A' }}>
            Para deshabilitar, cambiar plan o eliminar un abogado, usá el panel de{' '}
            <strong>Usuarios</strong>.
          </p>
          <Link to="/admin/usuarios"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-sm font-medium shrink-0 transition-colors text-white"
            style={{ background: '#2C2B27' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}>
            Ir a Usuarios <ChevronRight size={14} />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(tab => (
            <button key={tab.valor} onClick={() => setTabActivo(tab.valor)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all"
              style={tabActivo === tab.valor
                ? { background: '#2C2B27', color: '#fff' }
                : { background: '#fff', border: '1px solid #E8E6E3', color: '#56534A' }}>
              {tab.label}
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={tabActivo === tab.valor
                  ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                  : coloresBadge[tab.valor]}>
                {conteos[tab.valor]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
          <input type="text" placeholder="Buscar por nombre o email..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="input-field pl-10" />
        </div>

        <div className="card overflow-hidden">
          {cargando && (
            <div>
              {[1,2,3].map(i => (
                <div key={i} className="px-6 py-4 flex gap-4 animate-pulse" style={{ borderBottom: '1px solid #F7F6F4' }}>
                  <div className="w-12 h-12 rounded-xl shrink-0" style={{ background: '#E8E6E3' }} />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                    <div className="h-3 rounded w-1/4" style={{ background: '#E8E6E3' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!cargando && filtrados.length === 0 && (
            <div className="py-16 text-center">
              <Check size={36} className="mx-auto mb-3" style={{ color: '#D4D2CC' }} />
              <p className="font-display text-xl mb-1" style={{ color: '#1C1B18' }}>
                {tabActivo === 'pendiente' ? '¡Todo al día!' : 'Sin resultados'}
              </p>
              <p className="font-body text-sm" style={{ color: '#8A8780' }}>
                {tabActivo === 'pendiente' ? 'No hay abogados pendientes de revisión.' : 'Probá otro filtro.'}
              </p>
            </div>
          )}

          {!cargando && filtrados.map((a, idx) => (
            <div key={a.id}
              className="flex items-start gap-4 px-6 py-5 transition-colors"
              style={{ borderBottom: idx < filtrados.length - 1 ? '1px solid #F7F6F4' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}>

              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: a.activo !== false ? '#2C2B27' : '#D4D2CC' }}>
                <span className="font-display font-bold text-white text-sm">
                  {a.nombre[0]}{a.apellido[0]}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-body font-semibold" style={{ color: '#1C1B18' }}>
                      Dr./Dra. {a.nombre} {a.apellido}
                    </p>
                    <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>{a.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <BadgePlan slug={a.plan_slug} />
                      {a.ciudad && (
                        <span className="flex items-center gap-1 text-xs font-body" style={{ color: '#8A8780' }}>
                          <MapPin size={11} /> {a.ciudad}
                        </span>
                      )}
                      {a.especialidades?.length > 0 && (
                        <span className="text-xs font-body" style={{ color: '#B0AEA8' }}>
                          {a.especialidades.slice(0, 2).join(', ')}
                          {a.especialidades.length > 2 && ` +${a.especialidades.length - 2}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-body px-2.5 py-1.5 rounded-full"
                      style={coloresBadge[tabActivo]}>
                      {tabActivo === 'pendiente' && <Clock size={11} />}
                      {tabActivo === 'aprobado'  && <Check size={11} />}
                      {tabActivo === 'rechazado' && <X size={11} />}
                      {tabActivo === 'pendiente' ? 'Pendiente' : tabActivo === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                    </div>
                    <button onClick={() => setAbogadoSel(a)}
                      className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-body font-medium text-white transition-colors"
                      style={{ background: tabActivo === 'pendiente' ? '#B86030' : '#2C2B27' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                      {tabActivo === 'pendiente' ? 'Revisar' : 'Ver'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {abogadoSel && (
        <ModalRevision abogado={abogadoSel}
          onCerrar={() => setAbogadoSel(null)}
          onActualizar={cargar} />
      )}
    </div>
  );
}
