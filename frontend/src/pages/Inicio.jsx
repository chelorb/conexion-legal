// ============================================================
// src/pages/Inicio.jsx
// Landing page — Paleta C: Gris carbón + Cobre
// ============================================================

import { Link } from 'react-router-dom';
import {
  Scale, Search, Users, BookOpen, Calendar,
  ArrowRight, Shield, Star, ChevronRight, Check
} from 'lucide-react';

const ESPECIALIDADES = [
  { nombre: 'Derecho de Familia',   icono: '👨‍👩‍👧' },
  { nombre: 'Derecho Penal',        icono: '⚖️' },
  { nombre: 'Derecho Laboral',      icono: '👷' },
  { nombre: 'Derecho Civil',        icono: '📋' },
  { nombre: 'Derecho Comercial',    icono: '🏢' },
  { nombre: 'Derecho Inmobiliario', icono: '🏠' },
];

export default function Inicio() {
  return (
    <div className="animate-fade-in">

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-20 md:py-28"
        style={{ background: 'linear-gradient(135deg, #0A0908 0%, #2C2B27 100%)' }}
      >
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 15% 50%, #B86030 0%, transparent 50%),
                            radial-gradient(circle at 85% 30%, #56534A 0%, transparent 40%)`
        }} />

        <div className="relative page-container text-center">
          {/* Ícono */}
          <div
            className="inline-flex items-center gap-3 mb-8 px-5 py-2.5 rounded-full border"
            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: '#B86030' }} />
            <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Plataforma de Asesoría Legal Digital
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-6 max-w-4xl mx-auto">
            El ecosistema legal que{' '}
            <span style={{ color: '#C4522E' }}>conecta y potencia</span>
          </h1>

          <p className="font-body text-lg mb-12 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            Una plataforma diseñada para quienes buscan asesoramiento legal confiable y para los profesionales del derecho que quieren crecer.
          </p>

          {/* Dos portales */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">

            {/* Portal Clientes */}
            <Link
              to="/clientes"
              className="group rounded-3xl p-8 text-left hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ background: '#fff' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors"
                style={{ background: '#F0EFED' }}
              >
                <Search size={26} style={{ color: '#2C2B27' }} />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2" style={{ color: '#1C1B18' }}>
                Busco un abogado
              </h2>
              <p className="font-body text-sm leading-relaxed mb-5" style={{ color: '#56534A' }}>
                Encontrá el profesional ideal para tu caso. Filtrá por zona, especialidad y modalidad de atención.
              </p>
              <div
                className="flex items-center gap-2 font-body font-medium text-sm group-hover:gap-3 transition-all"
                style={{ color: '#2C2B27' }}
              >
                Ver catálogo de abogados <ArrowRight size={16} />
              </div>
            </Link>

            {/* Portal Abogados */}
            <Link
              to="/para-abogados"
              className="group rounded-3xl p-8 text-left hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border"
              style={{
                background: 'linear-gradient(135deg, #1C1B18 0%, #2C2B27 100%)',
                borderColor: 'rgba(255,255,255,0.08)'
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <Scale size={26} className="text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                Soy abogado/a
              </h2>
              <p className="font-body text-sm leading-relaxed mb-5"
                style={{ color: 'rgba(255,255,255,0.55)' }}>
                Sumate a la comunidad. Conseguí clientes, accedé al campus multimedia y disfrutá de beneficios exclusivos.
              </p>
              <div
                className="flex items-center gap-2 font-body font-medium text-sm group-hover:gap-3 transition-all"
                style={{ color: '#C4522E' }}
              >
                Ver planes y registrarse <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          ESPECIALIDADES
      ══════════════════════════════════════════════════ */}
      <section className="bg-white border-b py-12" style={{ borderColor: '#E8E6E3' }}>
        <div className="page-container">
          <p className="font-body text-center text-xs uppercase tracking-widest mb-6"
            style={{ color: '#8A8780' }}>
            Especialidades disponibles
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {ESPECIALIDADES.map(({ nombre, icono }) => (
              <Link
                key={nombre}
                to={`/clientes?especialidad=${encodeURIComponent(nombre)}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-body border transition-all"
                style={{ background: '#F7F6F4', borderColor: '#E8E6E3', color: '#3A3832' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#F0EFED';
                  e.currentTarget.style.borderColor = '#B86030';
                  e.currentTarget.style.color = '#1C1B18';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#F7F6F4';
                  e.currentTarget.style.borderColor = '#E8E6E3';
                  e.currentTarget.style.color = '#3A3832';
                }}
              >
                <span>{icono}</span>
                {nombre}
              </Link>
            ))}
            <Link
              to="/clientes"
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-body transition-colors"
              style={{ color: '#B86030' }}
            >
              Ver todas <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PARA CLIENTES
      ══════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#F0EFED' }}>
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p
                className="font-body text-sm font-medium uppercase tracking-widest mb-4"
                style={{ color: '#B86030' }}
              >
                Para clientes
              </p>
              <h2 className="font-display text-4xl font-bold mb-5" style={{ color: '#1C1B18' }}>
                Encontrá el abogado que necesitás
              </h2>
              <p className="font-body leading-relaxed mb-8" style={{ color: '#56534A' }}>
                Accedé a un catálogo verificado de profesionales del derecho. Sin costo, sin registro obligatorio.
              </p>

              <div className="space-y-5 mb-8">
                {[
                  { icono: Search,  titulo: 'Búsqueda inteligente',  desc: 'Filtrá por zona, especialidad y modalidad (online o presencial).' },
                  { icono: Shield,  titulo: 'Perfiles verificados',   desc: 'Todos los abogados pasan por un proceso de validación de matrícula.' },
                  { icono: Star,    titulo: 'Calificaciones reales',  desc: 'Leé las reseñas de otros clientes antes de elegir tu profesional.' },
                ].map(({ icono: Icono, titulo, desc }) => (
                  <div key={titulo} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(184,96,48,0.1)' }}
                    >
                      <Icono size={18} style={{ color: '#B86030' }} />
                    </div>
                    <div>
                      <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>{titulo}</p>
                      <p className="font-body text-xs mt-0.5 leading-relaxed" style={{ color: '#8A8780' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/clientes"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-body font-medium text-sm text-white transition-colors"
                style={{ background: '#2C2B27' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
              >
                Ver catálogo de abogados <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mockup de tarjeta */}
            <div className="card p-6" style={{ borderColor: '#E8E6E3' }}>
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: '#2C2B27' }}
                >
                  <span className="font-display font-bold text-white text-xl">MG</span>
                </div>
                <div>
                  <p className="font-body font-semibold" style={{ color: '#1C1B18' }}>Dra. María González</p>
                  <p className="font-body text-sm" style={{ color: '#8A8780' }}>Derecho de Familia · Buenos Aires</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} style={{ fill: '#B86030', color: '#B86030' }} />
                    ))}
                    <span className="text-xs ml-1" style={{ color: '#8A8780' }}>(48 reseñas)</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Derecho de Familia', 'Sucesiones', 'Divorcios'].map(e => (
                  <span
                    key={e}
                    className="px-3 py-1 text-xs rounded-full font-body"
                    style={{ background: '#F0EFED', color: '#3A3832' }}
                  >
                    {e}
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                <div
                  className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body"
                  style={{ background: '#F0EFED', color: '#3A3832' }}
                >
                  💻 Online
                </div>
                <div
                  className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body"
                  style={{ background: '#F0EFED', color: '#3A3832' }}
                >
                  🏢 Presencial
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PARA ABOGADOS
      ══════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#1C1B18' }}>
        <div className="page-container">
          <div className="text-center mb-14">
            <p
              className="font-body text-sm font-medium uppercase tracking-widest mb-4"
              style={{ color: '#B86030' }}
            >
              Para profesionales del derecho
            </p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Dos caminos para crecer
            </h2>
            <p className="font-body max-w-xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              Elegí el plan que más se ajusta a tus objetivos. Sin permanencia mínima.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">

            {/* Básico */}
            <div
              className="rounded-3xl p-8 border"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <p className="font-body text-sm uppercase tracking-wider mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}>Plan</p>
              <h3 className="font-display text-3xl font-bold text-white mb-1">Básico</h3>
              <p className="font-body text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Para empezar a ganar visibilidad
              </p>
              <div className="space-y-3 mb-8">
                {['Perfil profesional verificado', 'Visible en el catálogo', 'Gestión de consultas y turnos', 'Hasta 20 consultas por mes'].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm font-body" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Check size={10} className="text-white" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <Link
                to="/registro?rol=abogado&plan=basico"
                className="block text-center px-6 py-3 rounded-xl font-body font-medium text-sm border transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                Empezar con Básico
              </Link>
            </div>

            {/* Comunidad */}
            <div
              className="rounded-3xl p-8 relative border"
              style={{ background: 'rgba(184,96,48,0.12)', borderColor: 'rgba(184,96,48,0.3)' }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span
                  className="text-white text-xs font-body font-medium px-4 py-1.5 rounded-full"
                  style={{ background: '#B86030' }}
                >
                  ★ Recomendado
                </span>
              </div>
              <p className="font-body text-sm uppercase tracking-wider mb-2"
                style={{ color: '#C4522E' }}>Plan</p>
              <h3 className="font-display text-3xl font-bold text-white mb-1">Comunidad</h3>
              <p className="font-body text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Para quienes quieren más
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'Todo lo del plan Básico',
                  'Campus multimedia completo',
                  'Agenda de eventos y seminarios',
                  'Foro interno de colegas',
                  'Credencial virtual + beneficios',
                  'Consultas ilimitadas',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm font-body text-white">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#B86030' }}
                    >
                      <Check size={10} className="text-white" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <Link
                to="/registro?rol=abogado&plan=comunidad"
                className="block text-center px-6 py-3 rounded-xl font-body font-medium text-sm text-white transition-colors"
                style={{ background: '#B86030' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#8B4A1E'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#B86030'; }}
              >
                Unirme a la Comunidad <ArrowRight size={16} className="inline ml-1" />
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/planes"
              className="font-body text-sm flex items-center gap-1 justify-center transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            >
              Ver comparativa completa <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CAMPUS PREVIEW
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">El campus de la Comunidad</h2>
            <p className="section-subtitle">
              Capacitación, eventos y contenido exclusivo para miembros.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icono: BookOpen, titulo: 'Biblioteca jurídica',  desc: 'Accedé a bibliografía, manuales y artículos de doctrina actualizados.' },
              { icono: Calendar, titulo: 'Agenda de eventos',    desc: 'Seminarios, charlas y congresos con ponentes de primer nivel.' },
              { icono: Users,    titulo: 'Foro de colegas',      desc: 'Debatí, consultá y conectate con otros profesionales del derecho.' },
            ].map(({ icono: Icono, titulo, desc }) => (
              <div key={titulo} className="card p-7 text-center hover:shadow-card-hover transition-shadow">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(184,96,48,0.08)' }}
                >
                  <Icono size={26} style={{ color: '#B86030' }} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2" style={{ color: '#1C1B18' }}>
                  {titulo}
                </h3>
                <p className="font-body text-sm leading-relaxed" style={{ color: '#8A8780' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════ */}
      <section className="py-16" style={{ background: '#F0EFED', borderTop: '1px solid #E8E6E3' }}>
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold mb-3" style={{ color: '#1C1B18' }}>
            ¿Listo para empezar?
          </h2>
          <p className="font-body mb-8" style={{ color: '#8A8780' }}>
            Más de 500 profesionales ya confían en IUSTIXIUM.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/clientes"
              className="px-8 py-3.5 rounded-xl font-body font-medium text-sm border transition-all"
              style={{ color: '#2C2B27', borderColor: '#D4D2CC', background: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              Buscar un abogado
            </Link>
            <Link
              to="/para-abogados"
              className="px-8 py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors flex items-center gap-2 justify-center"
              style={{ background: '#2C2B27' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
            >
              Registrarme como abogado <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
