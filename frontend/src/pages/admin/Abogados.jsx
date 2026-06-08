// ============================================================
// src/pages/admin/Abogados.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Check, X, Search, MapPin,
  RefreshCw, Clock, AlertCircle, Edit2, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

const ESPECIALIDADES_DISPONIBLES = [
  'Derecho Civil', 'Derecho Laboral', 'Derecho Penal',
  'Derecho de Familia', 'Derecho Comercial', 'Derecho Administrativo',
  'Derecho Tributario', 'Derecho Inmobiliario', 'Derecho de Daños',
  'Derecho del Consumidor', 'Propiedad Intelectual', 'Derecho Migratorio',
  'Derecho Societario', 'Derecho Ambiental', 'Mediación',
];

function BadgePlan({ slug }) {
  const mapa = {
    basico:    { label: 'Básico',      bg: 'rgba(184,96,48,0.1)', color: '#8B4A1E' },
    comunidad: { label: '★ Comunidad', bg: '#B86030',             color: '#fff'    },
  };
  const cfg = mapa[slug] || { label: slug, bg: '#F0EFED', color: '#56534A' };
  return (
    <span className="text-xs font-body font-medium px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
  );
}

function ModalAbogado({ abogado, onCerrar, onActualizar }) {
  const [tab,       setTab]       = useState('revision');
  const [guardando, setGuardando] = useState(false);
  const [accion,    setAccion]    = useState('');
  const [motivo,    setMotivo]    = useState('');
  const [espSel,    setEspSel]    = useState(abogado.especialidades || []);
  const [datos,     setDatos]     = useState({
    visible: abogado.visible_en_grilla,
    matricula_verificada: abogado.matricula_verificada,
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      descripcion:      abogado.descripcion || '',
      anos_experiencia: abogado.anos_experiencia || '',
      ciudad:           abogado.ciudad || '',
      provincia:        abogado.provincia || '',
      matricula:        abogado.matricula || '',
    }
  });

  const toggleEsp = (esp) =>
    setEspSel(prev => prev.includes(esp) ? prev.filter(e => e !== esp) : [...prev, esp]);

  const ejecutarAccion = async () => {
    if (accion === 'rechazar' && !motivo.trim()) { toast.error('Ingresá el motivo del rechazo.'); return; }
    setGuardando(true);
    try {
      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, {
        accion, motivo: accion === 'rechazar' ? motivo : undefined,
        visible:              datos.visible,
        matricula_verificada: datos.matricula_verificada,
      });
      toast.success(accion === 'aprobar' ? '✅ Perfil aprobado.' : '❌ Perfil rechazado.');
      onActualizar(); onCerrar();
    } catch { toast.error('Error al procesar la acción.'); }
    finally { setGuardando(false); }
  };

  const onSubmitPerfil = async (formDatos) => {
    setGuardando(true);
    try {
      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, {
        visible: datos.visible, matricula_verificada: datos.matricula_verificada,
      });
      await api.put(`/admin/abogados/${abogado.id}/perfil`, { ...formDatos, especialidades: espSel });
      toast.success('Perfil actualizado correctamente.');
      onActualizar(); onCerrar();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar.'); }
    finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-2xl animate-slide-up max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between p-6 border-b shrink-0" style={{ borderColor: '#F0EFED' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#2C2B27' }}>
              <span className="font-display font-bold text-white">{abogado.nombre[0]}{abogado.apellido[0]}</span>
            </div>
            <div>
              <h3 className="font-display font-bold" style={{ color: '#1C1B18' }}>
                Dr./Dra. {abogado.nombre} {abogado.apellido}
              </h3>
              <p className="font-body text-xs" style={{ color: '#8A8780' }}>{abogado.email}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {[{ id: 'revision', label: 'Revisión y estado' }, { id: 'perfil', label: 'Editar perfil' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-xl text-sm font-body font-medium transition-all"
              style={tab === t.id ? { background: '#2C2B27', color: '#fff' } : { color: '#56534A' }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = '#F0EFED'; }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = ''; }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">

          {tab === 'revision' && (
            <div className="space-y-4">

              {/* ── Documentación del abogado ─────────────── */}
              <div className="rounded-xl p-4" style={{ background: '#F7F6F4' }}>
                <p className="font-body text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: '#8A8780' }}>
                  Documentación adjunta
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Credencial del letrado', url: abogado.doc_credencial_url },
                    { label: 'Título universitario',   url: abogado.doc_titulo_url     },
                    { label: 'Constancia de CUIL',     url: abogado.doc_cuil_url       },
                  ].map(({ label, url }) => (
                    <div key={label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                      style={{ background: '#fff', border: '1px solid #E8E6E3' }}>
                      <span className="font-body text-sm" style={{ color: '#3A3832' }}>{label}</span>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                          style={{ background: 'rgba(184,96,48,0.1)', color: '#B86030' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.2)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.1)'; }}
                        >
                          Ver documento
                        </a>
                      ) : (
                        <span className="font-body text-xs px-3 py-1 rounded-lg"
                          style={{ background: '#F0EFED', color: '#B0AEA8' }}>
                          No adjunto
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Plan',       val: <BadgePlan slug={abogado.plan_slug} /> },
                  { label: 'Estado',     val: (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={abogado.estado_aprobacion === 'aprobado'
                        ? { background: 'rgba(22,163,74,0.1)', color: '#15803d' }
                        : abogado.estado_aprobacion === 'rechazado'
                          ? { background: 'rgba(220,38,38,0.1)', color: '#dc2626' }
                          : { background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>
                      {abogado.estado_aprobacion}
                    </span>
                  )},
                  { label: 'DNI / CUIT', val: abogado.dni_cuit || '—' },
                  { label: 'Ubicación',  val: abogado.ciudad || '—' },
                  { label: 'Matrícula',  val: abogado.matricula || '—' },
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

              <div className="space-y-3">
                {[
                  { campo: 'visible', label: 'Visible en búsqueda', desc: 'Aparece en el catálogo público' },
                  { campo: 'matricula_verificada', label: 'Matrícula verificada', desc: 'Muestra el sello de verificación' },
                ].map(({ campo, label, desc }) => (
                  <div key={campo} className="flex items-center justify-between p-4 rounded-xl border-2 transition-all"
                    style={{ borderColor: datos[campo] ? '#2C2B27' : '#E8E6E3' }}>
                    <div className="flex items-center gap-3">
                      <Shield size={16} style={{ color: datos[campo] ? '#2C2B27' : '#B0AEA8' }} />
                      <div>
                        <p className="font-body font-medium text-sm" style={{ color: '#1C1B18' }}>{label}</p>
                        <p className="font-body text-xs" style={{ color: '#8A8780' }}>{desc}</p>
                      </div>
                    </div>
                    <div onClick={() => setDatos(d => ({ ...d, [campo]: !d[campo] }))}
                      className="relative w-11 h-6 rounded-full cursor-pointer transition-colors"
                      style={{ background: datos[campo] ? '#2C2B27' : '#E8E6E3' }}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${datos[campo] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </div>
                ))}
              </div>

              {abogado.estado_aprobacion === 'pendiente' && (
                <div className="space-y-3 pt-2">
                  {!accion && (
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setAccion('aprobar')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                        style={{ background: 'rgba(22,163,74,0.08)', color: '#15803d', borderColor: 'rgba(22,163,74,0.2)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#15803d'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.2)'; }}>
                        <Check size={16} /> Aprobar perfil
                      </button>
                      <button onClick={() => setAccion('rechazar')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm border-2 transition-colors"
                        style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626', borderColor: 'rgba(220,38,38,0.15)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(220,38,38,0.15)'; }}>
                        <X size={16} /> Rechazar perfil
                      </button>
                    </div>
                  )}
                  {accion === 'rechazar' && (
                    <div className="animate-slide-down">
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
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-body font-medium text-sm text-white transition-colors"
                        style={{ background: accion === 'rechazar' ? '#dc2626' : '#16a34a' }}>
                        {guardando ? 'Procesando...'
                          : accion === 'aprobar'
                            ? <><Check size={15} /> Confirmar aprobación</>
                            : <><X size={15} /> Confirmar rechazo</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              )}

              {abogado.estado_aprobacion !== 'pendiente' && (
                <button onClick={async () => {
                    setGuardando(true);
                    try {
                      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, datos);
                      toast.success('Estado actualizado.');
                      onActualizar(); onCerrar();
                    } catch { toast.error('Error al guardar.'); }
                    finally { setGuardando(false); }
                  }}
                  disabled={guardando} className="btn-primary w-full">
                  {guardando ? 'Guardando...' : <><Save size={15} /> Guardar cambios</>}
                </button>
              )}
            </div>
          )}

          {tab === 'perfil' && (
            <form onSubmit={handleSubmit(onSubmitPerfil)} className="space-y-5">
              <div>
                <label className="input-label">Descripción profesional</label>
                <textarea rows={4} placeholder="Bio del abogado..." className="input-field resize-none"
                  {...register('descripcion', { maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } })} />
                {errors.descripcion && <p className="input-error">{errors.descripcion.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Matrícula</label>
                  <input type="text" placeholder="T-12345" className="input-field" {...register('matricula')} />
                </div>
                <div>
                  <label className="input-label">Años de experiencia</label>
                  <input type="number" min="0" max="70" className="input-field" {...register('anos_experiencia')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Ciudad</label>
                  <input type="text" className="input-field" {...register('ciudad')} />
                </div>
                <div>
                  <label className="input-label">Provincia</label>
                  <input type="text" className="input-field" {...register('provincia')} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="input-label mb-0">Especialidades</label>
                  <span className="font-body text-xs" style={{ color: '#8A8780' }}>{espSel.length} seleccionadas</span>
                </div>
                <div className="flex flex-wrap gap-2 p-4 rounded-xl" style={{ background: '#F7F6F4' }}>
                  {ESPECIALIDADES_DISPONIBLES.map(esp => {
                    const sel = espSel.includes(esp);
                    return (
                      <button key={esp} type="button" onClick={() => toggleEsp(esp)}
                        className="px-3 py-1.5 rounded-xl text-xs font-body font-medium border-2 transition-all"
                        style={sel
                          ? { borderColor: '#2C2B27', background: '#2C2B27', color: '#fff' }
                          : { borderColor: '#E8E6E3', background: '#fff', color: '#56534A' }}>
                        {sel && <Check size={10} className="inline mr-1" />}{esp}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-primary flex-1">
                  {guardando ? 'Guardando...' : <><Save size={15} /> Guardar perfil</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const abogadosFiltrados = abogados.filter(a => {
    const coincideTab      = a.estado_aprobacion === tabActivo;
    const texto            = `${a.nombre} ${a.apellido} ${a.email}`.toLowerCase();
    const coincideBusqueda = !busqueda || texto.includes(busqueda.toLowerCase());
    return coincideTab && coincideBusqueda;
  });

  const conteos = {
    pendiente: abogados.filter(a => a.estado_aprobacion === 'pendiente').length,
    aprobado:  abogados.filter(a => a.estado_aprobacion === 'aprobado').length,
    rechazado: abogados.filter(a => a.estado_aprobacion === 'rechazado').length,
  };

  const TABS = [
    { valor: 'pendiente', label: 'Pendientes' },
    { valor: 'aprobado',  label: 'Aprobados'  },
    { valor: 'rechazado', label: 'Rechazados' },
  ];

  const coloresBadge = {
    pendiente: { bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
    aprobado:  { bg: 'rgba(22,163,74,0.12)',  color: '#15803d' },
    rechazado: { bg: 'rgba(220,38,38,0.12)',  color: '#dc2626' },
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de abogados</h1>
            <p className="section-subtitle">Revisá, aprobá y editá los perfiles de los profesionales.</p>
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

          {!cargando && abogadosFiltrados.length === 0 && (
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

          {!cargando && abogadosFiltrados.map((a, idx) => (
            <div key={a.id}
              className="flex items-start gap-4 px-6 py-5 transition-colors"
              style={{ borderBottom: idx < abogadosFiltrados.length - 1 ? '1px solid #F7F6F4' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}>

              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#2C2B27' }}>
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
                      {tabActivo === 'pendiente' ? 'Revisar' : <><Edit2 size={12} /> Editar</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {abogadoSel && (
        <ModalAbogado abogado={abogadoSel}
          onCerrar={() => setAbogadoSel(null)}
          onActualizar={cargar} />
      )}
    </div>
  );
}
