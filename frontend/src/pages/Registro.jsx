// ============================================================
// src/pages/Registro.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Scale, Eye, EyeOff, User, Briefcase, Check, Clock, Shield, ArrowRight } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────
// Pantalla de confirmación para abogados pendientes
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
          ¡Registro completado, Dr./Dra. {nombre}!
        </h1>
        <p className="font-body mb-8 leading-relaxed" style={{ color: '#8A8780' }}>
          Tu cuenta fue creada. Antes de aparecer en la plataforma, nuestro equipo revisará tu perfil y matrícula profesional.
        </p>

        <div className="text-left space-y-4 mb-8">
          {[
            { num: '1', titulo: 'Verificá tu email',   desc: 'Te enviamos un email de confirmación. Hacé click en el enlace para activar tu cuenta.', hecho: true  },
            { num: '2', titulo: 'Revisión del equipo', desc: 'Nuestro equipo revisará tu perfil y matrícula. Este proceso tarda entre 24 y 48 horas hábiles.', hecho: false },
            { num: '3', titulo: 'Aprobación',          desc: 'Recibirás un email cuando tu perfil esté aprobado y visible para los clientes.', hecho: false },
          ].map(({ num, titulo, desc, hecho }) => (
            <div key={num} className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm"
                style={{
                  background: hecho ? 'rgba(34,197,94,0.1)' : '#F0EFED',
                  color:      hecho ? '#16a34a' : '#2C2B27',
                }}
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

        <div
          className="rounded-2xl p-5 mb-6 text-left"
          style={{ background: 'rgba(184,96,48,0.06)', border: '1px solid rgba(184,96,48,0.15)' }}
        >
          <div className="flex items-start gap-3">
            <Shield size={18} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
            <div>
              <p className="font-body font-semibold text-sm mb-1" style={{ color: '#1C1B18' }}>
                Mientras tanto, completá tu perfil
              </p>
              <p className="font-body text-xs leading-relaxed" style={{ color: '#8A8780' }}>
                Podés iniciar sesión y completar tu información profesional. Un perfil más completo acelera el proceso de aprobación.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/login"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors"
          style={{ background: '#2C2B27' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
        >
          Iniciar sesión y completar perfil <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Formulario principal
// ─────────────────────────────────────────────────────────────
export default function Registro() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [rol,          setRol]          = useState(searchParams.get('rol') || 'cliente');
  const [verPass,      setVer]          = useState(false);
  const [cargando,     setCargando]     = useState(false);
  const [captchaToken, setCaptchaToken] = useState(''); // token de hCaptcha
  const [abogadoPendiente, setAbogadoPendiente] = useState(null);
  const captchaRef = useRef(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password', '');

  const onSubmit = async (datos) => {
    // Verificar que el captcha fue resuelto (en producción)
    if (!captchaToken && import.meta.env.PROD) {
      toast.error('Por favor completá el captcha.');
      return;
    }

    setCargando(true);
    try {
      const { data } = await api.post('/auth/registro', {
        ...datos,
        rol,
        // Enviar el token de hCaptcha para verificación en el backend
        'h-captcha-response': captchaToken,
      });

      if (data.pendiente_aprobacion) {
        setAbogadoPendiente(datos.nombre);
      } else {
        toast.success('¡Registro exitoso! Verificá tu email para continuar.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrarse.');
      // Resetear el captcha para que el usuario pueda volver a intentar
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
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
              IUSTI<span style={{ color: '#B86030' }}>XIUM</span>
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
              { value: 'cliente', label: 'Busco un abogado', desc: 'Necesito asesoramiento',   icono: User      },
              { value: 'abogado', label: 'Soy abogado/a',   desc: 'Quiero ofrecer servicios', icono: Briefcase },
            ].map(({ value, label, desc, icono: Icono }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRol(value)}
                className="p-4 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: rol === value ? '#2C2B27' : '#E8E6E3',
                  background:  rol === value ? '#F7F6F4' : '#fff',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icono size={18} style={{ color: rol === value ? '#2C2B27' : '#8A8780' }} />
                  {rol === value && (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#2C2B27' }}>
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

          {/* Aviso abogado */}
          {rol === 'abogado' && (
            <div
              className="rounded-xl p-4 mb-5 flex items-start gap-3"
              style={{ background: 'rgba(184,96,48,0.06)', border: '1px solid rgba(184,96,48,0.2)' }}
            >
              <Clock size={16} className="shrink-0 mt-0.5" style={{ color: '#B86030' }} />
              <p className="font-body text-sm leading-relaxed" style={{ color: '#56534A' }}>
                Los perfiles de abogados son revisados antes de aparecer en la plataforma. El proceso tarda entre 24 y 48 horas hábiles.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Nombre</label>
                <input type="text" placeholder="Tu nombre"
                  className={`input-field ${errors.nombre ? 'border-red-300' : ''}`}
                  {...register('nombre', { required: 'Obligatorio', minLength: { value: 2, message: 'Mínimo 2' } })} />
                {errors.nombre && <p className="input-error">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="input-label">Apellido</label>
                <input type="text" placeholder="Tu apellido"
                  className={`input-field ${errors.apellido ? 'border-red-300' : ''}`}
                  {...register('apellido', { required: 'Obligatorio', minLength: { value: 2, message: 'Mínimo 2' } })} />
                {errors.apellido && <p className="input-error">{errors.apellido.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="input-label">Email</label>
              <input type="email" placeholder="tucorreo@email.com"
                className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                {...register('email', {
                  required: 'El email es obligatorio',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }
                })} />
              {errors.email && <p className="input-error">{errors.email.message}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label className="input-label">
                Teléfono <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
              </label>
              <input type="tel" placeholder="+54 11 1234-5678" className="input-field"
                {...register('telefono')} />
            </div>

            {/* Contraseña */}
            <div>
              <label className="input-label">Contraseña</label>
              <div className="relative">
                <input
                  type={verPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className={`input-field pr-10 ${errors.password ? 'border-red-300' : ''}`}
                  {...register('password', {
                    required:  'La contraseña es obligatoria',
                    minLength: { value: 8,           message: 'Mínimo 8 caracteres' },
                    pattern:   { value: /(?=.*[A-Z])(?=.*[0-9])/, message: 'Debe tener al menos una mayúscula y un número' },
                  })}
                />
                <button type="button" onClick={() => setVer(!verPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="input-error">{errors.password.message}</p>}

              {/* Indicador de fortaleza */}
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
                className="mt-0.5 rounded border-slate-300 w-4 h-4"
                style={{ accentColor: '#2C2B27' }}
                {...register('terminos', { required: 'Debés aceptar los términos' })} />
              <label htmlFor="terminos" className="font-body text-sm cursor-pointer" style={{ color: '#56534A' }}>
                Acepto los{' '}
                <Link to="/terminos" className="hover:underline" style={{ color: '#B86030' }}>términos de uso</Link>{' '}
                y la{' '}
                <Link to="/privacidad" className="hover:underline" style={{ color: '#B86030' }}>política de privacidad</Link>
              </label>
            </div>
            {errors.terminos && <p className="input-error -mt-2">{errors.terminos.message}</p>}

            {/* ── hCaptcha ─────────────────────────────────── */}
            <div className="flex justify-center py-1">
              <HCaptcha
                ref={captchaRef}
                sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken('')}
                onError={() => {
                  setCaptchaToken('');
                  toast.error('Error en el captcha. Por favor intentá de nuevo.');
                }}
                theme="light"
                size="normal"
              />
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={cargando || (import.meta.env.PROD && !captchaToken)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors mt-2 disabled:opacity-50"
              style={{ background: '#2C2B27' }}
              onMouseEnter={e => { if (!cargando) e.currentTarget.style.background = '#1C1B18'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
            >
              {cargando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creando cuenta...</>
                : `Crear cuenta ${rol === 'abogado' ? 'como abogado' : 'como cliente'}`
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
