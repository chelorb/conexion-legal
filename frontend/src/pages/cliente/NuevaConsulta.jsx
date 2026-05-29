// ============================================================
// src/pages/cliente/NuevaConsulta.jsx
// Formulario para que el cliente solicite una consulta
// Se accede desde el perfil del abogado: /nueva-consulta/:abogadoId
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft, Calendar, Clock, Video,
  Building2, Shield, Star, AlertCircle
} from 'lucide-react';
import { format, addDays, setHours, setMinutes, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Genera horarios disponibles cada 1 hora entre 9 y 18hs
// ─────────────────────────────────────────────────────────────
function generarHorarios() {
  const horarios = [];
  for (let h = 9; h <= 17; h++) {
    horarios.push({ hora: h, minutos: 0,  label: `${String(h).padStart(2,'0')}:00 hs` });
    horarios.push({ hora: h, minutos: 30, label: `${String(h).padStart(2,'0')}:30 hs` });
  }
  return horarios;
}

const HORARIOS = generarHorarios();

// Genera los próximos 30 días hábiles (lunes a viernes)
function generarFechasDisponibles() {
  const fechas = [];
  let dia = addDays(startOfToday(), 1); // Desde mañana en adelante
  while (fechas.length < 30) {
    const diaSemana = dia.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) { // Excluir sábado (6) y domingo (0)
      fechas.push(new Date(dia));
    }
    dia = addDays(dia, 1);
  }
  return fechas;
}

const FECHAS_DISPONIBLES = generarFechasDisponibles();

