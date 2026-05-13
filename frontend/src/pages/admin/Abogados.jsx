// ============================================================
// src/pages/admin/Abogados.jsx
// Gestión de abogados — con flujo completo de aprobación
// Tabs: Pendientes / Aprobados / Rechazados
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Eye, EyeOff, Check, X,
  Search, Star, MapPin, RefreshCw,
  Clock, AlertCircle, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Badge de plan
// ─────────────────────────────────────────────────────────────
function BadgePlan({ slug }) {
  const mapa = {
    gratuito: 'badge-plan-gratuito',
    basico:   'badge-plan-basico',
    premium:  'badge-plan-premium',
  };
  const labels = { gratuito: 'Gratuito', basico: 'Básico', premium: '★ Premium' };
  return <span className={mapa[slug] || 'badge-plan-gratuito'}>{labels[slug] || slug}</span>;
}

// ─────────────────────────────────────────────────────────────
// Componente: Modal de revisión del abogado
// Permite aprobar, rechazar o modificar visibilidad
// ─────────────────────────────────────────────────────────────
function ModalRevision({ abogado, onCerrar, onActualizar }) {
  const [accion,   setAccion]   = useState('');      // 'aprobar' | 'rechazar' | ''
  const [motivo,   setMotivo]   = useState('');
  const [matriculaVerificada, setMatriculaVerificada] = useState(abogado.matricula_verificada);
  const [guardando, setGuardando] = useState(false);

  const ejecutar = async () => {
    if (accion === 'rechazar' && !motivo.trim()) {
      toast.error('Por favor ingresá el motivo del rechazo.');
      return;
    }

    setGuardando(true);
    try {
      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, {
        accion,
        motivo:               accion === 'rechazar' ? motivo : undefined,
        matricula_verificada: matriculaVerificada,
      });

      toast.success(
        accion === 'aprobar'
          ? '✅ Perfil aprobado. El abogado fue notificado.'
          : '❌ Perfil rechazado. El abogado fue notificado.'
      );
      onActualizar();
      onCerrar();
    } catch {
      toast.error('Error al procesar la acción.');
    } finally {
      setGuardando(false);
    }
  };

  // Si solo quiere actualizar sin aprobar/rechazar
  const soloActualizar = async () => {
    setGuardando(true);
    try {
      await api.patch(`/admin/abogados/${abogado.id}/aprobar`, {
        matricula_verificada: matriculaVerificada,
      });
      toast.success('Perfil actualizado.');
      onActualizar();
      onCerrar();
    } catch {
      toast.error('Error al actualizar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">

        {/* Encabezado */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-white text-xl">
                {abogado.nombre[0]}{abogado.apellido[0]}
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-navy-900 text-xl">
                Dr./Dra. {abogado.nombre} {abogado.apellido}
              </h3>
              <p className="font-body text-sm text-slate-500">{abogado.email}</p>
              <p className="font-body text-xs text-slate-400 mt-0.5">
                Registrado el {format(new Date(abogado.creado_en), "d 'de' MMMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Datos del perfil */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-sm font-body">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Plan</p>
            <BadgePlan slug={abogado.plan_slug} />
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Matrícula</p>
            <p className="text-navy-900 font-medium">{abogado.matricula || '—'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Ubicación</p>
            <p className="text-navy-900">{abogado.ciudad || '—'}, {abogado.provincia || ''}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Perfil completo</p>
            <p className={abogado.perfil_completo ? 'text-green-600 font-medium' : 'text-amber-600'}>
              {abogado.perfil_completo ? 'Sí ✓' : 'Incompleto'}
            </p>
          </div>
        </div>

        {/* Especialidades */}
        {abogado.especialidades?.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-3 mb-5">
            <p className="font-body text-xs text-slate-400 mb-2">Especialidades</p>
            <div className="flex flex-wrap gap-1.5">
              {abogado.especialidades.map(esp => (
                <span key={esp} className="px-2.5 py-1 bg-navy-50 text-navy-700 text-xs rounded-full font-body">
                  {esp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Descripción */}
        {abogado.descripcion && (
          <div className="bg-slate-50 rounded-xl p-3 mb-5">
            <p className="font-body text-xs text-slate-400 mb-2">Descripción profesional</p>
            <p className="font-body text-sm text-slate-700 leading-relaxed line-clamp-4">
              {abogado.descripcion}
            </p>
          </div>
        )}

        {/* Toggle verificar matrícula */}
        <label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-navy-300 transition-colors mb-5">
          <div className="flex items-center gap-3">
            <Shield size={18} className={matriculaVerificada ? 'text-navy-700' : 'text-slate-400'} />
            <div>
              <p className="font-body font-medium text-navy-900 text-sm">Matrícula verificada</p>
              <p className="font-body text-xs text-slate-400">Muestra el sello de verificación en el perfil</p>
            </div>
          </div>
          <div
            onClick={() => setMatriculaVerificada(!matriculaVerificada)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${matriculaVerificada ? 'bg-navy-900' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${matriculaVerificada ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </label>

        {/* ── Botones de acción según estado ───────────── */}
        {abogado.estado_aprobacion === 'pendiente' && (
          <>
            {/* Selección de acción */}
            {!accion && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setAccion('aprobar')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-700 border-2 border-green-100 hover:border-green-300 font-body font-medium text-sm transition-colors"
                >
                  <Check size={16} /> Aprobar perfil
                </button>
                <button
                  onClick={() => setAccion('rechazar')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 border-2 border-red-100 hover:border-red-300 font-body font-medium text-sm transition-colors"
                >
                  <X size={16} /> Rechazar perfil
                </button>
              </div>
            )}

            {/* Campo de motivo (solo si rechaza) */}
            {accion === 'rechazar' && (
              <div className="mb-4 animate-slide-down">
                <label className="input-label">Motivo del rechazo (se enviará al abogado)</label>
                <textarea
                  rows={3}
                  placeholder="Ej: La matrícula ingresada no pudo ser verificada. Por favor actualizá los datos y volvé a solicitar la revisión."
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  className="input-field resize-none"
                />
              </div>
            )}

            {/* Confirmación de la acción elegida */}
            {accion && (
              <div className="flex gap-3">
                <button onClick={() => setAccion('')} className="btn-secondary flex-1">
                  Volver
                </button>
                <button onClick={ejecutar} disabled={guardando}
                  className={`flex-1 btn-primary ${accion === 'rechazar' ? 'bg-red-500 hover:bg-red-600' : ''}`}>
                  {guardando ? 'Procesando...' : accion === 'aprobar' ? '✅ Confirmar aprobación' : '❌ Confirmar rechazo'}
                </button>
              </div>
            )}

            {/* Botón solo guardar cambios de matrícula */}
            {!accion && (
              <button onClick={soloActualizar} disabled={guardando} className="btn-secondary w-full mt-3">
                {guardando ? 'Guardando...' : 'Solo guardar cambios de matrícula'}
              </button>
            )}
          </>
        )}

        {/* Si ya fue aprobado/rechazado, solo mostrar botón de cerrar */}
        {abogado.estado_aprobacion !== 'pendiente' && (
          <div className="flex gap-3">
            <button onClick={soloActualizar} disabled={guardando} className="btn-secondary flex-1">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button onClick={onCerrar} className="btn-primary flex-1">Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function AdminAbogados() {
  const [abogados,    setAbogados]    = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [tabActivo,   setTabActivo]   = useState('pendiente'); // tab de filtro
  const [busqueda,    setBusqueda]    = useState('');
  const [abogadoSel,  setAbogadoSel]  = useState(null);

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

  // Filtrar por tab y búsqueda
  const abogadosFiltrados = abogados.filter(a => {
    const coincideTab     = a.estado_aprobacion === tabActivo;
    const texto           = `${a.nombre} ${a.apellido} ${a.email}`.toLowerCase();
    const coincideBusqueda = !busqueda || texto.includes(busqueda.toLowerCase());
    return coincideTab && coincideBusqueda;
  });

  // Contadores por estado para los tabs
  const conteos = {
    pendiente: abogados.filter(a => a.estado_aprobacion === 'pendiente').length,
    aprobado:  abogados.filter(a => a.estado_aprobacion === 'aprobado').length,
    rechazado: abogados.filter(a => a.estado_aprobacion === 'rechazado').length,
  };

  const TABS = [
    { valor: 'pendiente', label: 'Pendientes de revisión', colorBadge: 'bg-amber-100 text-amber-700' },
    { valor: 'aprobado',  label: 'Aprobados',              colorBadge: 'bg-green-100 text-green-700' },
    { valor: 'rechazado', label: 'Rechazados',             colorBadge: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Gestión de abogados</h1>
            <p className="section-subtitle">Revisá y aprobá los perfiles de nuevos profesionales.</p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Alerta si hay pendientes */}
        {conteos.pendiente > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="font-body text-sm text-amber-700">
              Hay <strong>{conteos.pendiente}</strong> abogado{conteos.pendiente > 1 ? 's' : ''} esperando revisión.
            </p>
          </div>
        )}

        {/* Tabs de estado */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(tab => (
            <button
              key={tab.valor}
              onClick={() => setTabActivo(tab.valor)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${
                tabActivo === tab.valor
                  ? 'bg-navy-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300'
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
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Lista de abogados */}
        <div className="card overflow-hidden">

          {/* Skeleton */}
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

          {/* Sin resultados */}
          {!cargando && abogadosFiltrados.length === 0 && (
            <div className="py-16 text-center">
              {tabActivo === 'pendiente' ? (
                <>
                  <Check size={36} className="text-green-300 mx-auto mb-3" />
                  <p className="font-display text-xl text-navy-900 mb-1">¡Todo al día!</p>
                  <p className="font-body text-slate-500 text-sm">No hay abogados pendientes de revisión.</p>
                </>
              ) : (
                <>
                  <Search size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="font-body text-slate-500">No se encontraron abogados.</p>
                </>
              )}
            </div>
          )}

          {/* Filas */}
          {!cargando && abogadosFiltrados.map(a => (
            <div key={a.id}
              className="flex items-start gap-4 px-6 py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">

              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center shrink-0">
                <span className="font-display font-bold text-white">
                  {a.nombre[0]}{a.apellido[0]}
                </span>
              </div>

              {/* Datos */}
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
                      {a.matricula && (
                        <span className="text-xs text-slate-500 font-body">
                          Mat: {a.matricula}
                        </span>
                      )}
                    </div>
                    {/* Motivo de rechazo si fue rechazado */}
                    {a.estado_aprobacion === 'rechazado' && a.motivo_rechazo && (
                      <p className="font-body text-xs text-red-500 mt-1.5 bg-red-50 px-2 py-1 rounded-lg">
                        Motivo: {a.motivo_rechazo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Badge estado */}
                    {tabActivo === 'pendiente' && (
                      <div className="flex items-center gap-1.5 text-xs font-body px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                        <Clock size={11} /> Pendiente
                      </div>
                    )}
                    {tabActivo === 'aprobado' && (
                      <div className="flex items-center gap-1.5 text-xs font-body px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                        <Check size={11} /> Aprobado
                      </div>
                    )}

                    {/* Botón de revisión */}
                    <button
                      onClick={() => setAbogadoSel(a)}
                      className={`text-xs px-4 py-2 rounded-xl font-body font-medium transition-colors ${
                        tabActivo === 'pendiente'
                          ? 'bg-navy-900 text-white hover:bg-navy-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tabActivo === 'pendiente' ? 'Revisar' : 'Ver / Editar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {abogadoSel && (
        <ModalRevision
          abogado={abogadoSel}
          onCerrar={() => setAbogadoSel(null)}
          onActualizar={cargar}
        />
      )}
    </div>
  );
}
