// ============================================================
// src/pages/Login.jsx
// Formulario de inicio de sesión con validación
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Scale, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const { login }              = useAuth();
  const navigate               = useNavigate();
  const [searchParams]         = useSearchParams();
  const [verPassword, setVer]  = useState(false);
  const [cargando, setCargando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (datos) => {
    setCargando(true);
    try {
      const { data } = await api.post('/auth/login', datos);

      // Guardar sesión en el contexto global
      login(data.token, data.usuario);

      // Mostrar advertencias si las hay (ej: email sin verificar)
      if (data.advertencias?.length) {
        data.advertencias.forEach(a => toast(a, { icon: '⚠️' }));
      }

      toast.success(`¡Bienvenido/a, ${data.usuario.nombre}!`);

      // Redirigir según el rol
      const destinos = {
        abogado: '/abogado/dashboard',
        cliente: '/cliente/dashboard',
        admin:   '/admin/dashboard',
      };
      navigate(destinos[data.usuario.rol] || '/');

    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">

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
          <h1 className="font-display text-2xl font-bold text-navy-900 mb-1">Iniciar sesión</h1>
          <p className="font-body text-sm text-slate-500 mb-6">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="text-navy-700 hover:text-navy-900 font-medium">Registrate gratis</Link>
          </p>

          {/* Aviso de sesión expirada */}
          {searchParams.get('sesion_expirada') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="font-body text-sm text-amber-700">Tu sesión expiró. Por favor iniciá sesión nuevamente.</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="tucorreo@email.com"
                  className={`input-field pl-10 ${errors.email ? 'border-red-300 focus:border-red-400' : ''}`}
                  {...register('email', {
                    required: 'El email es obligatorio',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }
                  })}
                />
              </div>
              {errors.email && <p className="input-error">{errors.email.message}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label mb-0">Contraseña</label>
                <Link to="/reset-password" className="font-body text-xs text-navy-700 hover:text-navy-900">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={verPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-300' : ''}`}
                  {...register('password', { required: 'La contraseña es obligatoria' })}
                />
                <button
                  type="button"
                  onClick={() => setVer(!verPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="input-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5">
              {cargando ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Ingresando...</>
              ) : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