export default function NuevaConsulta() {
  const { abogadoId } = useParams();   // ID del abogado desde la URL
  const navigate       = useNavigate();

  const [abogado,      setAbogado]      = useState(null);
  const [cargando,     setCargando]     = useState(true);
  const [enviando,     setEnviando]     = useState(false);
  const [fechaSel,     setFechaSel]     = useState(null);
  const [horarioSel,   setHorarioSel]   = useState(null);
  const [paso,         setPaso]         = useState(1); // 1: tipo/fecha/hora, 2: descripción

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { tipo: 'online' } });

  const tipoSel = watch('tipo');

  // Cargar datos del abogado al montar
  useEffect(() => {
    api.get(`/abogados/${abogadoId}`)
      .then(r => setAbogado(r.data.abogado))
      .catch(() => {
        toast.error('No se encontró el abogado.');
        navigate('/abogados');
      })
      .finally(() => setCargando(false));
  }, [abogadoId, navigate]);

  // Enviar el formulario al backend
  const onSubmit = async (datos) => {
    if (!fechaSel || !horarioSel) {
      toast.error('Por favor seleccioná una fecha y un horario.');
      return;
    }

    // Construir el objeto Date combinando fecha seleccionada + horario
    const fechaHora = setMinutes(
      setHours(new Date(fechaSel), horarioSel.hora),
      horarioSel.minutos
    );

    setEnviando(true);
    try {
      await api.post('/consultas', {
        abogado_id:  abogadoId,
        tipo:        datos.tipo,
        descripcion: datos.descripcion,
        especialidad: datos.especialidad || null,
        fecha_hora:  fechaHora.toISOString(),
      });

      toast.success('¡Consulta solicitada! El abogado te confirmará a la brevedad.');
      navigate('/mis-consultas');

    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al solicitar la consulta.');
    } finally {
      setEnviando(false);
    }
  };

  // ── Estado de carga ─────────────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-body">Cargando datos del abogado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8 max-w-4xl">

        {/* ── Botón volver ──────────────────────────────────── */}
        <Link
          to={`/abogados/${abogadoId}`}
          className="inline-flex items-center gap-2 text-sm font-body text-slate-500 hover:text-navy-900 transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Volver al perfil del abogado
        </Link>

        <h1 className="section-title mb-2">Solicitar consulta</h1>
        <p className="section-subtitle mb-8">
          Completá el formulario y el abogado te confirmará el turno.
        </p>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Formulario principal (2/3) ─────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-6">

            {/* PASO 1: Modalidad, Fecha y Hora */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-navy-900 text-lg mb-5">
                1. Modalidad y horario
              </h2>

              {/* Selección de modalidad */}
              <div className="mb-6">
                <label className="input-label">Tipo de consulta</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {[
                    { valor: 'online',     label: 'Online',     desc: 'Videollamada',  icono: Video,      disponible: abogado?.atiende_online },
                    { valor: 'presencial', label: 'Presencial', desc: 'En consultorio', icono: Building2,  disponible: abogado?.atiende_presencial },
                  ].map(({ valor, label, desc, icono: Icono, disponible }) => (
                    <label
                      key={valor}
                      className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        !disponible
                          ? 'opacity-40 cursor-not-allowed border-slate-200'
                          : tipoSel === valor
                            ? 'border-navy-900 bg-navy-50'
                            : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={valor}
                        disabled={!disponible}
                        className="sr-only"
                        {...register('tipo', { required: true })}
                      />
                      <Icono size={20} className={tipoSel === valor ? 'text-navy-900' : 'text-slate-400'} />
                      <div>
                        <p className={`font-body font-medium text-sm ${tipoSel === valor ? 'text-navy-900' : 'text-slate-700'}`}>
                          {label}
                        </p>
                        <p className="font-body text-xs text-slate-400">{desc}</p>
                      </div>
                      {!disponible && (
                        <span className="absolute top-2 right-2 text-xs text-slate-400 font-body">No disponible</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Selección de fecha */}
              <div className="mb-6">
                <label className="input-label">
                  <Calendar size={14} className="inline mr-1.5 mb-0.5" />
                  Fecha preferida
                </label>
                {/* Grid de fechas scrolleable */}
                <div className="flex gap-2 overflow-x-auto pb-2 mt-2 snap-x">
                  {FECHAS_DISPONIBLES.slice(0, 14).map((fecha, i) => {
                    const seleccionada = fechaSel && format(fecha, 'yyyy-MM-dd') === format(fechaSel, 'yyyy-MM-dd');
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFechaSel(fecha)}
                        className={`shrink-0 snap-start flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all ${
                          seleccionada
                            ? 'border-navy-900 bg-navy-900 text-white'
                            : 'border-slate-200 hover:border-navy-300 bg-white'
                        }`}
                      >
                        <span className={`font-body text-xs uppercase tracking-wide ${seleccionada ? 'text-white/70' : 'text-slate-400'}`}>
                          {format(fecha, 'EEE', { locale: es })}
                        </span>
                        <span className={`font-display font-bold text-lg leading-none mt-1 ${seleccionada ? 'text-white' : 'text-navy-900'}`}>
                          {format(fecha, 'd')}
                        </span>
                        <span className={`font-body text-xs mt-0.5 ${seleccionada ? 'text-white/70' : 'text-slate-400'}`}>
                          {format(fecha, 'MMM', { locale: es })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selección de horario — solo si hay fecha */}
              {fechaSel && (
                <div>
                  <label className="input-label">
                    <Clock size={14} className="inline mr-1.5 mb-0.5" />
                    Horario
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                    {HORARIOS.map((h, i) => {
                      const seleccionado = horarioSel?.hora === h.hora && horarioSel?.minutos === h.minutos;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setHorarioSel(h)}
                          className={`py-2 px-2 rounded-xl text-xs font-body font-medium border-2 transition-all ${
                            seleccionado
                              ? 'border-navy-900 bg-navy-900 text-white'
                              : 'border-slate-200 hover:border-navy-300 bg-white text-slate-700'
                          }`}
                        >
                          {h.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* PASO 2: Descripción del caso */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-navy-900 text-lg mb-5">
                2. Descripción de tu caso
              </h2>

              {/* Especialidad */}
              <div className="mb-4">
                <label className="input-label">
                  Área de consulta <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <select className="input-field" {...register('especialidad')}>
                  <option value="">Seleccioná una especialidad...</option>
                  {(abogado?.especialidades || []).map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="input-label">Describí brevemente tu situación</label>
                <textarea
                  rows={5}
                  placeholder="Explicá en pocas palabras cuál es tu problema legal. Por ejemplo: 'Tuve un accidente de tránsito hace 2 semanas y no sé cómo proceder con el seguro...' El abogado tendrá este texto antes de la consulta."
                  className={`input-field resize-none ${errors.descripcion ? 'border-red-300' : ''}`}
                  {...register('descripcion', {
                    required: 'La descripción es obligatoria',
                    minLength: { value: 20, message: 'Describí tu caso con al menos 20 caracteres' },
                    maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
                  })}
                />
                {errors.descripcion && (
                  <p className="input-error">{errors.descripcion.message}</p>
                )}
              </div>

              {/* Aviso de confidencialidad */}
              <div className="mt-4 flex items-start gap-3 bg-navy-50 rounded-xl p-4">
                <Shield size={16} className="text-navy-700 shrink-0 mt-0.5" />
                <p className="font-body text-xs text-navy-700 leading-relaxed">
                  Tu información es confidencial. Solo el abogado seleccionado tendrá acceso a la descripción de tu caso.
                </p>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={enviando || !fechaSel || !horarioSel}
              className="btn-primary w-full py-4 text-base"
            >
              {enviando
                ? <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando solicitud...</>
                : 'Solicitar consulta'
              }
            </button>

            {/* Aviso si falta seleccionar fecha/hora */}
            {(!fechaSel || !horarioSel) && (
              <p className="text-center font-body text-xs text-slate-400">
                <AlertCircle size={12} className="inline mr-1" />
                Seleccioná una fecha y un horario para continuar
              </p>
            )}
          </form>

          {/* ── Panel lateral: resumen del abogado ────────── */}
          <div className="space-y-4">
            {/* Tarjeta del abogado */}
            <div className="card p-6 sticky top-24">
              <h3 className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Consultando con
              </h3>

              {/* Avatar y nombre */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-navy-100 overflow-hidden shrink-0">
                  {abogado?.avatar_url
                    ? <img src={abogado.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center bg-navy-900">
                        <span className="font-display font-bold text-white text-lg">
                          {abogado?.nombre?.[0]}{abogado?.apellido?.[0]}
                        </span>
                      </div>
                    )
                  }
                </div>
                <div>
                  <p className="font-body font-semibold text-navy-900">
                    Dr./Dra. {abogado?.nombre} {abogado?.apellido}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={12} className="fill-gold-500 text-gold-500" />
                    <span className="font-body text-xs text-slate-500">
                      {abogado?.calificacion_promedio > 0
                        ? `${abogado.calificacion_promedio} (${abogado.total_calificaciones} reseñas)`
                        : 'Sin calificaciones aún'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Especialidades */}
              {abogado?.especialidades?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {abogado.especialidades.slice(0, 4).map(esp => (
                    <span key={esp} className="px-2 py-1 bg-navy-50 text-navy-700 text-xs rounded-full font-body">
                      {esp}
                    </span>
                  ))}
                </div>
              )}

              {/* Verificación */}
              {abogado?.matricula_verificada && (
                <div className="flex items-center gap-2 text-xs font-body text-navy-700 bg-navy-50 rounded-lg px-3 py-2">
                  <Shield size={12} /> Matrícula verificada
                </div>
              )}

              {/* Resumen de lo seleccionado */}
              {(fechaSel || horarioSel) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Tu selección
                  </p>
                  <div className="space-y-1.5">
                    {fechaSel && (
                      <p className="font-body text-sm text-slate-700 flex items-center gap-2">
                        <Calendar size={13} className="text-navy-700" />
                        {format(fechaSel, "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                    )}
                    {horarioSel && (
                      <p className="font-body text-sm text-slate-700 flex items-center gap-2">
                        <Clock size={13} className="text-navy-700" />
                        {horarioSel.label}
                      </p>
                    )}
                    <p className="font-body text-sm text-slate-700 flex items-center gap-2">
                      {tipoSel === 'online'
                        ? <><Video size={13} className="text-navy-700" /> Online</>
                        : <><Building2 size={13} className="text-navy-700" /> Presencial</>
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
