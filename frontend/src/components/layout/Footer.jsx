// ============================================================
// src/components/layout/Footer.jsx
// Pie de página con links, contacto e info legal
// ============================================================

import { Link } from 'react-router-dom';
import { Scale, Mail, Phone, MapPin, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-white">

      {/* ── Contenido principal ───────────────────────────── */}
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Columna 1 — Marca */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Scale size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg">
                Conexión<span className="text-gold-400">Legal</span>
              </span>
            </Link>
            <p className="font-body text-sm text-white/50 leading-relaxed mb-6">
              Conectamos personas con abogados confiables y verificados. Asesoramiento legal accesible, transparente y profesional.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Linkedin size={15} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Instagram size={15} />
              </a>
            </div>
          </div>

          {/* Columna 2 — Plataforma */}
          <div>
            <h4 className="font-body font-semibold text-white text-sm uppercase tracking-wider mb-4">Plataforma</h4>
            <ul className="space-y-3">
              {[
                { href: '/abogados', label: 'Buscar abogados' },
                { href: '/planes',   label: 'Planes y precios' },
                { href: '/registro', label: 'Registrarse como abogado' },
                { href: '/login',    label: 'Iniciar sesión' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link to={href} className="font-body text-sm text-white/50 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3 — Para abogados */}
          <div>
            <h4 className="font-body font-semibold text-white text-sm uppercase tracking-wider mb-4">Para abogados</h4>
            <ul className="space-y-3">
              {[
                { href: '/planes',              label: 'Ver todos los planes' },
                { href: '/abogado/campus',      label: 'Campus multimedia' },
                { href: '/abogado/beneficios',  label: 'Beneficios exclusivos' },
                { href: '/abogado/credencial',  label: 'Credencial virtual' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link to={href} className="font-body text-sm text-white/50 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4 — Contacto */}
          <div>
            <h4 className="font-body font-semibold text-white text-sm uppercase tracking-wider mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-white/40 mt-0.5 shrink-0" />
                <a href="mailto:info@conexionlegal.com.ar" className="font-body text-sm text-white/50 hover:text-white transition-colors">
                  info@conexionlegal.com.ar
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-white/40 mt-0.5 shrink-0" />
                <span className="font-body text-sm text-white/50">+54 11 XXXX-XXXX</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-white/40 mt-0.5 shrink-0" />
                <span className="font-body text-sm text-white/50">Argentina</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Barra inferior ────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="page-container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/30">
            © {anio} Conexión Legal. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {[
              { href: '/terminos',  label: 'Términos de uso' },
              { href: '/privacidad', label: 'Política de privacidad' },
            ].map(({ href, label }) => (
              <Link key={href} to={href} className="font-body text-xs text-white/30 hover:text-white/60 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
