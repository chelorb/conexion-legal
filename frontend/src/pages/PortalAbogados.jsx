// ============================================================
// src/pages/PortalAbogados.jsx
// Landing page específica para abogados
// Explica los planes, el campus y cómo registrarse
// ============================================================

import { Link } from 'react-router-dom';
import {
  Scale, ArrowRight, BookOpen, Calendar,
  Users, Shield, Star, Check, ChevronRight
} from 'lucide-react';

export default function PortalAbogados() {
  return (
    <div className="animate-fade-in">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-navy-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 80% 50%, #c9a227 0%, transparent 50%)`
        }} />
        <div className="page-container relative z-10">
          <div className="max-w-2xl">
            <p className="font-body text-gold-400 text-sm uppercase tracking-widest mb-5">
              Para profesionales del derecho
            </p>
            <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6">
              Hacé crecer tu práctica profesional
            </h1>
            <p className="font-body text-white/70 text-lg leading-relaxed mb-8">
              Sumate a la plataforma que conecta abogados con clientes, ofrece capacitación continua y construye comunidad profesional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/registro?rol=abogado" className="btn-gold px-8 py-4 text-base">
                Registrarme ahora <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 py-4 text-base">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Planes ───────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">Elegí tu plan</h2>
            <p className="section-subtitle">Dos opciones claras, sin costos ocultos.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Básico */}
            <div className="card p-8">
              <h3 className="font-display text-2xl font-bold text-navy-900 mb-1">Plan Básico</h3>
              <p className="font-body text-slate-500 text-sm mb-6">Visibilidad y gestión de clientes</p>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold text-navy-900">$4.999</span>
                <span className="font-body text-slate-400 text-sm">/mes</span>
              </div>
              <div className="space-y-3 mb-8">
                {['Perfil verificado en el catálogo', 'Gestión de consultas y turnos', 'Hasta 20 consultas/mes', 'Soporte por email'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-navy-900 rounded-full flex items-center justify-center shrink-0">
                      <Check size={11} className="text-white" />
                    </div>
                    <span className="font-body text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/registro?rol=abogado&plan=basico" className="btn-secondary w-full justify-center">
                Empezar con Básico
              </Link>
            </div>

            {/* Comunidad */}
            <div className="card p-8 border-2 border-navy-900 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gold-500 text-white text-xs font-body font-medium px-4 py-1.5 rounded-full">
                  ★ Plan Comunidad
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-navy-900 mb-1">Plan Comunidad</h3>
              <p className="font-body text-slate-500 text-sm mb-6">Campus, eventos y red profesional</p>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold text-navy-900">$9.999</span>
                <span className="font-body text-slate-400 text-sm">/mes</span>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  'Todo lo del plan Básico',
                  'Campus multimedia (cursos, videos, biblioteca)',
                  'Agenda de eventos y seminarios',
                  'Consultas ilimitadas',
                  'Credencial virtual + beneficios exclusivos',
                  'Networking con colegas',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center shrink-0">
                      <Check size={11} className="text-white" />
                    </div>
                    <span className="font-body text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/registro?rol=abogado&plan=comunidad" className="btn-primary w-full justify-center">
                Unirme a la Comunidad <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <p className="text-center font-body text-xs text-slate-400 mt-6">
            Pagos seguros con MercadoPago · Sin permanencia mínima · Cancelá cuando quieras
          </p>
        </div>
      </section>

      {/* ── Campus ───────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-body text-sm font-medium text-gold-600 uppercase tracking-widest mb-4">
                Exclusivo Plan Comunidad
              </p>
              <h2 className="font-display text-4xl font-bold text-navy-900 mb-5">
                El campus que impulsa tu carrera
              </h2>
              <p className="font-body text-slate-500 leading-relaxed mb-8">
                Accedé a contenido de calidad para mantenerte actualizado, capacitarte y conectarte con colegas.
              </p>
              <div className="space-y-5">
                {[
                  { icono: BookOpen, titulo: 'Biblioteca jurídica',    desc: 'Manuales, doctrina y materiales de estudio en PDF.' },
                  { icono: '🎬',     titulo: 'Videos explicativos',    desc: 'Clases grabadas por expertos sobre temáticas actuales.' },
                  { icono: Calendar, titulo: 'Agenda de eventos',      desc: 'Seminarios, charlas y congresos con inscripción online.' },
                  { icono: '🎙️',    titulo: 'Podcasts jurídicos',      desc: 'Análisis de jurisprudencia y novedades del sector.' },
                ].map(({ icono: Icono, titulo, desc }) => (
                  <div key={titulo} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center shrink-0">
                      {typeof Icono === 'string'
                        ? <span className="text-lg">{Icono}</span>
                        : <Icono size={18} className="text-navy-900" />
                      }
                    </div>
                    <div>
                      <p className="font-body font-semibold text-navy-900 text-sm">{titulo}</p>
                      <p className="font-body text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview de la agenda */}
            <div className="space-y-3">
              <p className="font-body text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Próximos eventos
              </p>
              {[
                {
                  tipo: 'Seminario', titulo: 'Reforma Procesal 2025',
                  autor: 'Dr. Carlos Falcón', fecha: 'Lun 15 de Jul · 18:00 hs',
                  cupos: '50 cupos',
                },
                {
                  tipo: 'Charla', titulo: 'Marketing Digital para Abogados',
                  autor: 'Lic. Martín Pérez', fecha: 'Jue 22 de Jul · 19:00 hs',
                  cupos: '100 cupos',
                },
                {
                  tipo: 'Congreso', titulo: 'Jornadas de Derecho Laboral',
                  autor: 'Colegio de Abogados', fecha: 'Sáb 3 de Ago · 09:00 hs',
                  cupos: '200 cupos',
                },
              ].map(({ tipo, titulo, autor, fecha, cupos }) => (
                <div key={titulo} className="card p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold-300/20 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={18} className="text-gold-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-body font-medium text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full">{tipo}</span>
                    </div>
                    <p className="font-body font-semibold text-navy-900 text-sm truncate">{titulo}</p>
                    <p className="font-body text-xs text-slate-400 mt-0.5">{autor} · {fecha}</p>
                  </div>
                  <span className="font-body text-xs text-slate-400 shrink-0">{cupos}</span>
                </div>
              ))}
              <div className="text-center pt-2">
                <Link to="/registro?rol=abogado&plan=comunidad"
                  className="font-body text-sm text-navy-700 hover:text-navy-900 flex items-center gap-1 justify-center">
                  Sumarme para acceder <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────── */}
      <section className="py-16 bg-navy-900">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-3">
            ¿Listo para unirte?
          </h2>
          <p className="font-body text-white/60 mb-8">
            Registrate hoy y empezá a usar la plataforma desde el día uno.
          </p>
          <Link to="/registro?rol=abogado" className="btn-gold px-10 py-4 text-base">
            Crear mi cuenta <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
