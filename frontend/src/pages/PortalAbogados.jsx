// ============================================================
// src/pages/PortalAbogados.jsx
// Landing para abogados — Paleta C: Gris carbón + Cobre
// ============================================================

import { Link } from 'react-router-dom';
import {
  Scale, ArrowRight, BookOpen, Calendar,
  Users, Shield, Check, ChevronRight
} from 'lucide-react';

export default function PortalAbogados() {
  return (
    <div className="animate-fade-in">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A0908 0%, #2C2B27 100%)' }}
      >
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `radial-gradient(circle at 80% 50%, #B86030 0%, transparent 50%)`
        }} />
        <div className="page-container relative z-10">
          <div className="max-w-2xl">
            <p className="font-body text-sm font-medium uppercase tracking-widest mb-5"
              style={{ color: '#B86030' }}>
              Para profesionales del derecho
            </p>
            <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6">
              Hacé crecer tu práctica profesional
            </h1>
            <p className="font-body text-lg leading-relaxed mb-8"
              style={{ color: 'rgba(255,255,255,0.6)' }}>
              Sumate a la plataforma que conecta abogados con clientes, ofrece capacitación continua y construye comunidad profesional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/registro?rol=abogado"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base rounded-xl font-body font-medium text-white transition-colors"
                style={{ background: '#B86030' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#8B4A1E'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}
              >
                Registrarme ahora <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base rounded-xl font-body font-medium transition-colors border"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#fff'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Planes ────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#F0EFED' }}>
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">Elegí tu plan</h2>
            <p className="section-subtitle">Dos opciones claras, sin costos ocultos.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

            {/* Básico */}
            <div className="card p-8">
              <h3 className="font-display text-2xl font-bold mb-1" style={{ color: '#1C1B18' }}>Plan Básico</h3>
              <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>Visibilidad y gestión de clientes</p>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold" style={{ color: '#1C1B18' }}>$4.999</span>
                <span className="font-body text-sm" style={{ color: '#8A8780' }}>/mes</span>
              </div>
              <div className="space-y-3 mb-8">
                {['Perfil verificado en el catálogo', 'Gestión de consultas y turnos', 'Hasta 20 consultas/mes', 'Soporte por email'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#2C2B27' }}>
                      <Check size={11} className="text-white" />
                    </div>
                    <span className="font-body text-sm" style={{ color: '#3A3832' }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/registro?rol=abogado&plan=basico"
                className="block text-center px-6 py-3 rounded-xl font-body font-medium text-sm border transition-colors"
                style={{ borderColor: '#D4D2CC', color: '#2C2B27', background: '#fff' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                Empezar con Básico
              </Link>
            </div>

            {/* Comunidad */}
            <div
              className="card p-8 relative border-2"
              style={{ borderColor: '#2C2B27' }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span
                  className="text-white text-xs font-body font-medium px-4 py-1.5 rounded-full"
                  style={{ background: '#B86030' }}
                >
                  ★ Plan Comunidad
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold mb-1" style={{ color: '#1C1B18' }}>Plan Comunidad</h3>
              <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>Campus, eventos y red profesional</p>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold" style={{ color: '#1C1B18' }}>$9.999</span>
                <span className="font-body text-sm" style={{ color: '#8A8780' }}>/mes</span>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  'Todo lo del plan Básico',
                  'Campus multimedia (cursos, videos, biblioteca)',
                  'Agenda de eventos y seminarios',
                  'Foro interno de colegas',
                  'Consultas ilimitadas',
                  'Credencial virtual + beneficios',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#B86030' }}>
                      <Check size={11} className="text-white" />
                    </div>
                    <span className="font-body text-sm" style={{ color: '#3A3832' }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/registro?rol=abogado&plan=comunidad"
                className="block text-center px-6 py-3 rounded-xl font-body font-medium text-sm text-white transition-colors"
                style={{ background: '#2C2B27' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
              >
                Unirme a la Comunidad <ArrowRight size={16} className="inline ml-1" />
              </Link>
            </div>
          </div>

          <p className="text-center font-body text-xs mt-6" style={{ color: '#8A8780' }}>
            Pagos seguros con MercadoPago · Sin permanencia mínima · Cancelá cuando quieras
          </p>
        </div>
      </section>

      {/* ── Campus preview ────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-body text-sm font-medium uppercase tracking-widest mb-4"
                style={{ color: '#B86030' }}>
                Exclusivo Plan Comunidad
              </p>
              <h2 className="font-display text-4xl font-bold mb-5" style={{ color: '#1C1B18' }}>
                El campus que impulsa tu carrera
              </h2>
              <p className="font-body leading-relaxed mb-8" style={{ color: '#56534A' }}>
                Accedé a contenido de calidad para mantenerte actualizado, capacitarte y conectarte con colegas.
              </p>
              <div className="space-y-5">
                {[
                  { icono: BookOpen, titulo: 'Biblioteca jurídica',   desc: 'Manuales, doctrina y materiales de estudio en PDF.' },
                  { icono: '🎬',     titulo: 'Videos explicativos',   desc: 'Clases grabadas por expertos sobre temáticas actuales.' },
                  { icono: Calendar, titulo: 'Agenda de eventos',     desc: 'Seminarios, charlas y congresos con inscripción online.' },
                  { icono: Users,    titulo: 'Foro de la comunidad',  desc: 'Debatí y consultá con otros profesionales del derecho.' },
                ].map(({ icono: Icono, titulo, desc }) => (
                  <div key={titulo} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(184,96,48,0.08)' }}
                    >
                      {typeof Icono === 'string'
                        ? <span className="text-lg">{Icono}</span>
                        : <Icono size={18} style={{ color: '#B86030' }} />
                      }
                    </div>
                    <div>
                      <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>{titulo}</p>
                      <p className="font-body text-xs mt-0.5 leading-relaxed" style={{ color: '#8A8780' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview agenda */}
            <div className="space-y-3">
              <p className="font-body text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: '#8A8780' }}>
                Próximos eventos
              </p>
              {[
                { tipo: 'Seminario', titulo: 'Reforma Procesal 2025',            autor: 'Dr. Carlos Falcón',   fecha: 'Lun 15 Jul · 18:00 hs' },
                { tipo: 'Charla',    titulo: 'Marketing Digital para Abogados',  autor: 'Lic. Martín Pérez',   fecha: 'Jue 22 Jul · 19:00 hs' },
                { tipo: 'Congreso',  titulo: 'Jornadas de Derecho Laboral',      autor: 'Colegio de Abogados', fecha: 'Sáb 3 Ago · 09:00 hs' },
              ].map(({ tipo, titulo, autor, fecha }) => (
                <div key={titulo} className="card p-4 flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(184,96,48,0.08)' }}
                  >
                    <Calendar size={18} style={{ color: '#B86030' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-xs font-body font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(184,96,48,0.1)', color: '#B86030' }}
                    >
                      {tipo}
                    </span>
                    <p className="font-body font-semibold text-sm truncate mt-1" style={{ color: '#1C1B18' }}>
                      {titulo}
                    </p>
                    <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>
                      {autor} · {fecha}
                    </p>
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <Link
                  to="/registro?rol=abogado&plan=comunidad"
                  className="font-body text-sm flex items-center gap-1 justify-center transition-colors"
                  style={{ color: '#B86030' }}
                >
                  Sumarme para acceder <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────── */}
      <section className="py-16" style={{ background: '#1C1B18' }}>
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-3">
            ¿Listo para unirte?
          </h2>
          <p className="font-body mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Registrate hoy y empezá a usar la plataforma desde el día uno.
          </p>
          <Link
            to="/registro?rol=abogado"
            className="inline-flex items-center gap-2 px-10 py-4 text-base rounded-xl font-body font-medium text-white transition-colors"
            style={{ background: '#B86030' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#8B4A1E'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}
          >
            Crear mi cuenta <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
