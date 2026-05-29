// ============================================================
// src/pages/cliente/MisConsultas.jsx
// Historial completo de consultas del cliente
// Con filtros por estado, modal de cancelación y calificación
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Video, Building2, Star, X,
  ChevronDown, MessageSquare, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Componente: Badge de estado
// ─────────────────────────────────────────────────────────────
function BadgeEstado({ estado }) {
  const mapa = {
    pendiente:  { clase: 'badge-pendiente',  label: 'Pendiente' },
    confirmada: { clase: 'badge-confirmada', label: 'Confirmada' },
    completada: { clase: 'badge-completada', label: 'Completada' },
    cancelada:  { clase: 'badge-cancelada',  label: 'Cancelada' },
    no_asistio: { clase: 'badge-cancelada',  label: 'No asistió' },
  };
  const { clase, label } = mapa[estado] || { clase: 'badge-pendiente', label: estado };
  return <span className={clase}>{label}</span>;
}

// ─────────────────────────────────────────────────────────────
// Componente: Estrellas clickeables para calificar
// ─────────────────────────────────────────────────────────────
function Estrellas({ valor, onChange, solo_lectura = false }) {
  const [hover, setHover] = useState(0);
  const activo = hover || valor;
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={solo_lectura}
          onClick={() => !solo_lectura && onChange(i)}
          onMouseEnter={() => !solo_lectura && setHover(i)}
          onMouseLeave={() => !solo_lectura && setHover(0)}
          className={`transition-transform ${!solo_lectura ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            size={solo_lectura ? 14 : 28}
            style={{
              fill:  i <= activo ? '#B86030' : '#E8E6E3',
              color: i <= activo ? '#B86030' : '#E8E6E3',
              transition: 'all 0.15s',
            }}
          />
        </button>
      ))}
    </div>
  );
}

// Etiquetas para cada puntaje
const ETIQUETAS_PUNTAJE = ['', 'Muy mala 😕', 'Regular 😐', 'Buena 👍', 'Muy buena 😊', 'Excelente ⭐'];

// ─────────────────────────────────────────────────────────────
// Componente: Modal para calificar al abogado — Paleta C
// ─────────────────────────────────────────────────────────────
function ModalCalificacion({ consulta, onCerrar, onCalificado }) {
  const [puntaje,    setPuntaje]    = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando,   setEnviando]   = useState(false);

  const enviar = async () => {
    if (puntaje === 0) {
      toast.error('Seleccioná al menos una estrella.');
      return;
    }
    setEnviando(true);
    try {
      await api.post(`/calificaciones/${consulta.id}`, { puntaje, comentario });
      toast.success('¡Gracias por tu calificación!');
      onCalificado();
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar la calificación.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="card w-full max-w-md p-8 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>
              ¿Cómo fue tu consulta?
            </h3>
            <p className="font-body text-sm mt-0.5" style={{ color: '#8A8780' }}>
              Tu opinión ayuda a otros clientes
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
          >
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        {/* Info del abogado */}
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6"
          style={{ background: '#F7F6F4' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#2C2B27' }}>
            <span className="font-display font-bold text-white text-sm">
              {consulta.abogado_nombre?.[0]}{consulta.abogado_apellido?.[0]}
            </span>
          </div>
          <div>
            <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
              Dr./Dra. {consulta.abogado_nombre} {consulta.abogado_apellido}
            </p>
            <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>
              {format(new Date(consulta.fecha_hora), "d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>

        {/* Estrellas */}
        <div className="mb-5 text-center">
          <p className="font-body text-sm font-medium mb-4" style={{ color: '#1C1B18' }}>
            Calificación
          </p>
          <div className="flex justify-center mb-3">
            <Estrellas valor={puntaje} onChange={setPuntaje} />
          </div>
          <p
            className="font-body text-sm font-medium transition-all"
            style={{
              color: puntaje > 0 ? '#B86030' : 'transparent',
              minHeight: '20px',
            }}
          >
            {ETIQUETAS_PUNTAJE[puntaje]}
          </p>
        </div>

        {/* Comentario */}
        <div className="mb-6">
          <label className="input-label">
            Comentario{' '}
            <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Contanos cómo fue la atención, la claridad en las explicaciones..."
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            maxLength={1000}
            className="input-field resize-none"
          />
          <p className="font-body text-xs mt-1 text-right" style={{ color: '#B0AEA8' }}>
            {comentario.length}/1000
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button onClick={onCerrar} className="btn-secondary flex-1">
            Ahora no
          </button>
          <button
            onClick={enviar}
            disabled={enviando || puntaje === 0}
            className="btn-primary flex-1"
          >
            {enviando
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
              : 'Enviar calificación'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: Modal para cancelar una consulta
// ─────────────────────────────────────────────────────────────
function ModalCancelacion({ consulta, onCerrar, onCancelado }) {
  const [motivo,   setMotivo]   = useState('');
  const [enviando, setEnviando] = useState(false);

  const cancelar = async () => {
    setEnviando(true);
    try {
      await api.patch(`/consultas/${consulta.id}/estado`, {
        estado: 'cancelada',
        motivo_cancelacion: motivo,
      });
      toast.success('Consulta cancelada correctamente.');
      onCancelado();
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cancelar la consulta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-navy-900 text-xl">Cancelar consulta</h3>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
          <p className="font-body text-sm text-red-700">
            ¿Estás seguro/a de que querés cancelar esta consulta con Dr./Dra.{' '}
            <strong>{consulta.abogado_nombre} {consulta.abogado_apellido}</strong>?
          </p>
        </div>

        <div className="mb-6">
          <label className="input-label">
            Motivo <span className="text-slate-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Contanos por qué cancelás para mejorar el servicio..."
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="input-field resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onCerrar} className="btn-secondary flex-1">Volver</button>
          <button
            onClick={cancelar}
            disabled={enviando}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl font-body font-medium text-sm text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {enviando ? 'Cancelando...' : 'Sí, cancelar consulta'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta individual de consulta
// ─────────────────────────────────────────────────────────────
function TarjetaConsulta({ consulta, onAccion }) {
  const [expandida, setExpandida] = useState(false);
  const fecha = new Date(consulta.fecha_hora);

  // Determinar qué acciones están disponibles según el estado
  const puedeCalificar = consulta.estado === 'completada' && !consulta.tiene_calificacion;
  const puedeCancelar  = ['pendiente', 'confirmada'].includes(consulta.estado);

  return (
    <div className="card overflow-hidden">
      {/* Cabecera siempre visible */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* Datos del abogado y fecha */}
          <div className="flex items-start gap-4">
            {/* Avatar del abogado */}
            <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center shrink-0 overflow-hidden">
              {consulta.abogado_avatar
                ? <img src={consulta.abogado_avatar} alt="" className="w-full h-full object-cover" />
                : (
                  <span className="font-display font-bold text-navy-700 text-sm">
                    {consulta.abogado_nombre?.[0]}{consulta.abogado_apellido?.[0]}
                  </span>
                )
              }
            </div>

            <div>
              <p className="font-body font-semibold text-navy-900">
                Dr./Dra. {consulta.abogado_nombre} {consulta.abogado_apellido}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {/* Tipo de consulta */}
                <span className="flex items-center gap-1 font-body text-xs text-slate-500">
                  {consulta.tipo === 'online'
                    ? <><Video size={11} className="text-navy-700" /> Online</>
                    : <><Building2 size={11} className="text-navy-700" /> Presencial</>
                  }
                </span>
                <span className="text-slate-300">·</span>
                {/* Fecha */}
                <span className="font-body text-xs text-slate-500">
                  <Calendar size={11} className="inline mr-1" />
                  {format(fecha, "d 'de' MMMM yyyy", { locale: es })} — {format(fecha, "HH:mm 'hs'")}
                </span>
                {/* Especialidad si tiene */}
                {consulta.especialidad && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="font-body text-xs text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full">
                      {consulta.especialidad}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Estado y botón expandir */}
          <div className="flex items-center gap-2">
            <BadgeEstado estado={consulta.estado} />
            <button
              onClick={() => setExpandida(!expandida)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${expandida ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Acciones rápidas siempre visibles */}
        <div className="flex flex-wrap gap-2 mt-4">
          {/* Link videollamada */}
          {consulta.tipo === 'online' && consulta.link_reunion && consulta.estado === 'confirmada' && (
            <a
              href={consulta.link_reunion}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs px-4 py-2"
            >
              <Video size={13} /> Unirse a la reunión
            </a>
          )}

          {/* Calificar */}
          {puedeCalificar && (
            <button
              onClick={() => onAccion('calificar', consulta)}
              className="btn-gold text-xs px-4 py-2"
            >
              <Star size={13} /> Calificar consulta
            </button>
          )}

          {/* Ver conversación con el abogado */}
          <Link
            to={`/mis-consultas/${consulta.id}`}
            className="relative flex items-center gap-1.5 font-body text-xs px-4 py-2 rounded-xl border transition-colors font-medium"
            style={parseInt(consulta.mensajes_no_leidos) > 0
              ? { borderColor: '#B86030', color: '#B86030', background: 'rgba(184,96,48,0.06)' }
              : { borderColor: '#D4D2CC', color: '#2C2B27' }
            }
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => {
              e.currentTarget.style.background = parseInt(consulta.mensajes_no_leidos) > 0
                ? 'rgba(184,96,48,0.06)' : '';
            }}
          >
            <MessageSquare size={13} />
            Ver conversación
            {parseInt(consulta.mensajes_no_leidos) > 0 && (
              <span
                className="ml-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold text-[10px] px-1"
                style={{ background: '#B86030' }}
              >
                {consulta.mensajes_no_leidos}
              </span>
            )}
          </Link>

          {/* Cancelar */}
          {puedeCancelar && (
            <button
              onClick={() => onAccion('cancelar', consulta)}
              className="font-body text-xs text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              Cancelar consulta
            </button>
          )}

          {/* Ya calificado */}
          {consulta.estado === 'completada' && consulta.tiene_calificacion && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-body px-3 py-2">
              <Star size={13} className="fill-gold-400 text-gold-400" />
              Ya calificaste esta consulta
            </div>
          )}
        </div>
      </div>

      {/* Detalle expandible */}
      {expandida && (
        <div className="border-t border-slate-100 p-5 bg-slate-50 animate-slide-down">
          <h4 className="font-body text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Descripción del caso
          </h4>
          <p className="font-body text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {consulta.descripcion}
          </p>

          {/* Info de cancelación si fue cancelada */}
          {consulta.estado === 'cancelada' && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="font-body text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                Cancelada por: {consulta.cancelada_por || 'N/A'}
              </p>
              {consulta.motivo_cancelacion && (
                <p className="font-body text-sm text-red-700">{consulta.motivo_cancelacion}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function MisConsultas() {
  const [consultas,    setConsultas]    = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');  // '' = todas
  const [modalActivo,  setModalActivo]  = useState(null); // { tipo, consulta }

  // Cargar consultas (se vuelve a llamar después de acciones)
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const { data } = await api.get('/consultas', { params });
      setConsultas(data.consultas);
    } catch {
      toast.error('No se pudieron cargar las consultas.');
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  // Recargar cuando cambia el filtro
  useEffect(() => { cargar(); }, [cargar]);

  // Manejar acciones de las tarjetas (calificar / cancelar)
  const handleAccion = (tipo, consulta) => {
    setModalActivo({ tipo, consulta });
  };

  const cerrarModal = () => setModalActivo(null);

  // Opciones de filtro de estado
  const FILTROS = [
    { valor: '',           label: 'Todas' },
    { valor: 'pendiente',  label: 'Pendientes' },
    { valor: 'confirmada', label: 'Confirmadas' },
    { valor: 'completada', label: 'Completadas' },
    { valor: 'cancelada',  label: 'Canceladas' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Mis consultas</h1>
            <p className="section-subtitle">
              {cargando ? 'Cargando...' : `${consultas.length} consulta${consultas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link to="/abogados" className="btn-primary shrink-0">
            <Search size={16} /> Nueva consulta
          </Link>
        </div>

        {/* Filtros por estado */}
        <div className="flex gap-2 flex-wrap mb-6">
          {FILTROS.map(f => (
            <button
              key={f.valor}
              onClick={() => setFiltroEstado(f.valor)}
              className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all ${
                filtroEstado === f.valor
                  ? 'bg-navy-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Skeleton de carga */}
        {cargando && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!cargando && consultas.length === 0 && (
          <div className="card p-16 text-center">
            <MessageSquare size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display text-xl text-navy-900 mb-2">
              {filtroEstado ? 'Sin consultas en este estado' : 'No tenés consultas aún'}
            </p>
            <p className="font-body text-slate-500 mb-6">
              {filtroEstado
                ? 'Probá con otro filtro o revisá tus consultas en general.'
                : 'Encontrá un abogado y agendá tu primera consulta.'
              }
            </p>
            <Link to="/abogados" className="btn-primary">Buscar abogado</Link>
          </div>
        )}

        {/* Lista de consultas */}
        {!cargando && consultas.length > 0 && (
          <div className="space-y-4">
            {consultas.map(c => (
              <TarjetaConsulta
                key={c.id}
                consulta={c}
                onAccion={handleAccion}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {modalActivo?.tipo === 'calificar' && (
        <ModalCalificacion
          consulta={modalActivo.consulta}
          onCerrar={cerrarModal}
          onCalificado={cargar}
        />
      )}
      {modalActivo?.tipo === 'cancelar' && (
        <ModalCancelacion
          consulta={modalActivo.consulta}
          onCerrar={cerrarModal}
          onCancelado={cargar}
        />
      )}
    </div>
  );
}
