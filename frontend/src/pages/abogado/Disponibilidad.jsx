// ============================================================
// src/pages/abogado/Disponibilidad.jsx — Paleta C
// El abogado configura qué días y horarios está disponible
// para consultas online, presenciales o ambas
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, X, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────
const DIAS = [
  { num: 1, label: 'Lunes'     },
  { num: 2, label: 'Martes'    },
  { num: 3, label: 'Miércoles' },
  { num: 4, label: 'Jueves'    },
  { num: 5, label: 'Viernes'   },
  { num: 6, label: 'Sábado'    },
  { num: 7, label: 'Domingo'   },
];

const MODALIDADES = [
  { valor: 'online',      label: 'Online',      color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)'  },
  { valor: 'presencial',  label: 'Presencial',  color: '#15803d', bg: 'rgba(22,163,74,0.1)'   },
  { valor: 'ambas',       label: 'Ambas',       color: '#B86030', bg: 'rgba(184,96,48,0.1)'   },
];

// Generar slots de media hora desde 7:00 hasta 21:00
const SLOTS_HORA = [];
for (let h = 7; h <= 21; h++) {
  SLOTS_HORA.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 21) SLOTS_HORA.push(`${String(h).padStart(2, '0')}:30`);
}

// ─────────────────────────────────────────────────────────────
// Badge de modalidad
// ─────────────────────────────────────────────────────────────
function BadgeModalidad({ modalidad }) {
  const cfg = MODALIDADES.find(m => m.valor === modalidad) || MODALIDADES[2];
  return (
    <span
      className="text-xs font-body font-medium px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal para agregar slot
// ─────────────────────────────────────────────────────────────
function ModalAgregarSlot({ diaPreseleccionado, onAgregar, onCerrar }) {
  const [dia,       setDia]       = useState(diaPreseleccionado || 1);
  const [hora,      setHora]      = useState('09:00');
  const [modalidad, setModalidad] = useState('ambas');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div className="card w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg" style={{ color: '#1C1B18' }}>
            Agregar horario
          </h3>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={16} style={{ color: '#56534A' }} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Día */}
          <div>
            <label className="input-label">Día</label>
            <select
              value={dia}
              onChange={e => setDia(parseInt(e.target.value))}
              className="input-field"
            >
              {DIAS.map(d => (
                <option key={d.num} value={d.num}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Hora */}
          <div>
            <label className="input-label">Horario</label>
            <select
              value={hora}
              onChange={e => setHora(e.target.value)}
              className="input-field"
            >
              {SLOTS_HORA.map(h => (
                <option key={h} value={h}>{h} hs</option>
              ))}
            </select>
          </div>

          {/* Modalidad */}
          <div>
            <label className="input-label">Modalidad</label>
            <div className="grid grid-cols-3 gap-2">
              {MODALIDADES.map(m => (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => setModalidad(m.valor)}
                  className="py-2.5 rounded-xl text-xs font-body font-medium border-2 transition-all"
                  style={{
                    borderColor: modalidad === m.valor ? m.color : '#E8E6E3',
                    background:  modalidad === m.valor ? m.bg    : '#fff',
                    color:       modalidad === m.valor ? m.color : '#56534A',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
          <button
            onClick={() => onAgregar({ dia_semana: dia, hora_inicio: hora, modalidad })}
            className="btn-primary flex-1"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function Disponibilidad() {
  // slots: { dia_semana, hora_inicio, modalidad }[]
  const [slots,      setSlots]      = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [guardando,  setGuardando]  = useState(false);
  const [modal,      setModal]      = useState(false);
  const [diaModal,   setDiaModal]   = useState(null);
  const [modificado, setModificado] = useState(false);

  // Cargar disponibilidad actual
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/disponibilidad/me');
      setSlots(data.disponibilidad || []);
      setModificado(false);
    } catch {
      toast.error('No se pudo cargar la disponibilidad.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Agregar slot (desde el modal)
  const agregarSlot = ({ dia_semana, hora_inicio, modalidad }) => {
    // Verificar duplicado
    const existe = slots.some(
      s => s.dia_semana === dia_semana && s.hora_inicio === hora_inicio
    );
    if (existe) {
      toast.error('Ya tenés ese horario agregado. Podés modificar su modalidad.');
      return;
    }
    setSlots(prev => [...prev, { dia_semana, hora_inicio, modalidad }]);
    setModificado(true);
    setModal(false);
  };

  // Cambiar modalidad de un slot existente
  const cambiarModalidad = (dia_semana, hora_inicio, modalidad) => {
    setSlots(prev =>
      prev.map(s =>
        s.dia_semana === dia_semana && s.hora_inicio === hora_inicio
          ? { ...s, modalidad }
          : s
      )
    );
    setModificado(true);
  };

  // Eliminar slot
  const eliminarSlot = (dia_semana, hora_inicio) => {
    setSlots(prev =>
      prev.filter(s => !(s.dia_semana === dia_semana && s.hora_inicio === hora_inicio))
    );
    setModificado(true);
  };

  // Guardar todo
  const guardar = async () => {
    setGuardando(true);
    try {
      await api.put('/disponibilidad/me/bulk', { slots });
      toast.success('Disponibilidad guardada correctamente.');
      setModificado(false);
    } catch {
      toast.error('Error al guardar la disponibilidad.');
    } finally {
      setGuardando(false);
    }
  };

  // Slots agrupados por día
  const slotsPorDia = DIAS.map(dia => ({
    ...dia,
    slots: slots
      .filter(s => s.dia_semana === dia.num)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
  }));

  const totalSlots = slots.length;

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Mi disponibilidad</h1>
            <p className="section-subtitle">
              Configurá los días y horarios en que estás disponible para consultas.
              {totalSlots > 0 && ` Tenés ${totalSlots} slot${totalSlots !== 1 ? 's' : ''} configurado${totalSlots !== 1 ? 's' : ''}.`}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2">
              <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={() => setModal(true)}
              className="btn-secondary gap-2"
            >
              <Plus size={15} /> Agregar horario
            </button>
            {modificado && (
              <button onClick={guardar} disabled={guardando} className="btn-primary gap-2">
                {guardando
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                  : <><Save size={15} /> Guardar cambios</>
                }
              </button>
            )}
          </div>
        </div>

        {/* Aviso de cambios sin guardar */}
        {modificado && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 animate-slide-down"
            style={{ background: 'rgba(184,96,48,0.08)', border: '1px solid rgba(184,96,48,0.2)' }}
          >
            <p className="font-body text-sm" style={{ color: '#56534A' }}>
              ⚠️ Tenés cambios sin guardar.
            </p>
            <button onClick={guardar} disabled={guardando} className="btn-primary gap-2 py-2 text-sm">
              <Save size={14} /> Guardar ahora
            </button>
          </div>
        )}

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 mb-6">
          {MODALIDADES.map(m => (
            <div key={m.valor} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
              <span className="font-body text-xs" style={{ color: '#56534A' }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DIAS.map(d => (
              <div key={d.num} className="card p-4 animate-pulse">
                <div className="h-5 rounded w-1/2 mb-3" style={{ background: '#E8E6E3' }} />
                {[1, 2].map(i => (
                  <div key={i} className="h-8 rounded-xl mb-2" style={{ background: '#E8E6E3' }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Grilla por día */}
        {!cargando && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {slotsPorDia.map(dia => (
              <div key={dia.num} className="card p-4">

                {/* Header del día */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold" style={{ color: '#1C1B18' }}>
                    {dia.label}
                  </h3>
                  <button
                    onClick={() => { setDiaModal(dia.num); setModal(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: '#8A8780' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; e.currentTarget.style.color = '#B86030'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}
                    title={`Agregar horario el ${dia.label}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Slots del día */}
                {dia.slots.length === 0 ? (
                  <div
                    className="text-center py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                    style={{ borderColor: '#E8E6E3' }}
                    onClick={() => { setDiaModal(dia.num); setModal(true); }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#B86030'; e.currentTarget.style.background = 'rgba(184,96,48,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E6E3'; e.currentTarget.style.background = ''; }}
                  >
                    <p className="font-body text-xs" style={{ color: '#B0AEA8' }}>Sin horarios</p>
                    <p className="font-body text-xs mt-0.5" style={{ color: '#D4D2CC' }}>Click para agregar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dia.slots.map(slot => {
                      const cfg = MODALIDADES.find(m => m.valor === slot.modalidad) || MODALIDADES[2];
                      return (
                        <div
                          key={`${slot.dia_semana}-${slot.hora_inicio}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: cfg.bg }}
                        >
                          <Clock size={12} style={{ color: cfg.color }} className="shrink-0" />
                          <span className="font-body text-sm font-medium flex-1" style={{ color: cfg.color }}>
                            {slot.hora_inicio} hs
                          </span>

                          {/* Selector de modalidad */}
                          <select
                            value={slot.modalidad}
                            onChange={e => cambiarModalidad(slot.dia_semana, slot.hora_inicio, e.target.value)}
                            className="font-body text-xs rounded-lg px-1 py-0.5 border-0 bg-transparent cursor-pointer"
                            style={{ color: cfg.color }}
                          >
                            {MODALIDADES.map(m => (
                              <option key={m.valor} value={m.valor}>{m.label}</option>
                            ))}
                          </select>

                          {/* Eliminar */}
                          <button
                            onClick={() => eliminarSlot(slot.dia_semana, slot.hora_inicio)}
                            className="w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0"
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                          >
                            <X size={11} style={{ color: '#dc2626' }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sin slots configurados */}
        {!cargando && totalSlots === 0 && (
          <div className="card p-14 text-center mt-4">
            <Clock size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>
              Sin disponibilidad configurada
            </p>
            <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
              Los clientes no podrán ver horarios disponibles para agendar consultas.
            </p>
            <button onClick={() => setModal(true)} className="btn-primary gap-2 mx-auto">
              <Plus size={15} /> Agregar primer horario
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ModalAgregarSlot
          diaPreseleccionado={diaModal}
          onAgregar={agregarSlot}
          onCerrar={() => { setModal(false); setDiaModal(null); }}
        />
      )}
    </div>
  );
}
