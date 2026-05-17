// ============================================================
// src/pages/admin/Abogados.jsx
// Gestión de abogados con flujo de aprobación y edición de perfil
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Eye, EyeOff, Check, X,
  Search, Star, MapPin, RefreshCw,
  Clock, AlertCircle, Edit2, Save
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

// Especialidades disponibles
const ESPECIALIDADES_DISPONIBLES = [
  'Derecho Civil', 'Derecho Laboral', 'Derecho Penal',
  'Derecho de Familia', 'Derecho Comercial', 'Derecho Administrativo',
  'Derecho Tributario', 'Derecho Inmobiliario', 'Derecho de Daños',
  'Derecho del Consumidor', 'Propiedad Intelectual', 'Derecho Migratorio',
  'Derecho Societario', 'Derecho Ambiental', 'Mediación',
];

// ─────────────────────────────────────────────────────────────
// Badge de plan
// ─────────────────────────────────────────────────────────────
function BadgePlan({ slug }) {
  const mapa = {
    basico:    'badge-plan-basico',
    comunidad: 'badge-plan-premium',
  };
  const labels = { basico: 'Básico', comunidad: '★ Comunidad' };
  return <span className={mapa[slug] || 'badge-plan-gratuito'}>{labels[slug] || slug}</span>;
}

