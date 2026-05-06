// ============================================================
// src/pages/Registro.jsx
// Formulario de registro — elige entre ser cliente o abogado
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Scale, Eye, EyeOff, User, Briefcase, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Registro() {
  const navigate           = useNavigate();
  const [searchParams]     = useSearchParams();
  // El rol puede venir pre-seleccionado desde la URL (?rol=abogado)
  const [rol, setRol]      = useState(searchParams.get('rol') || 'cliente');
  const [verPass, setVer]  = useState(false);
  const [cargando, setCargando] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password', '');

  const onSubmit = async (datos) => {
    setCargando(true);
    try {
      await api.post('/auth/registro', { ...datos, rol });

      toast.success('¡Registro exitoso! Revisá tu email para verificar tu cuenta.');
      navigate('/login');

    } catch (err) {
      const msg = err.response?.data?.error || 'Error al registrarse.';
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <Scale size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-navy-900 text-xl">
              Conexión<span className="text-gold-500">Legal</span>
            </span>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold text-navy-900 mb-1">Crear cuenta</h1>
          <p className="font-body text-sm text-slate-500 mb-6">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-navy-700 hover:text-navy-900 font-medium">Iniciá sesión</Link>
          </p>

          {/* ── Selector de rol ─────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'cliente',  label: 'Busco un abogado',     icono: User,      desc: 'Necesito asesoramiento legal' },
              { value: 'abogado',  label: 'Soy abogado/a',        icono: Briefcase, desc: 'Quiero ofrecer mis servicios' },
            ].map(({ value, label, icono: Icono, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRol(value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  rol === value
                    ? 'border-navy-900 bg-navy-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icono size={18} className={rol === value ? 'text-navy-900' : 'text-slate-400'} />
                  {rol === value && (
                    <div className="w-4 h-4 bg-navy-900 rounded-full flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <p className={`font-body font-medium text-sm ${rol === value ? 'text-navy-900' : 'text-slate-700'}`}>
                  {label}
                </p>
                <p className="font-body text-xs text-slate-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {/* ── Formulario ──────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Nombre y Apellido en fila */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Nombre</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className={`input-field ${errors.nombre ? 'border-red-300' : ''}`}
                  {...register('nombre', { required: 'Obligatorio', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                />
                {errors.nombre && <p className="input-error">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="input-label">Apellido</label>
                <input
                  type="text"
                  placeholder="Tu apellido"
                  className={`input-field ${errors.apellido ? 'border-red-300' : ''}`}
                  {...register('apellido', { required: 'Obligatorio', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                />
                {errors.apellido && <p className="input-error">{errors.apellido.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                placeholder="tucorreo@email.com"
                className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                {...register('email', {
                  required: 'El email es obligatorio',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }
                })}
              />
              {errors.email && <p className="input-error">{errors.email.message}</p>}
            </div>

            {/* Teléfono (opcional) */}
            <div>
              <label className="input-label">Teléfono <span className="text-slate-400 font-normal">(opcional)</span></label>
              <input
                type="tel"
                placeholder="+54 11 1234-5678"
                className="input-field"
                {...register('telefono')}
              />
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
                    required: 'La contraseña es obligatoria',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                    pattern: { value: /(?=.*[A-Z])(?=.*[0-9])/, message: 'Debe tener al menos una mayúscula y un número' },
                  })}
                />
                <button type="button" onClick={() => setVer(!verPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="input-error">{errors.password.message}</p>}

              {/* Indicador de fortaleza de contraseña */}
              {password && (
                <div className="mt-2 flex gap-1">
                  {[
                    password.length >= 8,
                    /[A-Z]/.test(password),
                    /[0-9]/.test(password),
                    password.length >= 12,
                  ].map((ok, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? 'bg-navy-900' : 'bg-slate-200'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Términos y condiciones */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terminos"
                className="mt-0.5 rounded border-slate-300 text-navy-900 focus:ring-navy-900"
                {...register('terminos', { required: 'Debés aceptar los términos' })}
              />
              <label htmlFor="terminos" className="font-body text-sm text-slate-600 cursor-pointer">
                Acepto los{' '}
                <Link to="/terminos" className="text-navy-700 hover:underline">términos de uso</Link>{' '}
                y la{' '}
                <Link to="/privacidad" className="text-navy-700 hover:underline">política de privacidad</Link>
              </label>
            </div>
            {errors.terminos && <p className="input-error -mt-2">{errors.terminos.message}</p>}

            <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5 mt-2">
              {cargando ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creando cuenta...</>
              ) : `Crear cuenta ${rol === 'abogado' ? 'como abogado' : 'como cliente'}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
