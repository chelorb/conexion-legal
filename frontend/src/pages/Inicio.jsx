// ============================================================
// src/pages/Inicio.jsx
// Landing page pública — Hero, buscador, stats, planes
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Shield, Star, Clock, Award, Users, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

// Especialidades destacadas para mostrar en el hero
const ESPECIALIDADES_HERO = [
  'Derecho Civil', 'Derecho Laboral', 'Derecho de Familia',
  'Derecho Penal', 'Derecho Comercial', 'Derecho Inmobiliario'
];

// Estadísticas de la plataforma
const ESTADISTICAS = [
  { valor: '500+', label: 'Abogados registrados',  icono: Users },
  { valor: '4.8',  label: 'Calificación promedio', icono: Star },
  { valor: '2.400+', label: 'Consultas realizadas',icono: CheckCircle },
  { valor: '24hs', label: 'Tiempo de respuesta',   icono: Clock },
];

// Propuestas de valor para abogados
const BENEFICIOS_ABOGADOS = [
  { icono: Shield,   titulo: 'Perfil validado',       desc: 'Verificamos tu matrícula y trayectoria profesional.' },
  { icono: BookOpen, titulo: 'Campus multimedia',      desc: 'Accedé a cursos, podcasts, videoconferencias y biblioteca jurídica.' },
  { icono: Award,    titulo: 'Credencial virtual',     desc: 'Identificación digital exclusiva con beneficios en comercios adheridos.' },
  { icono: Users,    titulo: 'Networking profesional', desc: 'Conectate con colegas, estudios y organismos del sector.' },
];

