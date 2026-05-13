// ============================================================
// src/pages/Inicio.jsx
// Nueva landing page con dos portales: Clientes y Abogados
// Diseño profesional y serio para el mercado legal
// ============================================================

import { Link } from 'react-router-dom';
import { Scale, Search, Users, BookOpen, Calendar, ArrowRight, Shield, Star, ChevronRight } from 'lucide-react';

// Especialidades destacadas para mostrar en el catálogo
const ESPECIALIDADES = [
  { nombre: 'Derecho de Familia',  icono: '👨‍👩‍👧' },
  { nombre: 'Derecho Penal',       icono: '⚖️' },
  { nombre: 'Derecho Laboral',     icono: '👷' },
  { nombre: 'Derecho Civil',       icono: '📋' },
  { nombre: 'Derecho Comercial',   icono: '🏢' },
  { nombre: 'Derecho Inmobiliario',icono: '🏠' },
];

export default function Inicio() {
  return (
    <div className="animate-fade-in">

      {/* ══════════════════════════════════════════════════════
          HERO — Propuesta de valor central
          ══════════════════════════════════════════════════ */}
      <section className="bg-navy-900 text-white py-20 md:py-28 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 15% 50%, #4f63f7 0%, transparent 50%),
                            radial-gradient(circle at 85% 30%, #c9a227 0%, transparent 40%)`
        }} />

        <div className="page-container relative z-10 text-center">
          {/* Logo grande */}
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Scale size={24} className="text-white" />
            </div>
            <span className="font-display text-2xl font-bold">
              Conexión<span className="text-gold-400">Legal</span>
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-6 max-w-4xl mx-auto">
            El ecosistema legal<br />
            <span className="text-gold-400">que conecta y potencia</span>
          </h1>

          <p className="font-body text-lg text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            Una plataforma diseñada para quienes buscan asesoramiento legal y para los profesionales del derecho que quieren crecer.
          </p>

          {/* ── Dos portales de acceso ─────────────────────── */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">

            {/* Portal Clientes */}
            <Link
              to="/clientes"
              className="group bg-white rounded-3xl p-8 text-left hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-navy-100 transition-colors">
                <Search size={26} className="text-navy-900" />
              </div>
              <h2 className="font-display text-2xl font-bold text-navy-900 mb-2">
                Busco un abogado
              </h2>
              <p className="font-body text-slate-500 text-sm leading-relaxed mb-5">
                Encontrá el profesional ideal para tu caso. Filtrá por zona, especialidad y modalidad de atención.
              </p>
              <div className="flex items-center gap-2 text-navy-900 font-body font-medium text-sm group-hover:gap-3 transition-all">
                Ver catálogo de abogados <ArrowRight size={16} />
              </div>
            </Link>

            {/* Portal Abogados */}
            <Link
              to="/para-abogados"
              className="group bg-gradient-to-br from-navy-900 to-navy-800 rounded-3xl p-8 text-left hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/10"
            >
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-white/20 transition-colors">
                <Scale size={26} className="text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                Soy abogado/a
              </h2>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-5">
                Sumarte a la comunidad. Conseguí clientes, accedé al campus multimedia y disfrutá de beneficios exclusivos.
              </p>
              <div className="flex items-center gap-2 text-gold-400 font-body font-medium text-sm group-hover:gap-3 transition-all">
                Ver planes y registrarse <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ESPECIALIDADES — Acceso rápido al catálogo
          ══════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-slate-100 py-12">
        <div className="page-container">
          <p className="font-body text-center text-slate-400 text-sm uppercase tracking-widest mb-6">
            Especialidades disponibles
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {ESPECIALIDADES.map(({ nombre, icono }) => (
              <Link
                key={nombre}
                to={`/clientes?especialidad=${encodeURIComponent(nombre)}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-navy-50 border border-slate-200 hover:border-navy-200 rounded-full text-sm font-body text-slate-700 hover:text-navy-900 transition-all"
              >
                <span>{icono}</span>
                {nombre}
              </Link>
            ))}
            <Link
              to="/clientes"
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-body text-navy-700 hover:text-navy-900 transition-colors"
            >
              Ver todas <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PARA CLIENTES — Beneficios del catálogo
          ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-body text-sm font-medium text-navy-700 uppercase tracking-widest mb-4">
                Para clientes
              </p>
              <h2 className="font-display text-4xl font-bold text-navy-900 mb-5">
                Encontrá el abogado que necesitás
              </h2>
              <p className="font-body text-slate-500 leading-relaxed mb-8">
                Accedé a un catálogo verificado de profesionales del derecho. Sin costo, sin registro obligatorio.
              </p>

              <div className="space-y-5 mb-8">
                {[
                  { icono: Search,  titulo: 'Búsqueda inteligente',        desc: 'Filtrá por zona, especialidad y modalidad (online o presencial).' },
                  { icono: Shield,  titulo: 'Perfiles verificados',          desc: 'Todos los abogados pasan por un proceso de validación de matrícula.' },
                  { icono: Star,    titulo: 'Calificaciones reales',         desc: 'Leé las reseñas de otros clientes antes de elegir tu profesional.' },
                ].map(({ icono: Icono, titulo, desc }) => (
                  <div key={titulo} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center shrink-0">
                      <Icono size={18} className="text-navy-900" />
                    </div>
                    <div>
                      <p className="font-body font-semibold text-navy-900 text-sm">{titulo}</p>
                      <p className="font-body text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/clientes" className="btn-primary">
                Ver catálogo de abogados <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mockup de tarjeta de abogado */}
            <div className="card p-6 border-navy-100">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="font-display font-bold text-white text-xl">MG</span>
                </div>
                <div>
                  <p className="font-body font-semibold text-navy-900">Dra. María González</p>
                  <p className="font-body text-sm text-slate-500">Derecho de Familia · Buenos Aires</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} className="fill-gold-500 text-gold-500" />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">(48 reseñas)</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Derecho de Familia', 'Sucesiones', 'Divorcios'].map(e => (
                  <span key={e} className="px-3 py-1 bg-navy-50 text-navy-700 text-xs rounded-full font-body">{e}</span>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-xs font-body">
                  💻 Online
                </div>
                <div className="flex-1 flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-body">
                  🏢 Presencial
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PARA ABOGADOS — Planes y comunidad
          ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-navy-900 text-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="font-body text-sm font-medium text-gold-400 uppercase tracking-widest mb-4">
              Para profesionales del derecho
            </p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Dos caminos para crecer
            </h2>
            <p className="font-body text-white/60 max-w-xl mx-auto leading-relaxed">
              Elegí el plan que más se ajusta a tus objetivos. Sin permanencia mínima.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
            {/* Plan Básico */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <p className="font-body text-white/50 text-sm uppercase tracking-wider mb-2">Plan</p>
              <h3 className="font-display text-3xl font-bold text-white mb-1">Básico</h3>
              <p className="font-body text-white/50 text-sm mb-6">Para empezar a ganar visibilidad</p>
              <div className="space-y-3 mb-8">
                {[
                  'Perfil profesional verificado',
                  'Aparecés en el catálogo de clientes',
                  'Gestión de consultas y turnos',
                  'Hasta 20 consultas por mes',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm font-body text-white/80">
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <Link to="/registro?rol=abogado&plan=basico" className="btn-secondary w-full justify-center">
                Empezar con Básico
              </Link>
            </div>

            {/* Plan Comunidad */}
            <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 rounded-3xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gold-500 text-white text-xs font-body font-medium px-4 py-1.5 rounded-full">
                  ★ Recomendado
                </span>
              </div>
              <p className="font-body text-gold-400 text-sm uppercase tracking-wider mb-2">Plan</p>
              <h3 className="font-display text-3xl font-bold text-white mb-1">Comunidad</h3>
              <p className="font-body text-white/50 text-sm mb-6">Para quienes quieren más</p>
              <div className="space-y-3 mb-8">
                {[
                  'Todo lo del plan Básico',
                  'Campus multimedia completo',
                  'Agenda de eventos y seminarios',
                  'Bibliografía y videos exclusivos',
                  'Networking con colegas',
                  'Credencial virtual + beneficios',
                  'Consultas ilimitadas',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm font-body text-white/90">
                    <div className="w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <Link to="/registro?rol=abogado&plan=comunidad" className="btn-gold w-full justify-center">
                Unirme a la Comunidad <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link to="/planes" className="font-body text-white/50 hover:text-white text-sm flex items-center gap-1 justify-center transition-colors">
              Ver comparativa completa de planes <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CAMPUS — Preview para abogados
          ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">El campus de la Comunidad</h2>
            <p className="section-subtitle">
              Acceso a capacitación, eventos y contenido exclusivo para miembros.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icono: BookOpen, titulo: 'Biblioteca jurídica',
                desc: 'Accedé a bibliografía especializada, manuales y artículos de doctrina.',
                color: 'bg-blue-50 text-blue-700',
              },
              {
                icono: Calendar, titulo: 'Agenda de eventos',
                desc: 'Seminarios, charlas, congresos y cursos con ponentes de primer nivel.',
                color: 'bg-gold-300/20 text-gold-600',
              },
              {
                icono: Users, titulo: 'Red de colegas',
                desc: 'Conectate con otros profesionales, estudios jurídicos y organismos.',
                color: 'bg-green-50 text-green-700',
              },
            ].map(({ icono: Icono, titulo, desc, color }) => (
              <div key={titulo} className="card p-7 text-center hover:shadow-card-hover transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${color}`}>
                  <Icono size={26} />
                </div>
                <h3 className="font-display font-semibold text-navy-900 text-lg mb-2">{titulo}</h3>
                <p className="font-body text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA FINAL
          ══════════════════════════════════════════════════ */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl font-bold text-navy-900 mb-3">
            ¿Listo para empezar?
          </h2>
          <p className="font-body text-slate-500 mb-8">
            Más de 500 profesionales ya confían en Conexión Legal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/clientes" className="btn-secondary px-8 py-3.5">
              Buscar un abogado
            </Link>
            <Link to="/para-abogados" className="btn-primary px-8 py-3.5">
              Registrarme como abogado <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
