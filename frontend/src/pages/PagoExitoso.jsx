// src/pages/PagoExitoso.jsx
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PagoExitoso() {
  const [params] = useSearchParams();
  const plan = params.get('plan') || '';
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card p-12 max-w-md w-full text-center animate-slide-up">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="font-display text-3xl font-bold text-navy-900 mb-3">¡Pago exitoso!</h1>
        <p className="font-body text-slate-500 mb-2">Tu suscripción al plan <strong className="text-navy-900 capitalize">{plan}</strong> fue activada.</p>
        <p className="font-body text-sm text-slate-400 mb-8">Te enviamos un email de confirmación con todos los detalles.</p>
        <Link to="/abogado/dashboard" className="btn-primary w-full justify-center">Ir a mi panel <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
