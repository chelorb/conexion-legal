// ============================================================
// src/pages/VerificarEmail.jsx
// ============================================================
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Scale } from 'lucide-react';
import api from '../services/api';

export default function VerificarEmail() {
  const [params]   = useSearchParams();
  const [estado,   setEstado]   = useState('verificando'); // 'verificando' | 'ok' | 'error'
  const [mensaje,  setMensaje]  = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setEstado('error'); setMensaje('Token no proporcionado.'); return; }

    api.get(`/auth/verificar-email?token=${token}`)
      .then(r => { setEstado('ok'); setMensaje(r.data.mensaje); })
      .catch(e => { setEstado('error'); setMensaje(e.response?.data?.error || 'Error al verificar.'); });
  }, [params]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card p-10 max-w-md w-full text-center animate-slide-up">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center">
            <Scale size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-navy-900">Conexión<span className="text-gold-500">Legal</span></span>
        </Link>

        {estado === 'verificando' && (
          <div className="py-6">
            <div className="w-10 h-10 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-body text-slate-500">Verificando tu email...</p>
          </div>
        )}

        {estado === 'ok' && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">¡Email verificado!</h1>
            <p className="font-body text-slate-500 mb-6">{mensaje}</p>
            <Link to="/login" className="btn-primary w-full justify-center">Iniciar sesión</Link>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900 mb-2">Error de verificación</h1>
            <p className="font-body text-slate-500 mb-6">{mensaje}</p>
            <Link to="/" className="btn-secondary w-full justify-center">Volver al inicio</Link>
          </>
        )}
      </div>
    </div>
  );
}
