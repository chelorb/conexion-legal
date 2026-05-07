// ============================================================
// src/pages/abogado/PerfilEditar.jsx
// Formulario para que el abogado edite su perfil profesional
// Incluye foto, especialidades, descripción y modalidades
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Save, Shield, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Especialidades disponibles (se cargan desde la API)
export default function PerfilEditar() {
  const { usuario, actualizarUsuario } = useAuth();

  const [perfil,          setPerfil]          = useState(null);
  const [especialidades,  setEspecialidades]  = useState([]);   // catálogo completo
  const [espSeleccionadas, setEspSeleccionadas] = useState([]); // las del abogado
  const [cargando,        setCargando]        = useState(true);
  const [guardando,       setGuardando]       = useState(false);
  const [subiendoFoto,    setSubiendoFoto]    = useState(false);
  const [avatarPreview,   setAvatarPreview]   = useState(null); // preview local

  const inputFotoRef = useRef(null); // Referencia al input file oculto

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

  // ── Cargar perfil y catálogo al montar ──────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const [perfilRes, espRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/abogados/especialidades'),
        ]);

        const p = perfilRes.data.usuario.perfil_abogado;
        setPerfil(p);
        setEspecialidades(espRes.data.especialidades);
        setEspSeleccionadas(p?.especialidades || []);
        setAvatarPreview(perfilRes.data.usuario.avatar_url);

        // Pre-cargar el formulario con los datos actuales
        reset({
          nombre:               perfilRes.data.usuario.nombre,
          apellido:             perfilRes.data.usuario.apellido,
          telefono:             perfilRes.data.usuario.telefono || '',
          matricula:            p?.matricula || '',
          anos_experiencia:     p?.anos_experiencia || '',
          descripcion:          p?.descripcion || '',
          ciudad:               p?.ciudad || '',
          provincia:            p?.provincia || '',
          direccion_consultorio: p?.direccion_consultorio || '',
          atiende_online:       p?.atiende_online ?? true,
          atiende_presencial:   p?.atiende_presencial ?? true,
        });
      } catch {
        toast.error('No se pudo cargar el perfil.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [reset]);

  // ── Toggle de especialidad seleccionada ────────────────────
  const toggleEspecialidad = (nombre) => {
    setEspSeleccionadas(prev =>
      prev.includes(nombre)
        ? prev.filter(e => e !== nombre)        // Quitar si ya estaba
        : prev.length < 10                      // Máximo 10 especialidades
          ? [...prev, nombre]
          : prev
    );
  };

  // ── Guardar cambios del perfil ─────────────────────────────
  const onSubmit = async (datos) => {
    if (espSeleccionadas.length === 0) {
      toast.error('Seleccioná al menos una especialidad.');
      return;
    }

    setGuardando(true);
    try {
      // Enviar todos los datos juntos al backend
      await api.put('/abogados/me/perfil', {
        ...datos,
        especialidades: espSeleccionadas,
      });

      // Actualizar el nombre en el contexto global si cambió
      actualizarUsuario({ nombre: datos.nombre, apellido: datos.apellido });

      toast.success('Perfil actualizado correctamente.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  // ── Subir foto de perfil ───────────────────────────────────
  const handleFoto = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // Validar tamaño y tipo antes de subir
    if (archivo.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB.');
      return;
    }

    // Mostrar preview inmediato (mejor UX)
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(archivo);

    // Subir al servidor
    setSubiendoFoto(true);
    try {
      const formData = new FormData();
      formData.append('avatar', archivo);

      const { data } = await api.post('/usuarios/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      actualizarUsuario({ avatar_url: data.avatar_url });
      toast.success('Foto actualizada.');
    } catch {
      toast.error('Error al subir la foto.');
      setAvatarPreview(usuario?.avatar_url); // Revertir preview
    } finally {
      setSubiendoFoto(false);
    }
  };

  // ── Estado de carga ────────────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8 max-w-4xl">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="section-title">Editar perfil</h1>
          <p className="section-subtitle">
            Un perfil completo mejora tu visibilidad y genera más confianza en los clientes.
          </p>
        </div>

        {/* Alerta: perfil incompleto */}
        {!perfil?.perfil_completo && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="font-body text-sm text-amber-700">
              Tu perfil está incompleto. Completá todos los campos para aparecer en la búsqueda de clientes.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Sección: Foto de perfil ─────────────────── */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-navy-900 text-lg mb-5">Foto de perfil</h2>

            <div className="flex items-center gap-6">
              {/* Avatar con botón de cambio */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-navy-100 overflow-hidden">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center bg-navy-900">
                        <span className="font-display font-bold text-white text-3xl">
                          {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
                        </span>
                      </div>
                    )
                  }
                </div>
                {/* Botón superpuesto para cambiar foto */}
                <button
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  disabled={subiendoFoto}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-navy-900 hover:bg-navy-800 rounded-full flex items-center justify-center transition-colors shadow-button"
                >
                  {subiendoFoto
                    ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    : <Camera size={14} className="text-white" />
                  }
                </button>
                {/* Input file oculto */}
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFoto}
                  className="hidden"
                />
              </div>

              <div>
                <p className="font-body font-medium text-navy-900 text-sm mb-1">
                  Subir nueva foto
                </p>
                <p className="font-body text-xs text-slate-400 leading-relaxed">
                  JPG, PNG o WebP · Máximo 5MB<br />
                  Recomendado: foto profesional, fondo claro
                </p>
              </div>
            </div>
          </div>

          {/* ── Sección: Datos personales ───────────────── */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-navy-900 text-lg mb-5">Datos personales</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Nombre</label>
                <input type="text" className={`input-field ${errors.nombre ? 'border-red-300' : ''}`}
                  {...register('nombre', { required: 'El nombre es obligatorio' })} />
                {errors.nombre && <p className="input-error">{errors.nombre.message}</p>}
              </div>

              <div>
                <label className="input-label">Apellido</label>
                <input type="text" className={`input-field ${errors.apellido ? 'border-red-300' : ''}`}
                  {...register('apellido', { required: 'El apellido es obligatorio' })} />
                {errors.apellido && <p className="input-error">{errors.apellido.message}</p>}
              </div>

              <div>
                <label className="input-label">Teléfono de contacto</label>
                <input type="tel" placeholder="+54 11 1234-5678" className="input-field"
                  {...register('telefono')} />
              </div>

              <div>
                <label className="input-label">
                  Matrícula profesional
                  {perfil?.matricula_verificada && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-normal">
                      <Shield size={11} /> Verificada
                    </span>
                  )}
                </label>
                <input type="text" placeholder="Ej: T-12345" className="input-field"
                  {...register('matricula')} />
              </div>

              <div>
                <label className="input-label">Años de experiencia</label>
                <input type="number" min="0" max="70" placeholder="Ej: 8" className="input-field"
                  {...register('anos_experiencia', {
                    min: { value: 0, message: 'Mínimo 0' },
                    max: { value: 70, message: 'Máximo 70' },
                  })} />
                {errors.anos_experiencia && <p className="input-error">{errors.anos_experiencia.message}</p>}
              </div>
            </div>
          </div>

          {/* ── Sección: Descripción profesional ────────── */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-navy-900 text-lg mb-2">Bio profesional</h2>
            <p className="font-body text-sm text-slate-500 mb-5">
              Esta descripción aparece en tu perfil público. Contá tu trayectoria, enfoque y qué te diferencia.
            </p>

            <textarea
              rows={5}
              placeholder="Ej: Abogada especializada en derecho de familia con 10 años de experiencia en el fuero civil. Atiendo casos de divorcio, alimentos, régimen de visitas y sucesiones..."
              className={`input-field resize-none ${errors.descripcion ? 'border-red-300' : ''}`}
              {...register('descripcion', {
                maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
              })}
            />
            {errors.descripcion && <p className="input-error">{errors.descripcion.message}</p>}
          </div>

          {/* ── Sección: Especialidades ─────────────────── */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-semibold text-navy-900 text-lg">Especialidades</h2>
              <span className="font-body text-xs text-slate-400">
                {espSeleccionadas.length}/10 seleccionadas
              </span>
            </div>
            <p className="font-body text-sm text-slate-500 mb-5">
              Seleccioná las áreas del derecho en las que ejercés.
            </p>

            <div className="flex flex-wrap gap-2">
              {especialidades.map(esp => {
                const seleccionada = espSeleccionadas.includes(esp.nombre);
                return (
                  <button
                    key={esp.id}
                    type="button"
                    onClick={() => toggleEspecialidad(esp.nombre)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-body font-medium transition-all ${
                      seleccionada
                        ? 'border-navy-900 bg-navy-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-navy-300 bg-white'
                    }`}
                  >
                    <span>{esp.icono}</span>
                    {esp.nombre}
                    {seleccionada && <Check size={13} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Sección: Ubicación y modalidad ──────────── */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-navy-900 text-lg mb-5">Ubicación y modalidad</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="input-label">Provincia</label>
                <input type="text" placeholder="Ej: Buenos Aires" className="input-field"
                  {...register('provincia')} />
              </div>

              <div>
                <label className="input-label">Ciudad</label>
                <input type="text" placeholder="Ej: CABA" className="input-field"
                  {...register('ciudad')} />
              </div>

              <div className="sm:col-span-2">
                <label className="input-label">
                  Dirección del consultorio
                  <span className="text-slate-400 font-normal ml-1">(opcional, solo para atención presencial)</span>
                </label>
                <input type="text" placeholder="Ej: Av. Corrientes 1234, Piso 3, Of. B" className="input-field"
                  {...register('direccion_consultorio')} />
              </div>
            </div>

            {/* Modalidades de atención */}
            <div>
              <label className="input-label mb-3">Modalidades de atención</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { campo: 'atiende_online',     label: 'Online',     desc: 'Videollamada',   icono: '💻' },
                  { campo: 'atiende_presencial', label: 'Presencial', desc: 'En consultorio', icono: '🏢' },
                ].map(({ campo, label, desc, icono }) => (
                  <label key={campo} className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-navy-300 transition-colors">
                    <input type="checkbox" className="rounded border-slate-300 text-navy-900 focus:ring-navy-900 w-4 h-4"
                      {...register(campo)} />
                    <span className="text-xl">{icono}</span>
                    <div>
                      <p className="font-body font-medium text-navy-900 text-sm">{label}</p>
                      <p className="font-body text-xs text-slate-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Botón guardar ───────────────────────────── */}
          <div className="flex items-center justify-between">
            <p className="font-body text-xs text-slate-400">
              {isDirty ? '● Hay cambios sin guardar' : '✓ Todo guardado'}
            </p>
            <button type="submit" disabled={guardando} className="btn-primary px-8 py-3.5">
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