export default function Inicio() {
  const [busqueda, setBusqueda]           = useState('');
  const [especialidadSel, setEspecialidad] = useState('');
  const navigate = useNavigate();

  const handleBuscar = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (busqueda)       params.set('ciudad', busqueda);
    if (especialidadSel) params.set('especialidad', especialidadSel);
    navigate(`/abogados?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in">

      {/* ══════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-navy-900 text-white">

        {/* Fondo decorativo con gradiente y patrón */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #4f63f7 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #c9a227 0%, transparent 40%)`,
          }}
        />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative page-container py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">

            {/* Etiqueta superior */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse-slow" />
              <span className="text-sm text-white/80 font-body">Plataforma de Asesoría Legal Digital</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Tu asesor legal,{' '}
              <span className="text-gradient-gold">cuando lo necesitás</span>
            </h1>

            <p className="font-body text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
              Conectamos personas con abogados confiables y verificados. Agendá una consulta online o presencial en minutos.
            </p>

            {/* ── Buscador ────────────────────────────────── */}
            <form onSubmit={handleBuscar} className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl max-w-2xl mx-auto">
              <div className="flex-1 flex items-center gap-3 px-4 py-2">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Ciudad o zona..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="flex-1 text-slate-800 text-sm font-body placeholder-slate-400 outline-none bg-transparent"
                />
              </div>

              <div className="h-px sm:w-px sm:h-auto bg-slate-100" />

              <select
                value={especialidadSel}
                onChange={(e) => setEspecialidad(e.target.value)}
                className="flex-1 px-4 py-2 text-sm font-body text-slate-700 outline-none bg-transparent cursor-pointer"
              >
                <option value="">Todas las especialidades</option>
                {ESPECIALIDADES_HERO.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>

              <button type="submit" className="btn-primary px-6 py-3 shrink-0">
                Buscar
              </button>
            </form>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {ESPECIALIDADES_HERO.slice(0, 4).map(esp => (
                <button
                  key={esp}
                  onClick={() => navigate(`/abogados?especialidad=${esp}`)}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 text-xs rounded-full transition-all font-body"
                >
                  {esp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ESTADÍSTICAS
          ══════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-slate-100">
        <div className="page-container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {ESTADISTICAS.map(({ valor, label, icono: Icono }) => (
              <div key={label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy-50 mb-3">
                  <Icono size={20} className="text-navy-900" />
                </div>
                <p className="font-display text-3xl font-bold text-navy-900">{valor}</p>
                <p className="font-body text-sm text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CÓMO FUNCIONA (Para clientes)
          ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title">¿Cómo funciona?</h2>
            <p className="section-subtitle">Tres pasos para conectarte con el abogado ideal</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                num: '01',
                titulo: 'Buscá tu abogado',
                desc: 'Filtrá por especialidad, ciudad y modalidad (online o presencial). Leé los perfiles y calificaciones verificadas.',
                color: 'bg-navy-50',
              },
              {
                num: '02',
                titulo: 'Agendá una consulta',
                desc: 'Elegí el horario que mejor te convenga y describí brevemente tu caso. El abogado confirmará a la brevedad.',
                color: 'bg-gold-300/20',
              },
              {
                num: '03',
                titulo: 'Recibí asesoramiento',
                desc: 'Tus datos están protegidos. Al finalizar, podés dejar tu calificación para ayudar a otros usuarios.',
                color: 'bg-navy-50',
              },
            ].map(({ num, titulo, desc, color }) => (
              <div key={num} className="card p-8 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} mb-5`}>
                  <span className="font-display font-bold text-navy-900 text-lg">{num}</span>
                </div>
                <h3 className="font-display font-semibold text-navy-900 text-xl mb-3">{titulo}</h3>
                <p className="font-body text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/abogados" className="btn-primary">
              Buscar abogado <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECCIÓN PARA ABOGADOS
          ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Texto */}
            <div>
              <div className="inline-flex items-center gap-2 bg-navy-50 rounded-full px-4 py-2 mb-6">
                <Award size={14} className="text-navy-900" />
                <span className="text-sm text-navy-700 font-body font-medium">Para profesionales del derecho</span>
              </div>

              <h2 className="section-title mb-4">
                Potenciá tu práctica{' '}
                <span className="text-gradient">profesional</span>
              </h2>

              <p className="font-body text-slate-500 leading-relaxed mb-8">
                Sumate a la comunidad de abogados de Conexión Legal. Conseguí nuevos clientes, accedé a capacitación de calidad y disfrutá de beneficios exclusivos.
              </p>

              {/* Beneficios */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {BENEFICIOS_ABOGADOS.map(({ icono: Icono, titulo, desc }) => (
                  <div key={titulo} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center shrink-0">
                      <Icono size={18} className="text-navy-900" />
                    </div>
                    <div>
                      <h4 className="font-body font-semibold text-navy-900 text-sm">{titulo}</h4>
                      <p className="font-body text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/registro?rol=abogado" className="btn-primary">
                  Registrarme como abogado <ArrowRight size={16} />
                </Link>
                <Link to="/planes" className="btn-secondary">
                  Ver planes y precios
                </Link>
              </div>
            </div>

            {/* Card decorativa */}
            <div className="relative">
              <div className="card p-8 border-navy-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-navy-900 flex items-center justify-center">
                    <span className="font-display font-bold text-white text-xl">P</span>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-navy-900">Dr. Pablo Rodríguez</p>
                    <p className="font-body text-sm text-slate-500">Derecho Civil · Rosario</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={12} className="fill-gold-500 text-gold-500" />
                      ))}
                      <span className="text-xs text-slate-400 ml-1">(48 reseñas)</span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <span className="badge-plan-premium">Premium</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm font-body">
                  {[
                    { label: 'Consultas este mes', valor: '18', ok: true },
                    { label: 'Perfil validado',    valor: '✓',  ok: true },
                    { label: 'Credencial activa',  valor: '✓',  ok: true },
                    { label: 'Campus: 12 cursos',  valor: '→',  ok: true },
                  ].map(({ label, valor, ok }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-slate-600">{label}</span>
                      <span className={ok ? 'text-navy-900 font-medium' : 'text-slate-400'}>{valor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badge flotante */}
              <div className="absolute -top-4 -right-4 bg-gold-500 text-white rounded-2xl px-4 py-2 shadow-button">
                <p className="font-body text-xs font-medium">+35% nuevos clientes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA FINAL
          ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-navy-900">
        <div className="page-container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Tenés una consulta legal?
          </h2>
          <p className="font-body text-white/60 mb-8 max-w-xl mx-auto">
            Miles de personas ya encontraron el abogado que necesitaban. Registrate gratis y agendá tu primera consulta hoy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/registro" className="btn-gold px-8 py-4 text-base">
              Comenzar ahora <ArrowRight size={18} />
            </Link>
            <Link to="/abogados" className="btn-secondary bg-transparent border-white/30 text-white hover:bg-white/10 px-8 py-4 text-base">
              Ver abogados
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
