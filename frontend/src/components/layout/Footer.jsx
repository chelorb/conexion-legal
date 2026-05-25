// ============================================================
// src/components/layout/Footer.jsx
// Footer — Paleta C: Gris carbón + Cobre
// ============================================================

import { Link } from 'react-router-dom';
import { Scale, Mail, MapPin, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer style={{ background: '#1C1B18' }}>

      {/* Contenido principal */}
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Marca */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <Scale size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg">
                Conexión<span style={{ color: '#B86030' }}>Legal</span>
              </span>
            </Link>
            <p className="font-body text-sm leading-relaxed mb-6"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Conectamos personas con abogados confiables y verificados. Asesoramiento legal accesible, transparente y profesional.
            </p>
            <div className="flex gap-3">
              {[Linkedin, Instagram].map((Icono, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                >
                  <Icono size={15} className="text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4
              className="font-body font-semibold text-sm uppercase tracking-wider mb-4"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Plataforma
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/clientes',      label: 'Buscar abogados' },
                { href: '/planes',        label: 'Planes y precios' },
                { href: '/registro',      label: 'Registrarse como abogado' },
                { href: '/login',         label: 'Iniciar sesión' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="font-body text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Para abogados */}
          <div>
            <h4
              className="font-body font-semibold text-sm uppercase tracking-wider mb-4"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Para abogados
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/planes',              label: 'Ver todos los planes' },
                { href: '/abogado/campus',      label: 'Campus multimedia' },
                { href: '/abogado/beneficios',  label: 'Beneficios exclusivos' },
                { href: '/abogado/foro',        label: 'Foro de la comunidad' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="font-body text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4
              className="font-body font-semibold text-sm uppercase tracking-wider mb-4"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Contacto
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail size={15} className="shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <a
                  href="mailto:info@conexionlegal.com.ar"
                  className="font-body text-sm transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  info@conexionlegal.com.ar
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Argentina
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="page-container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © {anio} Conexión Legal. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {[
              { href: '/terminos',   label: 'Términos de uso' },
              { href: '/privacidad', label: 'Política de privacidad' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                to={href}
                className="font-body text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
