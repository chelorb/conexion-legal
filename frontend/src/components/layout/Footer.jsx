// ============================================================
// src/components/layout/Footer.jsx
// Footer — Paleta C: Gris carbón + Cobre
// ============================================================

import { Link } from 'react-router-dom';
import { Scale, Mail, MapPin } from 'lucide-react';

// Ícono SVG de Instagram (más fiel que el de lucide-react)
function IconoInstagram({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

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
                IUSTI<span style={{ color: '#B86030' }}>XIUM</span>
              </span>
            </Link>
            <p className="font-body text-sm leading-relaxed mb-6"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Conectamos personas con abogados confiables y verificados. Asesoramiento legal accesible, transparente y profesional.
            </p>

            {/* Redes sociales */}
            <div className="flex gap-3">
              {/* Instagram — link real */}
              <a
                href="https://www.instagram.com/iustixium/"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram de IUSTIXIUM"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
              >
                <IconoInstagram size={15} />
              </a>
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
                { href: '/clientes',  label: 'Buscar abogados'          },
                { href: '/planes',    label: 'Planes y precios'          },
                { href: '/registro',  label: 'Registrarse como abogado'  },
                { href: '/login',     label: 'Iniciar sesión'            },
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
                { href: '/planes',             label: 'Ver todos los planes'   },
                { href: '/abogado/campus',     label: 'Campus multimedia'      },
                { href: '/abogado/beneficios', label: 'Beneficios exclusivos'  },
                { href: '/abogado/foro',       label: 'Foro de la comunidad'   },
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
                  href="mailto:info@iustixium.com.ar"
                  className="font-body text-sm transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  info@iustixium.com.ar
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
            © {anio} IUSTIXIUM. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {[
              { href: '/terminos',   label: 'Términos de uso'        },
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