// ─────────────────────────────────────────────────────────────
// Modal de revisión y edición completa del perfil
// ─────────────────────────────────────────────────────────────
function ModalAbogado({ abogado, onCerrar, onActualizar }) {
  const [tab, setTab]           = useState('revision'); // 'revision' | 'perfil'
  const [guardando, setGuardando] = useState(false);
  const [accion, setAccion]     = useState('');
  const [motivo, setMotivo]     = useState('');
  const [espSel, setEspSel]     = useState(abogado.especialidades || []);
  const [datos, setDatos]       = useState({
    visible:              abogado.visible_en_grilla,
    matricula_verificada: abogado.matricula_verificada,
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      descripcion:          abogado.descripcion || '',
      anos_experiencia:     abogado.anos_experiencia || '',
      ciudad:               abogado.ciudad || '',
      provincia:            abogado.provincia || '',
      matricula:            abogado.matricula || '',
    }
  });

  // Toggle de especialidad
  const toggleEsp = (esp) => {
    setEspSel(prev =>
      prev.includes(esp) ? prev.filter(e => e !== esp) : [...prev, esp]
    );
  };

  // Aprobar / rechazar
  const ejecutarAccion = async () => {
    if (accion === 'rechazar' && !motivo.trim()) {
      toast.error('Ingresá el motivo del rechazo.');
      return;
    }
    setGuardando(true);
    try {
      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, {
        accion,
        motivo: accion === 'rechazar' ? motivo : undefined,
        matricula_verificada: datos.matricula_verificada,
      });
      toast.success(accion === 'aprobar' ? '✅ Perfil aprobado.' : '❌ Perfil rechazado.');
      onActualizar();
      onCerrar();
    } catch {
      toast.error('Error al procesar la acción.');
    } finally {
      setGuardando(false);
    }
  };

  // Guardar edición del perfil
  const onSubmitPerfil = async (formDatos) => {
    setGuardando(true);
    try {
      // Actualizar datos del usuario (descripción, ciudad, etc.)
      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, {
        visible:              datos.visible,
        matricula_verificada: datos.matricula_verificada,
      });

      // Actualizar perfil completo via endpoint del abogado
      await api.put(`/admin/abogados/${abogado.id}/perfil`, {
        ...formDatos,
        especialidades: espSel,
      });

      toast.success('Perfil actualizado correctamente.');
      onActualizar();
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-2xl animate-slide-up max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center">
              <span className="font-display font-bold text-white">
                {abogado.nombre[0]}{abogado.apellido[0]}
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-navy-900">
                Dr./Dra. {abogado.nombre} {abogado.apellido}
              </h3>
              <p className="font-body text-xs text-slate-400">{abogado.email}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {[
            { id: 'revision', label: 'Revisión y estado' },
            { id: 'perfil',   label: 'Editar perfil' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-body font-medium transition-all ${
                tab === t.id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ── Tab: Revisión ─────────────────────────────── */}
          {tab === 'revision' && (
            <div className="space-y-4">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">Plan</p>
                  <BadgePlan slug={abogado.plan_slug} />
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">Estado</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    abogado.estado_aprobacion === 'aprobado'
                      ? 'bg-green-50 text-green-700'
                      : abogado.estado_aprobacion === 'rechazado'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-700'
                  }`}>
                    {abogado.estado_aprobacion}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">Ubicación</p>
                  <p className="text-navy-900 text-sm">{abogado.ciudad || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">Matrícula</p>
                  <p className="text-navy-900 text-sm">{abogado.matricula || '—'}</p>
                </div>
              </div>

              {/* Descripción */}
              {abogado.descripcion && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2 font-body">Descripción</p>
                  <p className="font-body text-sm text-slate-700 leading-relaxed line-clamp-4">
                    {abogado.descripcion}
                  </p>
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3">
                {[
                  { campo: 'visible', label: 'Visible en búsqueda', desc: 'Aparece en el catálogo público' },
                  { campo: 'matricula_verificada', label: 'Matrícula verificada', desc: 'Muestra el sello de verificación' },
                ].map(({ campo, label, desc }) => (
                  <div key={campo} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200">
                    <div className="flex items-center gap-3">
                      <Shield size={16} className={datos[campo] ? 'text-navy-700' : 'text-slate-400'} />
                      <div>
                        <p className="font-body font-medium text-navy-900 text-sm">{label}</p>
                        <p className="font-body text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                    <div
                      onClick={() => setDatos(d => ({ ...d, [campo]: !d[campo] }))}
                      className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${datos[campo] ? 'bg-navy-900' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${datos[campo] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Acciones de aprobación */}
              {abogado.estado_aprobacion === 'pendiente' && (
                <div className="space-y-3 pt-2">
                  {!accion && (
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setAccion('aprobar')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-700 border-2 border-green-100 hover:border-green-300 font-body font-medium text-sm transition-colors">
                        <Check size={16} /> Aprobar perfil
                      </button>
                      <button onClick={() => setAccion('rechazar')}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 border-2 border-red-100 hover:border-red-300 font-body font-medium text-sm transition-colors">
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
                        className={`flex-1 btn-primary ${accion === 'rechazar' ? 'bg-red-500 hover:bg-red-600' : ''}`}>
                        {guardando ? 'Procesando...' : accion === 'aprobar' ? '✅ Confirmar aprobación' : '❌ Confirmar rechazo'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Guardar cambios de visibilidad si ya está aprobado */}
              {abogado.estado_aprobacion !== 'pendiente' && (
                <button
                  onClick={async () => {
                    setGuardando(true);
                    try {
                      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, datos);
                      toast.success('Estado actualizado.');
                      onActualizar();
                      onCerrar();
                    } catch { toast.error('Error al guardar.'); }
                    finally { setGuardando(false); }
                  }}
                  disabled={guardando}
                  className="btn-primary w-full"
                >
                  {guardando ? 'Guardando...' : <><Save size={15} /> Guardar cambios</>}
                </button>
              )}
            </div>
          )}

          {/* ── Tab: Editar perfil ────────────────────────── */}
          {tab === 'perfil' && (
            <form onSubmit={handleSubmit(onSubmitPerfil)} className="space-y-5">

              {/* Descripción */}
              <div>
                <label className="input-label">Descripción profesional</label>
                <textarea rows={4} placeholder="Bio del abogado..."
                  className="input-field resize-none"
                  {...register('descripcion', { maxLength: { value: 2000, message: 'Máximo 2000 caracteres' } })}
                />
                {errors.descripcion && <p className="input-error">{errors.descripcion.message}</p>}
              </div>

              {/* Matrícula y experiencia */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Matrícula</label>
                  <input type="text" placeholder="T-12345" className="input-field"
                    {...register('matricula')} />
                </div>
                <div>
                  <label className="input-label">Años de experiencia</label>
                  <input type="number" min="0" max="70" placeholder="Ej: 10" className="input-field"
                    {...register('anos_experiencia')} />
                </div>
              </div>

              {/* Ciudad y provincia */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Ciudad</label>
                  <input type="text" placeholder="Ej: Buenos Aires" className="input-field"
                    {...register('ciudad')} />
                </div>
                <div>
                  <label className="input-label">Provincia</label>
                  <input type="text" placeholder="Ej: Buenos Aires" className="input-field"
                    {...register('provincia')} />
                </div>
              </div>

              {/* Especialidades */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="input-label mb-0">Especialidades</label>
                  <span className="font-body text-xs text-slate-400">{espSel.length} seleccionadas</span>
                </div>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl">
                  {ESPECIALIDADES_DISPONIBLES.map(esp => {
                    const sel = espSel.includes(esp);
                    return (
                      <button key={esp} type="button" onClick={() => toggleEsp(esp)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-body font-medium border-2 transition-all ${
                          sel ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-navy-300'
                        }`}
                      >
                        {sel && <Check size={11} className="inline mr-1" />}
                        {esp}
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
    } catch {
      toast.error('No se pudieron cargar los abogados.');
    } finally {
      setCargando(false);
    }
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
    { valor: 'pendiente', label: 'Pendientes', colorBadge: 'bg-amber-100 text-amber-700' },
    { valor: 'aprobado',  label: 'Aprobados',  colorBadge: 'bg-green-100 text-green-700' },
    { valor: 'rechazado', label: 'Rechazados', colorBadge: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de abogados</h1>
            <p className="section-subtitle">Revisá, aprobá y editá los perfiles de los profesionales.</p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {/* Alerta pendientes */}
        {conteos.pendiente > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="font-body text-sm text-amber-700">
              Hay <strong>{conteos.pendiente}</strong> abogado{conteos.pendiente > 1 ? 's' : ''} esperando revisión.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(tab => (
            <button key={tab.valor} onClick={() => setTabActivo(tab.valor)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${
                tabActivo === tab.valor ? 'bg-navy-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                tabActivo === tab.valor ? 'bg-white/20 text-white' : tab.colorBadge
              }`}>
                {conteos[tab.valor]}
              </span>
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre o email..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="input-field pl-10" />
        </div>

        {/* Lista */}
        <div className="card overflow-hidden">
          {cargando && (
            <div className="divide-y divide-slate-50">
              {[1, 2, 3].map(i => (
                <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!cargando && abogadosFiltrados.length === 0 && (
            <div className="py-16 text-center">
              <Check size={36} className="text-green-300 mx-auto mb-3" />
              <p className="font-display text-xl text-navy-900 mb-1">
                {tabActivo === 'pendiente' ? '¡Todo al día!' : 'Sin resultados'}
              </p>
              <p className="font-body text-slate-500 text-sm">
                {tabActivo === 'pendiente' ? 'No hay abogados pendientes de revisión.' : 'Probá otro filtro.'}
              </p>
            </div>
          )}

          {!cargando && abogadosFiltrados.map(a => (
            <div key={a.id}
              className="flex items-start gap-4 px-6 py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">

              <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center shrink-0">
                <span className="font-display font-bold text-white text-sm">
                  {a.nombre[0]}{a.apellido[0]}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-body font-semibold text-navy-900">
                      Dr./Dra. {a.nombre} {a.apellido}
                    </p>
                    <p className="font-body text-xs text-slate-400">{a.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <BadgePlan slug={a.plan_slug} />
                      {a.ciudad && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-body">
                          <MapPin size={11} /> {a.ciudad}
                        </span>
                      )}
                      {a.especialidades?.length > 0 && (
                        <span className="text-xs text-slate-400 font-body">
                          {a.especialidades.slice(0, 2).join(', ')}
                          {a.especialidades.length > 2 && ` +${a.especialidades.length - 2}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`flex items-center gap-1.5 text-xs font-body px-2.5 py-1 rounded-full ${
                      tabActivo === 'pendiente' ? 'bg-amber-50 text-amber-700' :
                      tabActivo === 'aprobado'  ? 'bg-green-50 text-green-700' :
                                                  'bg-red-50 text-red-600'
                    }`}>
                      {tabActivo === 'pendiente' && <Clock size={11} />}
                      {tabActivo === 'aprobado'  && <Check size={11} />}
                      {tabActivo === 'rechazado' && <X size={11} />}
                      {tabActivo === 'pendiente' ? 'Pendiente' : tabActivo === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                    </div>

                    <button onClick={() => setAbogadoSel(a)}
                      className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-body font-medium transition-colors ${
                        tabActivo === 'pendiente'
                          ? 'bg-navy-900 text-white hover:bg-navy-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}>
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
        <ModalAbogado
          abogado={abogadoSel}
          onCerrar={() => setAbogadoSel(null)}
          onActualizar={cargar}
        />
      )}
    </div>
  );
}
