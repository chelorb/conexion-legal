// ============================================================
// src/pages/abogado/PerfilEditar.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Camera, Save, Check, AlertCircle, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ESPECIALIDADES = [
  'Derecho Civil', 'Derecho Penal', 'Derecho Laboral', 'Derecho de Familia',
  'Derecho Comercial', 'Derecho Administrativo', 'Derecho Tributario',
  'Derecho Inmobiliario', 'Derecho de Daños', 'Derecho del Consumidor',
  'Propiedad Intelectual', 'Derecho Migratorio', 'Derecho Societario',
  'Derecho Ambiental', 'Mediación',
];

export default function PerfilEditar() {
  const { usuario, actualizarUsuario } = useAuth();
  const perfil = usuario?.perfil_abogado;
  const [guardando,     setGuardando]     = useState(false);
  const [espSel,        setEspSel]        = useState(perfil?.especialidades || []);
  const [modalidades,   setModalidades]   = useState({
    online:     perfil?.atiende_online     ?? true,
    presencial: perfil?.atiende_presencial ?? true,
  });
  const [avatarPreview, setAvatarPreview] = useState(usuario?.avatar_url || null);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [cambiosSin,    setCambiosSin]    = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      nombre:          usuario?.nombre          || '',
      apellido:        usuario?.apellido        || '',
      telefono:        usuario?.telefono        || '',
      descripcion:     perfil?.descripcion      || '',
      anos_experiencia:perfil?.anos_experiencia || '',
      ciudad:          perfil?.ciudad           || '',
      provincia:       perfil?.provincia        || '',
      matricula:       perfil?.matricula        || '',
    }
  });

  useEffect(() => {
    setCambiosSin(isDirty || espSel !== (perfil?.especialidades || []) || avatarFile !== null);
  }, [isDirty, espSel, avatarFile]);

  const toggleEsp = (esp) => {
    setEspSel(prev =>
      prev.includes(esp) ? prev.filter(e => e !== esp) : [...prev, esp]
    );
  };

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('El archivo no puede superar 5MB.'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setCambiosSin(true);
  };

  const onSubmit = async (datos) => {
    setGuardando(true);
    try {
      const formData = new FormData();
      Object.entries(datos).forEach(([k, v]) => { if (v) formData.append(k, v); });
      formData.append('especialidades', JSON.stringify(espSel));
      formData.append('atiende_online',      modalidades.online);
      formData.append('atiende_presencial',  modalidades.presencial);
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data } = await api.put('/abogados/me/perfil', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (actualizarUsuario) actualizarUsuario(data.usuario);
      toast.success('Perfil actualizado correctamente.');
      setAvatarFile(null);
      setCambiosSin(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-3xl">

        <div className="mb-8">
          <h1 className="section-title">Editar perfil</h1>
          <p className="section-subtitle">Tu información visible para los clientes.</p>
        </div>

        {/* Alerta cambios sin guardar */}
        {cambiosSin && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3 animate-slide-down"
            style={{ background: 'rgba(184,96,48,0.08)', border: '1px solid rgba(184,96,48,0.2)' }}>
            <AlertCircle size={18} style={{ color: '#B86030' }} className="shrink-0" />
            <p className="font-body text-sm" style={{ color: '#56534A' }}>
              Tenés cambios sin guardar.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Avatar */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-lg mb-5" style={{ color: '#1C1B18' }}>
              Foto de perfil
            </h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden"
                  style={{ background: '#2C2B27' }}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display font-bold text-white text-3xl">
                          {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
                        </span>
                      </div>
                  }
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
                  style={{ background: '#B86030' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#8B4A1E'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}
                >
                  <Camera size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={handleAvatar} />
              </div>
              <div>
                <p className="font-body font-medium text-sm mb-1" style={{ color: '#1C1B18' }}>
                  Foto profesional
                </p>
                <p className="font-body text-xs leading-relaxed" style={{ color: '#8A8780' }}>
                  JPG, PNG o WEBP. Máximo 5MB.<br />Recomendamos una foto clara y profesional.
                </p>
              </div>
            </div>
          </div>

          {/* Datos personales */}
          <div className="card p-6 space-y-4">
            <h2 className="font-display font-semibold text-lg" style={{ color: '#1C1B18' }}>
              Datos personales
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Nombre</label>
                <input type="text" className={`input-field ${errors.nombre ? 'border-red-300' : ''}`}
                  {...register('nombre', { required: 'Obligatorio' })} />
                {errors.nombre && <p className="input-error">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="input-label">Apellido</label>
                <input type="text" className={`input-field ${errors.apellido ? 'border-red-300' : ''}`}
                  {...register('apellido', { required: 'Obligatorio' })} />
                {errors.apellido && <p className="input-error">{errors.apellido.message}</p>}
              </div>
            </div>
            <div>
              <label className="input-label">
                Teléfono <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
              </label>
              <input type="tel" placeholder="+54 11 1234-5678" className="input-field"
                {...register('telefono')} />
            </div>
          </div>

          {/* Datos profesionales */}
          <div className="card p-6 space-y-4">
            <h2 className="font-display font-semibold text-lg" style={{ color: '#1C1B18' }}>
              Datos profesionales
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Matrícula</label>
                <input type="text" placeholder="Ej: T-12345" className="input-field"
                  {...register('matricula')} />
              </div>
              <div>
                <label className="input-label">Años de experiencia</label>
                <input type="number" min="0" max="70" placeholder="Ej: 10" className="input-field"
                  {...register('anos_experiencia')} />
              </div>
            </div>
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
            <div>
              <label className="input-label">Descripción profesional</label>
              <textarea rows={5} placeholder="Contá tu experiencia y especialización..."
                className={`input-field resize-none ${errors.descripcion ? 'border-red-300' : ''}`}
                {...register('descripcion', {
                  maxLength: { value: 2000, message: 'Máximo 2000 caracteres' }
                })} />
              {errors.descripcion && <p className="input-error">{errors.descripcion.message}</p>}
            </div>
          </div>

          {/* Modalidades */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-lg mb-5" style={{ color: '#1C1B18' }}>
              Modalidad de atención
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'online',     label: 'Online',     desc: 'Videollamada o chat', icono: '💻' },
                { key: 'presencial', label: 'Presencial', desc: 'En tu consultorio',   icono: '🏢' },
              ].map(({ key, label, desc, icono }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setModalidades(m => ({ ...m, [key]: !m[key] }))}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: modalidades[key] ? '#2C2B27' : '#E8E6E3',
                    background: modalidades[key] ? '#F7F6F4' : '#fff',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{icono}</span>
                    {modalidades[key] && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#2C2B27' }}>
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  <p className="font-body font-medium text-sm" style={{ color: '#1C1B18' }}>{label}</p>
                  <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Especialidades */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-lg" style={{ color: '#1C1B18' }}>
                Especialidades
              </h2>
              <span className="font-body text-sm" style={{ color: '#8A8780' }}>
                {espSel.length} seleccionada{espSel.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map(esp => {
                const sel = espSel.includes(esp);
                return (
                  <button
                    key={esp}
                    type="button"
                    onClick={() => toggleEsp(esp)}
                    className="px-3 py-2 rounded-xl text-sm font-body font-medium border-2 transition-all"
                    style={sel
                      ? { borderColor: '#2C2B27', background: '#2C2B27', color: '#fff' }
                      : { borderColor: '#E8E6E3', background: '#fff', color: '#56534A' }
                    }
                  >
                    {sel && <Check size={11} className="inline mr-1" />}
                    {esp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón guardar */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors disabled:opacity-50"
              style={{ background: '#2C2B27' }}
              onMouseEnter={e => { if (!guardando) e.currentTarget.style.background = '#1C1B18'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
            >
              {guardando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
                : <><Save size={16} /> Guardar cambios</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
