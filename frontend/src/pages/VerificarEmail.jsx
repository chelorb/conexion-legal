// ============================================================
// src/pages/VerificarEmail.jsx — Paleta C
// Verifica el token de email y muestra el resultado
// ============================================================

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Scale, Clock, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function VerificarEmail() {
  const [params]  = useSearchParams();
  const [estado,  setEstado]  = useState('verificando'); // verificando | ok | error | expirado
  const [mensaje, setMensaje] = useState('');
  const [email,   setEmail]   = useState('');
  const [reenv,   setReenv]   = useState(false);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setEstado('error');
      setMensaje('No se proporcionó un token de verificación.');
      return;
    }

    api.get(`/auth/verificar-email?token=${token}`)
      .then(r => {
        setEstado('ok');
        setMensaje(r.data.mensaje);
      })
      .catch(e => {
        const codigo = e.response?.data?.codigo;
        if (codigo === 'TOKEN_EXPIRADO') {
          setEstado('expirado');
        } else {
          setEstado('error');
        }
        setMensaje(e.response?.data?.error || 'Error al verificar el email.');
      });
  }, [params]);

  const reenviar = async () => {
    if (!email.trim()) return;
    setReenv(true);
    try {
      await api.post('/auth/reenviar-verificacion', { email });
      setEstado('ok');
      setMensaje('Te reenviamos el email de verificación. Revisá tu bandeja.');
    } catch (e) {
      setMensaje(e.response?.data?.error || 'Error al reenviar.');
    } finally {
      setReenv(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFED' }}>
      <div className="card p-10 max-w-md w-full text-center animate-slide-up">

        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2C2B27' }}>
            <Scale size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl" style={{ color: '#1C1B18' }}>
            Conexión<span style={{ color: '#B86030' }}>Legal</span>
          </span>
        </Link>

        {/* Verificando */}
        {estado === 'verificando' && (
          <div className="py-6">
            <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: '#2C2B27', borderTopColor: 'transparent' }} />
            <p className="font-body" style={{ color: '#8A8780' }}>Verificando tu email...</p>
          </div>
        )}

        {/* Éxito */}
        {estado === 'ok' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(22,163,74,0.1)' }}>
              <CheckCircle size={34} style={{ color: '#16a34a' }} />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2" style={{ color: '#1C1B18' }}>
              ¡Email verificado!
            </h1>
            <p className="font-body mb-8 leading-relaxed" style={{ color: '#8A8780' }}>{mensaje}</p>
            <Link to="/login"
              className="btn-primary w-full justify-center">
              Iniciar sesión
            </Link>
          </>
        )}

        {/* Token expirado */}
        {estado === 'expirado' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(184,96,48,0.1)' }}>
              <Clock size={34} style={{ color: '#B86030' }} />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2" style={{ color: '#1C1B18' }}>
              Enlace expirado
            </h1>
            <p className="font-body mb-6 leading-relaxed" style={{ color: '#8A8780' }}>
              {mensaje}
            </p>
            <div className="text-left mb-4">
              <label className="input-label">Tu email de registro</label>
              <input type="email" placeholder="tucorreo@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" />
            </div>
            <button onClick={reenviar} disabled={reenv || !email}
              className="btn-primary w-full justify-center gap-2 mb-3">
              {reenv
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
                : <><RefreshCw size={15} /> Reenviar verificación</>
              }
            </button>
            <Link to="/" className="btn-secondary w-full justify-center">Volver al inicio</Link>
          </>
        )}

        {/* Error genérico */}
        {estado === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(220,38,38,0.1)' }}>
              <XCircle size={34} style={{ color: '#dc2626' }} />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2" style={{ color: '#1C1B18' }}>
              Error de verificación
            </h1>
            <p className="font-body mb-8 leading-relaxed" style={{ color: '#8A8780' }}>{mensaje}</p>
            <Link to="/login" className="btn-primary w-full justify-center mb-3">
              Ir al login
            </Link>
            <Link to="/" className="btn-secondary w-full justify-center">Volver al inicio</Link>
          </>
        )}
      </div>
    </div>
  );
}
