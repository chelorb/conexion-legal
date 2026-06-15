// ============================================================
// src/pages/NotFound.jsx — Página 404 personalizada
// Paleta C: Gris carbón + Cobre
// ============================================================

import { useNavigate, Link } from 'react-router-dom';
import { Scale, ArrowLeft, Home, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const navigate  = useNavigate();
  const { estaAutenticado, esAbogado, esAdmin } = useAuth();

  // Destino del botón "Ir al panel" según rol
  const destino = esAdmin    ? '/admin/dashboard'
    : esAbogado  ? '/abogado/dashboard'
    : estaAutenticado ? '/cliente/dashboard'
    : '/';

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F0EFED' }}>
      <div className="max-w-lg w-full text-center animate-slide-up">

        {/* Logo / ícono */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8"
          style={{ background: '#1C1B18' }}
        >
          <Scale size={42} className="text-white" />
        </div>

        {/* Número 404 */}
        <div className="mb-4">
          <span
            className="font-display font-bold"
            style={{
              fontSize: 'clamp(5rem, 20vw, 8rem)',
              lineHeight: 1,
              color: '#E8E6E3',
              letterSpacing: '-0.04em',
            }}
          >
            404
          </span>
        </div>

        {/* Título y descripción */}
        <h1 className="font-display font-bold text-2xl mb-3" style={{ color: '#1C1B18' }}>
          Página no encontrada
        </h1>
        <p className="font-body leading-relaxed mb-10" style={{ color: '#56534A' }}>
          La página que buscás no existe o fue movida.
          Revisá la URL o volvé al inicio.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary gap-2"
          >
            <ArrowLeft size={16} /> Volver atrás
          </button>

          <Link to={destino} className="btn-primary gap-2">
            <Home size={16} />
            {estaAutenticado ? 'Ir a mi panel' : 'Ir al inicio'}
          </Link>

          {/* Si no está autenticado, mostrar link a búsqueda */}
          {!estaAutenticado && (
            <Link
              to="/clientes"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-medium border transition-colors"
              style={{ borderColor: '#D4D2CC', color: '#56534A' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E8E6E3'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
            >
              <Search size={16} /> Buscar abogado
            </Link>
          )}
        </div>

        {/* Marca */}
        <p className="font-body text-xs mt-12" style={{ color: '#B0AEA8' }}>
          IUSTIXIUM — Asesoría Legal Digital
        </p>
      </div>
    </div>
  );
}
