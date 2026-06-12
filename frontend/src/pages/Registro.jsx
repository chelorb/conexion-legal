// ============================================================
// src/pages/Registro.jsx — Paleta C: Gris carbón + Cobre
// Registro diferenciado:
//   · Cliente: un solo paso (nombre, email, teléfono, contraseña)
//   · Abogado: dos pasos
//       Paso 1 — datos personales (nombre, DNI/CUIT, email, teléfono, contraseña)
//       Paso 2 — documentación (credencial, título, constancia CUIL)
// ============================================================

import { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Scale, Eye, EyeOff, User, Briefcase,
  Check, Clock, Shield, ArrowRight,
  Upload, X, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────
// Pantalla de éxito para abogados — queda pendiente de revisión
// ─────────────────────────────────────────────────────────────
function PantallaAbogadoPendiente({ nombre }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFED' }}>
      <div className="card p-10 max-w-lg w-full text-center animate-slide-up">

        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(184,96,48,0.1)' }}>
          <Clock size={40} style={{ color: '#B86030' }} />
        </div>

        <h1 className="font-display text-3xl font-bold mb-3" style={{ color: '#1C1B18' }}>
          ¡Registro completado!
        </h1>
        <p className="font-body mb-8 leading-relaxed" style={{ color: '#8A8780' }}>
          Recibimos tus datos y documentación, Dr./Dra. <strong>{nombre}</strong>. Nuestro equipo los revisará
          y te avisará por email cuando tu perfil esté aprobado.
        </p>

        <div className="text-left space-y-4 mb-8">
          {[
            { num: '1', titulo: 'Verificá tu email',   desc: 'Te enviamos un link de confirmación a tu casilla.',                          hecho: true  },
            { num: '2', titulo: 'Revisión del equipo', desc: 'Verificamos tu documentación. Proceso: 24–48 hs hábiles.',                    hecho: false },
            { num: '3', titulo: 'Aprobación',          desc: 'Recibirás un email cuando tu perfil esté activo y visible para los clientes.', hecho: false },
          ].map(({ num, titulo, desc, hecho }) => (
            <div key={num} className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm"
                style={{ background: hecho ? 'rgba(34,197,94,0.1)' : '#F0EFED', color: hecho ? '#16a34a' : '#2C2B27' }}
              >
                {hecho ? <Check size={16} /> : num}
              </div>
              <div>
                <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>{titulo}</p>
                <p className="font-body text-xs mt-0.5 leading-relaxed" style={{ color: '#8A8780' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/login"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors"
          style={{ background: '#2C2B27' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
        >
          Ir al inicio de sesión <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente: campo de subida de archivo con preview
// ─────────────────────────────────────────────────────────────
function CampoArchivo({ label, descripcion, nombre, requerido, archivo, onChange }) {
  const inputRef = useRef(null);

  return (
    <div>
      <label className="input-label">
        {label}{requerido && <span style={{ color: '#B86030' }}> *</span>}
      </label>
      {descripcion && (
        <p className="font-body text-xs mb-2" style={{ color: '#8A8780' }}>{descripcion}</p>
      )}

      {archivo ? (
        // Vista cuando hay un archivo seleccionado
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
          style={{ background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.25)' }}
        >
          <FileText size={18} style={{ color: '#16a34a' }} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-medium truncate" style={{ color: '#1C1B18' }}>
              {archivo.name}
            </p>
            <p className="font-body text-xs" style={{ color: '#8A8780' }}>
              {(archivo.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1.5 rounded-lg transition-colors shrink-0"
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
          >
            <X size={14} style={{ color: '#dc2626' }} />
          </button>
        </div>
      ) : (
        // Zona de drop/click
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed transition-all"
          style={{ borderColor: '#D4D2CC' }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#B86030';
            e.currentTarget.style.background  = 'rgba(184,96,48,0.03)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#D4D2CC';
            e.currentTarget.style.background  = '';
          }}
        >
          <Upload size={20} style={{ color: '#8A8780' }} />
          <span className="font-body text-sm" style={{ color: '#8A8780' }}>
            Click para subir archivo
          </span>
          <span className="font-body text-xs" style={{ color: '#B0AEA8' }}>
            JPG, PNG, PDF · Máx. 10 MB
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={e => onChange(e.target.files?.[0] || null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Indicador de pasos (solo para abogados)
// ─────────────────────────────────────────────────────────────
function IndicadorPasos({ pasoActual }) {
  const pasos = ['Datos personales', 'Documentación'];
  return (
    <div className="flex items-center gap-2 mb-6">
      {pasos.map((label, i) => {
        const n      = i + 1;
        const activo = pasoActual === n;
        const listo  = pasoActual > n;
        return (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-semibold shrink-0"
              style={listo
                ? { background: '#16a34a', color: '#fff' }
                : activo
                  ? { background: '#2C2B27', color: '#fff' }
                  : { background: '#F0EFED', color: '#8A8780' }
              }
            >
              {listo ? <Check size={13} /> : n}
            </div>
            <span className="font-body text-xs" style={{ color: activo ? '#1C1B18' : '#8A8780' }}>
              {label}
            </span>
            {i < pasos.length - 1 && (
              <div className="flex-1 h-px mx-1" style={{ background: listo ? '#16a34a' : '#E8E6E3' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal de Registro
// ─────────────────────────────────────────────────────────────
export default function Registro() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [rol,   setRol]   = useState(searchParams.get('rol') || 'cliente');
  const [paso,  setPaso]  = useState(1);
  const [verPass, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [abogadoPendiente, setAbogadoPendiente] = useState(null);

  // Archivos (solo abogados)
  const [docCredencial, setDocCredencial] = useState(null);
  const [docTitulo,     setDocTitulo]     = useState(null);
  const [docCuil,       setDocCuil]       = useState(null);

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm();
  const password = watch('password', '');

  // Al cambiar de rol, resetear al paso 1
  const cambiarRol = (nuevoRol) => {
    setRol(nuevoRol);
    setPaso(1);
    setDocCredencial(null);
    setDocTitulo(null);
    setDocCuil(null);
  };

  // Validar paso 1 antes de avanzar al paso 2 (abogados)
  const irAlPaso2 = async () => {
    const valido = await trigger(['nombre', 'apellido', 'dni_cuit', 'email', 'telefono', 'password', 'terminos']);
    if (valido) setPaso(2);
  };

  const onSubmit = async (datos) => {
    // Validar archivos obligatorios para abogados
    if (rol === 'abogado') {
      if (!docCredencial) { toast.error('La credencial del letrado es obligatoria.'); return; }
      if (!docTitulo)     { toast.error('El título universitario es obligatorio.'); return; }
      if (!docCuil)       { toast.error('La constancia de CUIL es obligatoria.'); return; }
    }

    setCargando(true);
    try {
      if (rol === 'abogado') {
        // Enviar como multipart/form-data para incluir archivos
        const formData = new FormData();
        Object.entries({ ...datos, rol }).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') formData.append(k, String(v));
        });
        formData.append('doc_credencial', docCredencial);
        formData.append('doc_titulo',     docTitulo);
        formData.append('doc_cuil',       docCuil);

        const { data } = await api.post('/auth/registro', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAbogadoPendiente(datos.nombre);

      } else {
        // Cliente: JSON simple
        const { data } = await api.post('/auth/registro', { ...datos, rol });
        toast.success('¡Registro exitoso! Verificá tu email para continuar.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrarse.');
      if (rol === 'abogado' && paso === 2) setPaso(1);
    } finally {
      setCargando(false);
    }
  };

  if (abogadoPendiente) return <PantallaAbogadoPendiente nombre={abogadoPendiente} />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ background: '#F0EFED' }}>
      <div className="w-full max-w-lg animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2C2B27' }}>
              <Scale size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>
              Conexión<span style={{ color: '#B86030' }}>Legal</span>
            </span>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: '#1C1B18' }}>
            Crear cuenta
          </h1>
          <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: '#B86030' }}>
              Iniciá sesión
            </Link>
          </p>

          {/* Selector de rol */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'cliente', label: 'Busco un abogado',  desc: 'Necesito asesoramiento',     icono: User      },
              { value: 'abogado', label: 'Soy abogado/a',     desc: 'Quiero ofrecer servicios',    icono: Briefcase },
            ].map(({ value, label, desc, icono: Icono }) => (
              <button
                key={value}
                type="button"
                onClick={() => cambiarRol(value)}
                className="p-4 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: rol === value ? '#2C2B27' : '#E8E6E3',
                  background:  rol === value ? '#F7F6F4' : '#fff',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icono size={18} style={{ color: rol === value ? '#2C2B27' : '#8A8780' }} />
                  {rol === value && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#2C2B27' }}>
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <p className="font-body font-medium text-sm" style={{ color: rol === value ? '#1C1B18' : '#3A3832' }}>
                  {label}
                </p>
                <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>{desc}</p>
              </button>
            ))}
          </div>

          {/* Indicador de pasos (solo abogados) */}
          {rol === 'abogado' && <IndicadorPasos pasoActual={paso} />}

          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="space-y-4">

            {/* ══════════════════════════════════════════════
                PASO 1 — Datos personales (cliente y abogado)
               ══════════════════════════════════════════════ */}
            {paso === 1 && (
              <>
                {/* Aviso abogado */}
                {rol === 'abogado' && (
                  <div className="rounded-xl p-4 flex items-start gap-3"
                    style={{ background: 'rgba(184,96,48,0.06)', border: '1px solid rgba(184,96,48,0.2)' }}>
                    <Clock size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                    <p className="font-body text-sm leading-relaxed" style={{ color: '#56534A' }}>
                      El perfil será revisado antes de aparecer en la plataforma.
                      En el siguiente paso deberás subir tu credencial, título y constancia de CUIL.
                    </p>
                  </div>
                )}

                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Nombre *</label>
                    <input type="text" placeholder="Tu nombre"
                      className={`input-field ${errors.nombre ? 'border-red-300' : ''}`}
                      {...register('nombre', { required: 'Obligatorio', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })} />
                    {errors.nombre && <p className="input-error">{errors.nombre.message}</p>}
                  </div>
                  <div>
                    <label className="input-label">Apellido *</label>
                    <input type="text" placeholder="Tu apellido"
                      className={`input-field ${errors.apellido ? 'border-red-300' : ''}`}
                      {...register('apellido', { required: 'Obligatorio', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })} />
                    {errors.apellido && <p className="input-error">{errors.apellido.message}</p>}
                  </div>
                </div>

                {/* DNI o CUIT (solo abogados) */}
                {rol === 'abogado' && (
                  <div>
                    <label className="input-label">DNI o CUIT *</label>
                    <input type="text" placeholder="Ej: 30123456 o 20-30123456-7"
                      className={`input-field ${errors.dni_cuit ? 'border-red-300' : ''}`}
                      {...register('dni_cuit', {
                        required: 'El DNI o CUIT es obligatorio',
                        minLength: { value: 7, message: 'Ingresá un número válido' },
                      })} />
                    {errors.dni_cuit && <p className="input-error">{errors.dni_cuit.message}</p>}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="input-label">Email *</label>
                  <input type="email" placeholder="tucorreo@email.com" autoComplete="off"
                    className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                    {...register('email', {
                      required: 'El email es obligatorio',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
                    })} />
                  {errors.email && <p className="input-error">{errors.email.message}</p>}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="input-label">
                    Teléfono{rol === 'abogado'
                      ? <span style={{ color: '#B86030' }}> *</span>
                      : <span className="font-normal" style={{ color: '#8A8780' }}> (opcional)</span>
                    }
                  </label>
                  <input type="tel" placeholder="+54 11 1234-5678" className="input-field"
                    {...register('telefono', rol === 'abogado'
                      ? { required: 'El teléfono es obligatorio para abogados' }
                      : {}
                    )} />
                  {errors.telefono && <p className="input-error">{errors.telefono.message}</p>}
                </div>

                {/* Contraseña */}
                <div>
                  <label className="input-label">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={verPass ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres, una mayúscula y un número"
                      autoComplete="new-password"
                      className={`input-field pr-10 ${errors.password ? 'border-red-300' : ''}`}
                      {...register('password', {
                        required: 'La contraseña es obligatoria',
                        minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                        pattern:   { value: /(?=.*[A-Z])(?=.*[0-9])/, message: 'Debe incluir al menos una mayúscula y un número' },
                      })}
                    />
                    <button type="button" onClick={() => setVer(!verPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="input-error">{errors.password.message}</p>}
                  {/* Barra de fortaleza */}
                  {password && (
                    <div className="flex gap-1 mt-2">
                      {[password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), password.length >= 12].map((ok, i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-colors"
                          style={{ background: ok ? '#2C2B27' : '#E8E6E3' }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Términos */}
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="terminos"
                    className="mt-0.5 rounded w-4 h-4" style={{ accentColor: '#2C2B27' }}
                    {...register('terminos', { required: 'Debés aceptar los términos' })} />
                  <label htmlFor="terminos" className="font-body text-sm cursor-pointer" style={{ color: '#56534A' }}>
                    Acepto los{' '}
                    <Link to="/terminos" className="hover:underline" style={{ color: '#B86030' }}>términos de uso</Link>{' '}
                    y la{' '}
                    <Link to="/privacidad" className="hover:underline" style={{ color: '#B86030' }}>política de privacidad</Link>
                  </label>
                </div>
                {errors.terminos && <p className="input-error -mt-2">{errors.terminos.message}</p>}

                {/* Botón */}
                {rol === 'abogado' ? (
                  <button type="button" onClick={irAlPaso2}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors mt-2"
                    style={{ background: '#2C2B27' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                  >
                    Continuar — Subir documentación <ArrowRight size={15} />
                  </button>
                ) : (
                  <button type="submit" disabled={cargando}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors mt-2 disabled:opacity-50"
                    style={{ background: '#2C2B27' }}
                    onMouseEnter={e => { if (!cargando) e.currentTarget.style.background = '#1C1B18'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                  >
                    {cargando
                      ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creando cuenta...</>
                      : 'Crear cuenta como cliente'
                    }
                  </button>
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════
                PASO 2 — Documentación (solo abogados)
               ══════════════════════════════════════════════ */}
            {paso === 2 && rol === 'abogado' && (
              <>
                <div className="rounded-xl p-4 flex items-start gap-3"
                  style={{ background: 'rgba(44,43,39,0.04)', border: '1px solid rgba(44,43,39,0.1)' }}>
                  <Shield size={15} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
                  <p className="font-body text-xs leading-relaxed" style={{ color: '#56534A' }}>
                    Esta documentación es confidencial y solo la revisa el equipo de administración
                    para verificar tu identidad profesional.
                  </p>
                </div>

                {/* Credencial del letrado */}
                <CampoArchivo
                  label="Credencial del letrado"
                  descripcion="Foto o PDF de tu credencial vigente del Colegio de Abogados"
                  requerido
                  archivo={docCredencial}
                  onChange={setDocCredencial}
                />

                {/* Título universitario */}
                <CampoArchivo
                  label="Título universitario"
                  descripcion="Foto o PDF de tu diploma o certificado de graduación"
                  requerido
                  archivo={docTitulo}
                  onChange={setDocTitulo}
                />

                {/* Constancia de CUIL */}
                <CampoArchivo
                  label="Constancia de CUIL"
                  descripcion="Constancia emitida por AFIP que muestre tu CUIL"
                  requerido
                  archivo={docCuil}
                  onChange={setDocCuil}
                />

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setPaso(1)}
                    className="btn-secondary flex-1">
                    ← Volver
                  </button>
                  <button type="submit" disabled={cargando}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors disabled:opacity-50"
                    style={{ background: '#2C2B27' }}
                    onMouseEnter={e => { if (!cargando) e.currentTarget.style.background = '#1C1B18'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
                  >
                    {cargando
                      ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
                      : 'Enviar registro'
                    }
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
