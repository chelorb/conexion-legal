// ============================================================
// src/pages/admin/Beneficios.jsx — Paleta C
// Gestión de beneficios exclusivos para abogados
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Save, RefreshCw, Gift, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

// ── Modal: crear / editar beneficio ─────────────────────────
function ModalBeneficio({ beneficio, onCerrar, onGuardado }) {
  const esEdicion = !!beneficio;
  const [guardando, setGuardando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: beneficio || {
      nombre: '', descripcion: '', categoria: '',
      descuento_pct: '', codigo_descuento: '',
      logo_url: '', link_externo: '', plan_minimo: 'basico',
    }
  });

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      if (esEdicion) {
        await api.put(`/admin/beneficios/${beneficio.id}`, datos);
        toast.success('Beneficio actualizado.');
      } else {
        await api.post('/admin/beneficios', datos);
        toast.success('Beneficio creado.');
      }
      onGuardado();
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar.');
    } finally { setGuardando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-2xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>
            {esEdicion ? 'Editar beneficio' : 'Nuevo beneficio'}
          </h3>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={18} style={{ color: '#56534A' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="input-label">Nombre *</label>
            <input type="text" placeholder="Ej: Descuento en librería jurídica"
              className={`input-field ${errors.nombre ? 'border-red-300' : ''}`}
              {...register('nombre', { required: 'El nombre es obligatorio.' })} />
            {errors.nombre && <p className="input-error">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="input-label">Descripción <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span></label>
            <textarea placeholder="Describí el beneficio y cómo acceder..." rows={3}
              className="input-field resize-none"
              {...register('descripcion')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Categoría <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span></label>
              <input type="text" placeholder="Ej: Librería, Tecnología, Salud"
                className="input-field" {...register('categoria')} />
            </div>
            <div>
              <label className="input-label">Plan mínimo requerido</label>
              <select className="input-field" {...register('plan_minimo')}>
                <option value="basico">Básico</option>
                <option value="comunidad">Comunidad</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Descuento (%) <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span></label>
              <input type="number" min="1" max="100" placeholder="Ej: 20"
                className="input-field" {...register('descuento_pct')} />
            </div>
            <div>
              <label className="input-label">Código de descuento <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span></label>
              <input type="text" placeholder="Ej: IUSTIXIUM20"
                className="input-field" {...register('codigo_descuento')} />
            </div>
          </div>

          <div>
            <label className="input-label">Link externo <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span></label>
            <input type="url" placeholder="https://..."
              className="input-field" {...register('link_externo')} />
          </div>

          <div>
            <label className="input-label">URL del logo <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span></label>
            <input type="url" placeholder="https://..."
              className="input-field" {...register('logo_url')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : <><Save size={15} /> {esEdicion ? 'Guardar cambios' : 'Crear beneficio'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function AdminBeneficios() {
  const [beneficios, setBeneficios] = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [modal,      setModal]      = useState(null); // null | 'nuevo' | beneficio obj

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/beneficios');
      setBeneficios(data.beneficios || []);
    } catch { toast.error('No se pudieron cargar los beneficios.'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggleActivo = async (b) => {
    try {
      await api.put(`/admin/beneficios/${b.id}`, { activo: !b.activo });
      toast.success(b.activo ? 'Beneficio desactivado.' : 'Beneficio activado.');
      cargar();
    } catch { toast.error('Error al actualizar.'); }
  };

  const eliminar = async (b) => {
    if (!window.confirm(`¿Eliminar el beneficio "${b.nombre}"?`)) return;
    try {
      await api.delete(`/admin/beneficios/${b.id}`);
      toast.success('Beneficio eliminado.');
      cargar();
    } catch { toast.error('Error al eliminar.'); }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Beneficios exclusivos</h1>
            <p className="section-subtitle">Descuentos y convenios disponibles para abogados suscriptos.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2">
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} /> Actualizar
            </button>
            <button onClick={() => setModal('nuevo')} className="btn-primary gap-2">
              <Plus size={16} /> Nuevo beneficio
            </button>
          </div>
        </div>

        {/* Lista de beneficios */}
        {cargando ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-12 h-12 rounded-xl" style={{ background: '#E8E6E3' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                  <div className="h-3 rounded w-2/3" style={{ background: '#E8E6E3' }} />
                </div>
              </div>
            ))}
          </div>
        ) : beneficios.length === 0 ? (
          <div className="card p-16 text-center">
            <Gift size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>Sin beneficios cargados</p>
            <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
              Agregá descuentos y convenios para los abogados de la plataforma.
            </p>
            <button onClick={() => setModal('nuevo')} className="btn-primary gap-2 mx-auto">
              <Plus size={16} /> Agregar primer beneficio
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {beneficios.map(b => (
              <div key={b.id} className="card p-5 flex items-center gap-4"
                style={!b.activo ? { opacity: 0.6 } : {}}>
                {/* Logo o ícono */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(184,96,48,0.08)' }}>
                  {b.logo_url
                    ? <img src={b.logo_url} alt={b.nombre} className="w-8 h-8 object-contain rounded" />
                    : <Gift size={20} style={{ color: '#B86030' }} />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>{b.nombre}</p>
                    {b.descuento_pct && (
                      <span className="text-xs font-body font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(184,96,48,0.1)', color: '#B86030' }}>
                        -{b.descuento_pct}%
                      </span>
                    )}
                    {b.categoria && (
                      <span className="text-xs font-body px-2 py-0.5 rounded-full"
                        style={{ background: '#F0EFED', color: '#8A8780' }}>
                        {b.categoria}
                      </span>
                    )}
                    <span className="text-xs font-body px-2 py-0.5 rounded-full"
                      style={{ background: b.activo ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
                               color: b.activo ? '#15803d' : '#dc2626' }}>
                      {b.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {b.descripcion && (
                    <p className="font-body text-xs mt-1 truncate" style={{ color: '#8A8780' }}>{b.descripcion}</p>
                  )}
                  {b.codigo_descuento && (
                    <p className="font-body text-xs mt-1" style={{ color: '#56534A' }}>
                      Código: <strong>{b.codigo_descuento}</strong>
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  {b.link_externo && (
                    <a href={b.link_externo} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#8A8780' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; e.currentTarget.style.background = '#F0EFED'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; e.currentTarget.style.background = ''; }}>
                      <ExternalLink size={15} />
                    </a>
                  )}
                  <button onClick={() => toggleActivo(b)}
                    className="px-3 py-1.5 rounded-lg font-body text-xs transition-colors"
                    style={{ background: '#F0EFED', color: '#56534A' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#E8E6E3'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F0EFED'; }}>
                    {b.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => setModal(b)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: '#8A8780' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; e.currentTarget.style.background = '#F0EFED'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; e.currentTarget.style.background = ''; }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => eliminar(b)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: '#8A8780' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; e.currentTarget.style.background = ''; }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ModalBeneficio
          beneficio={modal === 'nuevo' ? null : modal}
          onCerrar={() => setModal(null)}
          onGuardado={cargar}
        />
      )}
    </div>
  );
}
