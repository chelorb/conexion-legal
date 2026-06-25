// ============================================================
// src/pages/ResetPassword.jsx
// ============================================================
import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Scale, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ResetPassword() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get('token');
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Sin token: modo "solicitar reset"
  if (!token) {
    return <SolicitarReset />;
  }

  const onSubmit = async ({ nuevaPassword }) => {
    setCargando(true);
    try {
      await api.post('/auth/reset-password', { token, nuevaPassword });
      toast.success('Contraseña restablecida. Ya podés iniciar sesión.');
      navigate('/login');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error al restablecer la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full animate-slide-up">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center">
              <Scale size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-navy-900">IUSTIXIUM</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-navy-900">Nueva contraseña</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="input-label">Nueva contraseña</label>
            <div className="relative">
              <input type={ver ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                className={`input-field pr-10 ${errors.nuevaPassword ? 'border-red-300' : ''}`}
                {...register('nuevaPassword', { required: true, minLength: { value: 8, message: 'Mínimo 8 caracteres' } })} />
              <button type="button" onClick={() => setVer(!ver)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                {ver ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.nuevaPassword && <p className="input-error">{errors.nuevaPassword.message}</p>}
          </div>
          <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5">
            {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}

function SolicitarReset() {
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async ({ email }) => {
    setCargando(true);
    try {
      await api.post('/auth/solicitar-reset-password', { email });
      setEnviado(true);
    } catch {
      toast.error('Error. Intentá nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full animate-slide-up">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-navy-900">Olvidé mi contraseña</h1>
          <p className="font-body text-sm text-slate-500 mt-1">Ingresá tu email y te enviaremos un enlace.</p>
        </div>
        {enviado ? (
          <div className="text-center py-4">
            <p className="font-body text-green-700 bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
              Si el email está registrado, recibirás un enlace en los próximos minutos.
            </p>
            <Link to="/login" className="btn-secondary w-full justify-center mt-4">Volver al login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="input-label">Email</label>
              <input type="email" placeholder="tucorreo@email.com" className="input-field"
                {...register('email', { required: true })} />
            </div>
            <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5">
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            <Link to="/login" className="btn-secondary w-full justify-center">Volver al login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
