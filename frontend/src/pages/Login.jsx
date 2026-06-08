// ============================================================
// src/pages/Login.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Scale, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const [searchParams]          = useSearchParams();
  const [verPassword, setVer]   = useState(false);
  const [cargando, setCargando] = useState(false);
  const [emailNoVerificado, setEmailNoVerificado] = useState(false);
  const [reenviadando, setReenviando] = useState(false);
  const [emailIngresado, setEmailIngresado] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const reenviarVerificacion = async () => {
    setReenviando(true);
    try {
      await api.post('/auth/reenviar-verificacion', { email: emailIngresado });
      toast.success('Te reenviamos el email de verificación.');
      setEmailNoVerificado(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al reenviar el email.');
    } finally {
      setReenviando(false);
    }
  };

  const onSubmit = async (datos) => {
    setCargando(true);
    setEmailNoVerificado(false);
    setEmailIngresado(datos.email);
    try {
      const { data } = await api.post('/auth/login', datos);
      login(data.token, data.usuario);
      if (data.advertencias?.length) {
        data.advertencias.forEach(a => toast(a, { icon: '⚠️' }));
      }
      toast.success(`¡Bienvenido/a, ${data.usuario.nombre}!`);
      const destinos = {
        abogado: '/abogado/dashboard',
        cliente: '/mis-consultas',
        admin:   '/admin/dashboard',
      };
      navigate(destinos[data.usuario.rol] || '/');
    } catch (err) {
      const codigo = err.response?.data?.codigo;
      if (codigo === 'EMAIL_NO_VERIFICADO') {
        setEmailNoVerificado(true);
      } else {
        toast.error(err.response?.data?.error || 'Error al iniciar sesión.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFED' }}>
      <div className="w-full max-w-md animate-slide-up">

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
            Iniciar sesión
          </h1>
          <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="font-medium hover:underline" style={{ color: '#B86030' }}>
              Registrate gratis
            </Link>
          </p>

          {/* Aviso sesión expirada */}
          {searchParams.get('sesion_expirada') && (
            <div className="rounded-xl p-4 mb-5 flex items-start gap-3"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#b45309' }} />
              <p className="font-body text-sm" style={{ color: '#92400e' }}>
                Tu sesión expiró. Iniciá sesión nuevamente.
              </p>
            </div>
          )}

          {/* Aviso email no verificado */}
          {emailNoVerificado && (
            <div className="rounded-xl p-4 mb-5 animate-slide-down"
              style={{ background: 'rgba(184,96,48,0.06)', border: '1px solid rgba(184,96,48,0.25)' }}>
              <p className="font-body text-sm font-semibold mb-1" style={{ color: '#B86030' }}>
                📧 Verificá tu email antes de continuar
              </p>
              <p className="font-body text-xs mb-3" style={{ color: '#56534A' }}>
                Te enviamos un email de verificación cuando te registraste.
                Si no lo encontrás, revisá la carpeta de spam.
              </p>
              <button
                onClick={reenviarVerificacion}
                disabled={reenviadando}
                className="font-body text-xs font-medium underline transition-colors"
                style={{ color: '#B86030' }}
              >
                {reenviadando ? 'Enviando...' : 'Reenviar email de verificación'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
                <input type="email" placeholder="tucorreo@email.com"
                  className={`input-field pl-10 ${errors.email ? 'border-red-300' : ''}`}
                  {...register('email', {
                    required: 'El email es obligatorio',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
                  })} />
              </div>
              {errors.email && <p className="input-error">{errors.email.message}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label mb-0">Contraseña</label>
                <Link to="/reset-password" className="font-body text-xs hover:underline"
                  style={{ color: '#B86030' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
                <input type={verPassword ? 'text' : 'password'} placeholder="Tu contraseña"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-300' : ''}`}
                  {...register('password', { required: 'La contraseña es obligatoria' })} />
                <button type="button" onClick={() => setVer(!verPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }}>
                  {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="input-error">{errors.password.message}</p>}
            </div>

            {/* Botón */}
            <button type="submit" disabled={cargando}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors disabled:opacity-50"
              style={{ background: '#2C2B27' }}
              onMouseEnter={e => { if (!cargando) e.currentTarget.style.background = '#1C1B18'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}>
              {cargando
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Ingresando...</>
                : 'Iniciar sesión'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
