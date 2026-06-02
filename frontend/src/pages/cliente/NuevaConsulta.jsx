// ============================================================
// src/pages/cliente/NuevaConsulta.jsx — Paleta C
// El cliente agenda una consulta eligiendo entre los slots
// reales de disponibilidad del abogado
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, Calendar, Clock, Video,
  Building2, Shield, Star, AlertCircle, Check
} from 'lucide-react';
import {
  format, addDays, startOfToday, getDay, parseISO, setHours, setMinutes
} from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

// getDay() devuelve 0=Domingo,1=Lunes,...,6=Sábado
// Nuestra DB usa 1=Lunes,...,7=Domingo
const getDiaSemanaDB = (fecha) => {
  const d = getDay(fecha); // 0=Dom
  return d === 0 ? 7 : d;  // convertir Domingo de 0 → 7
};

// Genera los próximos 60 días a partir de mañana
const generarProximos60Dias = () => {
  const dias = [];
  let d = addDays(startOfToday(), 1);
  for (let i = 0; i < 60; i++) {
    dias.push(d);
    d = addDays(d, 1);
  }
  return dias;
};

const TODOS_LOS_DIAS = generarProximos60Dias();

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
export default function NuevaConsulta() {
  const { abogadoId } = useParams();
  const navigate      = useNavigate();

  const [abogado,        setAbogado]        = useState(null);
  const [disponibilidad, setDisponibilidad] = useState([]); // slots del abogado
  const [cargando,       setCargando]       = useState(true);
  const [enviando,       setEnviando]       = useState(false);
  const [fechaSel,       setFechaSel]       = useState(null);
  const [slotSel,        setSlotSel]        = useState(null); // { hora_inicio, modalidad }

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { tipo: 'online' }
  });

  const tipoSel = watch('tipo');

  // Cargar abogado y su disponibilidad
  useEffect(() => {
    const cargar = async () => {
      try {
        const [abogadoRes, dispRes] = await Promise.all([
          api.get(`/abogados/${abogadoId}`),
          api.get(`/disponibilidad/abogado/${abogadoId}`),
        ]);
        setAbogado(abogadoRes.data.abogado);
        setDisponibilidad(dispRes.data.disponibilidad || []);
      } catch {
        toast.error('No se encontró el abogado.');
        navigate('/clientes');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [abogadoId, navigate]);

  // Días que tienen al menos un slot disponible compatible con el tipo seleccionado
  const diasConSlots = useMemo(() => {
    return TODOS_LOS_DIAS.filter(fecha => {
      const diaSemana = getDiaSemanaDB(fecha);
      return disponibilidad.some(s =>
        s.dia_semana === diaSemana &&
        (s.modalidad === tipoSel || s.modalidad === 'ambas')
      );
    });
  }, [disponibilidad, tipoSel]);

  // Slots del día seleccionado filtrados por tipo
  const slotsDelDia = useMemo(() => {
    if (!fechaSel) return [];
    const diaSemana = getDiaSemanaDB(fechaSel);
    return disponibilidad
      .filter(s =>
        s.dia_semana === diaSemana &&
        (s.modalidad === tipoSel || s.modalidad === 'ambas')
      )
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [fechaSel, disponibilidad, tipoSel]);

  // Al cambiar tipo o fecha, resetear slot seleccionado
  useEffect(() => {
    setSlotSel(null);
  }, [tipoSel, fechaSel]);

  // Enviar consulta
  const onSubmit = async (datos) => {
    if (!fechaSel || !slotSel) {
      toast.error('Seleccioná una fecha y un horario disponible.');
      return;
    }

    // Construir fecha+hora: fecha seleccionada + hora del slot
    const [horas, minutos] = slotSel.hora_inicio.split(':').map(Number);
    const fechaHora = setMinutes(setHours(new Date(fechaSel), horas), minutos);

    setEnviando(true);
    try {
      await api.post('/consultas', {
        abogado_id:   abogadoId,
        tipo:         datos.tipo,
        descripcion:  datos.descripcion,
        especialidad: datos.especialidad || null,
        fecha_hora:   fechaHora.toISOString(),
      });
      toast.success('¡Consulta solicitada! El abogado te confirmará a la brevedad.');
      navigate('/mis-consultas');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al solicitar la consulta.');
    } finally {
      setEnviando(false);
    }
  };

  // ── Carga ──────────────────────────────────────────────────
  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0EFED' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#2C2B27', borderTopColor: 'transparent' }} />
    </div>
  );

  const tieneSlotsOnline     = disponibilidad.some(s => s.modalidad === 'online'     || s.modalidad === 'ambas');
  const tieneSlotsPresencial = disponibilidad.some(s => s.modalidad === 'presencial' || s.modalidad === 'ambas');

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-4xl">

        {/* Volver */}
        <Link to={`/abogados/${abogadoId}`}
          className="inline-flex items-center gap-2 text-sm font-body mb-6 transition-colors"
          style={{ color: '#8A8780' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}>
          <ArrowLeft size={16} /> Volver al perfil
        </Link>

        <h1 className="section-title mb-1">Solicitar consulta</h1>
        <p className="section-subtitle mb-8">
          Elegí modalidad, día y horario disponible del abogado.
        </p>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Formulario (2/3) ──────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-5">

            {/* Sin disponibilidad configurada */}
            {disponibilidad.length === 0 && (
              <div className="card p-8 text-center">
                <Clock size={36} className="mx-auto mb-3" style={{ color: '#D4D2CC' }} />
                <p className="font-display text-lg mb-1" style={{ color: '#1C1B18' }}>
                  Sin disponibilidad configurada
                </p>
                <p className="font-body text-sm" style={{ color: '#8A8780' }}>
                  Este abogado todavía no cargó sus horarios disponibles.
                  Te recomendamos contactarlo por otro medio.
                </p>
              </div>
            )}

            {disponibilidad.length > 0 && (
              <>
                {/* ── Paso 1: Modalidad ─────────────────────── */}
                <div className="card p-6">
                  <h2 className="font-display font-semibold text-lg mb-4" style={{ color: '#1C1B18' }}>
                    1. Tipo de consulta
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { valor: 'online',     label: 'Online',     desc: 'Videollamada',   icono: Video,     disponible: tieneSlotsOnline     },
                      { valor: 'presencial', label: 'Presencial', desc: 'En consultorio', icono: Building2, disponible: tieneSlotsPresencial },
                    ].map(({ valor, label, desc, icono: Icono, disponible }) => (
                      <label key={valor}
                        className="relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: !disponible ? '#E8E6E3' : tipoSel === valor ? '#2C2B27' : '#E8E6E3',
                          background:  !disponible ? '#FAFAF9'  : tipoSel === valor ? '#F7F6F4' : '#fff',
                          opacity:     !disponible ? 0.5 : 1,
                          cursor:      !disponible ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <input type="radio" value={valor} disabled={!disponible}
                          className="sr-only" {...register('tipo', { required: true })} />
                        <Icono size={20} style={{ color: tipoSel === valor ? '#2C2B27' : '#8A8780' }} />
                        <div className="flex-1">
                          <p className="font-body font-medium text-sm" style={{ color: tipoSel === valor ? '#1C1B18' : '#3A3832' }}>
                            {label}
                          </p>
                          <p className="font-body text-xs" style={{ color: '#8A8780' }}>
                            {disponible ? desc : 'No disponible'}
                          </p>
                        </div>
                        {tipoSel === valor && disponible && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: '#2C2B27' }}>
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ── Paso 2: Fecha ─────────────────────────── */}
                <div className="card p-6">
                  <h2 className="font-display font-semibold text-lg mb-1" style={{ color: '#1C1B18' }}>
                    2. Elegí una fecha disponible
                  </h2>
                  <p className="font-body text-xs mb-4" style={{ color: '#8A8780' }}>
                    Solo se muestran los días en que el abogado tiene horarios disponibles.
                  </p>

                  {diasConSlots.length === 0 ? (
                    <div className="text-center py-6 rounded-xl" style={{ background: '#F7F6F4' }}>
                      <p className="font-body text-sm" style={{ color: '#8A8780' }}>
                        No hay días disponibles para la modalidad seleccionada.
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {diasConSlots.slice(0, 21).map((fecha, i) => {
                        const sel = fechaSel && format(fecha, 'yyyy-MM-dd') === format(fechaSel, 'yyyy-MM-dd');
                        return (
                          <button key={i} type="button"
                            onClick={() => setFechaSel(fecha)}
                            className="shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all"
                            style={{
                              borderColor: sel ? '#2C2B27' : '#E8E6E3',
                              background:  sel ? '#2C2B27' : '#fff',
                            }}
                          >
                            <span className="font-body text-xs uppercase tracking-wide"
                              style={{ color: sel ? 'rgba(255,255,255,0.6)' : '#8A8780' }}>
                              {format(fecha, 'EEE', { locale: es })}
                            </span>
                            <span className="font-display font-bold text-xl leading-none mt-1"
                              style={{ color: sel ? '#fff' : '#1C1B18' }}>
                              {format(fecha, 'd')}
                            </span>
                            <span className="font-body text-xs mt-0.5"
                              style={{ color: sel ? 'rgba(255,255,255,0.6)' : '#8A8780' }}>
                              {format(fecha, 'MMM', { locale: es })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Paso 3: Horario ───────────────────────── */}
                {fechaSel && (
                  <div className="card p-6 animate-slide-down">
                    <h2 className="font-display font-semibold text-lg mb-4" style={{ color: '#1C1B18' }}>
                      3. Elegí un horario
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slotsDelDia.map(slot => {
                        const sel = slotSel?.hora_inicio === slot.hora_inicio;
                        return (
                          <button key={slot.hora_inicio} type="button"
                            onClick={() => setSlotSel(slot)}
                            className="py-3 px-2 rounded-xl text-sm font-body font-medium border-2 transition-all"
                            style={{
                              borderColor: sel ? '#B86030' : '#E8E6E3',
                              background:  sel ? '#B86030' : '#fff',
                              color:       sel ? '#fff'    : '#1C1B18',
                            }}
                          >
                            {slot.hora_inicio} hs
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Paso 4: Descripción ───────────────────── */}
                <div className="card p-6">
                  <h2 className="font-display font-semibold text-lg mb-4" style={{ color: '#1C1B18' }}>
                    {fechaSel ? '4.' : '3.'} Describí tu caso
                  </h2>

                  {/* Especialidad */}
                  {abogado?.especialidades?.length > 0 && (
                    <div className="mb-4">
                      <label className="input-label">
                        Área de consulta <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
                      </label>
                      <select className="input-field" {...register('especialidad')}>
                        <option value="">Seleccioná una especialidad...</option>
                        {abogado.especialidades.map(esp => (
                          <option key={esp} value={esp}>{esp}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Descripción */}
                  <div>
                    <label className="input-label">Describí brevemente tu situación *</label>
                    <textarea rows={5}
                      placeholder="Explicá tu problema legal. El abogado tendrá esta información antes de la consulta..."
                      className={`input-field resize-none ${errors.descripcion ? 'border-red-300' : ''}`}
                      {...register('descripcion', {
                        required: 'La descripción es obligatoria',
                        minLength: { value: 20, message: 'Mínimo 20 caracteres' },
                        maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
                      })} />
                    {errors.descripcion && <p className="input-error">{errors.descripcion.message}</p>}
                  </div>

                  {/* Confidencialidad */}
                  <div className="mt-4 flex items-start gap-3 rounded-xl p-4"
                    style={{ background: '#F7F6F4' }}>
                    <Shield size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                    <p className="font-body text-xs leading-relaxed" style={{ color: '#56534A' }}>
                      Tu información es confidencial. Solo el abogado seleccionado tendrá acceso a la descripción de tu caso.
                    </p>
                  </div>
                </div>

                {/* Botón enviar */}
                <button type="submit"
                  disabled={enviando || !fechaSel || !slotSel}
                  className="btn-primary w-full py-4 text-base disabled:opacity-50"
                >
                  {enviando
                    ? <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
                    : 'Solicitar consulta'
                  }
                </button>

                {(!fechaSel || !slotSel) && (
                  <p className="text-center font-body text-xs" style={{ color: '#B0AEA8' }}>
                    <AlertCircle size={12} className="inline mr-1" />
                    {!fechaSel ? 'Seleccioná una fecha' : 'Seleccioná un horario'} para continuar
                  </p>
                )}
              </>
            )}
          </form>

          {/* ── Panel lateral: resumen ──────────────────────── */}
          <div>
            <div className="card p-6 sticky top-24">

              {/* Abogado */}
              <p className="font-body text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: '#8A8780' }}>Consultando con</p>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: '#2C2B27' }}>
                  {abogado?.avatar_url
                    ? <img src={abogado.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="font-display font-bold text-white text-lg">
                        {abogado?.nombre?.[0]}{abogado?.apellido?.[0]}
                      </span>
                  }
                </div>
                <div>
                  <p className="font-body font-semibold" style={{ color: '#1C1B18' }}>
                    Dr./Dra. {abogado?.nombre} {abogado?.apellido}
                  </p>
                  {abogado?.calificacion_promedio > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={12} style={{ fill: '#B86030', color: '#B86030' }} />
                      <span className="font-body text-xs" style={{ color: '#8A8780' }}>
                        {abogado.calificacion_promedio} ({abogado.total_calificaciones} reseñas)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Especialidades */}
              {abogado?.especialidades?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {abogado.especialidades.slice(0, 3).map(esp => (
                    <span key={esp}
                      className="font-body text-xs px-2 py-1 rounded-full"
                      style={{ background: '#F0EFED', color: '#56534A' }}>
                      {esp}
                    </span>
                  ))}
                </div>
              )}

              {abogado?.matricula_verificada && (
                <div className="flex items-center gap-2 text-xs font-body rounded-lg px-3 py-2 mb-4"
                  style={{ background: 'rgba(184,96,48,0.06)', color: '#B86030' }}>
                  <Shield size={12} /> Matrícula verificada
                </div>
              )}

              {/* Resumen de selección */}
              {(fechaSel || slotSel) && (
                <div className="pt-4 border-t space-y-2" style={{ borderColor: '#F0EFED' }}>
                  <p className="font-body text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#8A8780' }}>Tu selección</p>
                  {fechaSel && (
                    <p className="font-body text-sm flex items-center gap-2" style={{ color: '#1C1B18' }}>
                      <Calendar size={13} style={{ color: '#B86030' }} />
                      {format(fechaSel, "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                  )}
                  {slotSel && (
                    <p className="font-body text-sm flex items-center gap-2" style={{ color: '#1C1B18' }}>
                      <Clock size={13} style={{ color: '#B86030' }} />
                      {slotSel.hora_inicio} hs
                    </p>
                  )}
                  <p className="font-body text-sm flex items-center gap-2" style={{ color: '#1C1B18' }}>
                    {tipoSel === 'online'
                      ? <><Video size={13} style={{ color: '#B86030' }} /> Online</>
                      : <><Building2 size={13} style={{ color: '#B86030' }} /> Presencial</>
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
