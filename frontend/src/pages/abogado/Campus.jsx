// ============================================================
// src/pages/abogado/Campus.jsx
// Campus multimedia del abogado
// Cursos, podcasts, videoconferencias, biblioteca y congresos
// Solo accesible según el plan de suscripción
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Headphones, Video, Calendar,
  Library, Clock, Lock, ArrowRight, Play,
  Search, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────
// Configuración visual de cada tipo de contenido
// ─────────────────────────────────────────────────────────────
const TIPOS = {
  curso:           { label: 'Curso',           icono: BookOpen,  color: 'bg-blue-50   text-blue-700',   accion: 'Ver curso' },
  articulo:        { label: 'Artículo',        icono: Library,   color: 'bg-slate-50  text-slate-700',  accion: 'Leer' },
  podcast:         { label: 'Podcast',         icono: Headphones,color: 'bg-purple-50 text-purple-700', accion: 'Escuchar' },
  videoconferencia:{ label: 'Videoconf.',      icono: Video,     color: 'bg-green-50  text-green-700',  accion: 'Ver' },
  biblioteca:      { label: 'Biblioteca',      icono: Library,   color: 'bg-amber-50  text-amber-700',  accion: 'Descargar' },
  congreso:        { label: 'Congreso',        icono: Calendar,  color: 'bg-navy-50   text-navy-700',   accion: 'Inscribirse' },
};

// ─────────────────────────────────────────────────────────────
// Componente: Tarjeta de contenido del campus
// ─────────────────────────────────────────────────────────────
function TarjetaContenido({ item, planActual }) {
  const config   = TIPOS[item.tipo] || TIPOS.curso;
  const Icono    = config.icono;

  // Verificar si el plan del abogado permite ver este contenido
  const planesOrden = { gratuito: 0, basico: 1, premium: 2 };
  const bloqueado   = planesOrden[item.plan_requerido] > planesOrden[planActual || 'gratuito'];

  return (
    <div className={`card flex flex-col transition-all duration-200 ${
      bloqueado ? 'opacity-60' : 'hover:shadow-card-hover'
    }`}>
      {/* Miniatura o placeholder de color */}
      <div className="relative h-40 bg-gradient-to-br from-navy-900 to-navy-700 rounded-t-2xl overflow-hidden">
        {item.miniatura_url
          ? <img src={item.miniatura_url} alt={item.titulo} className="w-full h-full object-cover" />
          : (
            <div className="w-full h-full flex items-center justify-center">
              <Icono size={40} className="text-white/30" />
            </div>
          )
        }

        {/* Badge de tipo */}
        <div className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium ${config.color}`}>
          <Icono size={11} />
          {config.label}
        </div>

        {/* Candado si está bloqueado */}
        {bloqueado && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-950/40 backdrop-blur-sm">
            <div className="text-center">
              <Lock size={28} className="text-white mx-auto mb-2" />
              <p className="font-body text-white text-xs font-medium">
                Plan {item.plan_requerido}
              </p>
            </div>
          </div>
        )}

        {/* Badge de evento próximo */}
        {item.es_evento && item.fecha_evento && !bloqueado && (
          <div className="absolute bottom-3 left-3 bg-gold-500 text-white px-2.5 py-1 rounded-full text-xs font-body font-medium">
            📅 {format(new Date(item.fecha_evento), "d MMM · HH:mm 'hs'", { locale: es })}
          </div>
        )}

        {/* Duración */}
        {item.duracion_min && !bloqueado && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 text-white px-2 py-1 rounded-lg text-xs font-body">
            <Clock size={10} />
            {item.duracion_min >= 60
              ? `${Math.floor(item.duracion_min / 60)}h ${item.duracion_min % 60 > 0 ? `${item.duracion_min % 60}m` : ''}`
              : `${item.duracion_min}m`
            }
          </div>
        )}
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className="p-5 flex flex-col flex-1">
        {/* Especialidad */}
        {item.especialidad && (
          <span className="font-body text-xs text-navy-700 bg-navy-50 px-2.5 py-1 rounded-full inline-block mb-3 self-start">
            {item.especialidad}
          </span>
        )}

        <h3 className="font-display font-semibold text-navy-900 text-base leading-snug mb-2 flex-1">
          {item.titulo}
        </h3>

        {item.descripcion && (
          <p className="font-body text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
            {item.descripcion}
          </p>
        )}

        {/* Autor */}
        {item.autor && (
          <p className="font-body text-xs text-slate-400 mb-4">
            Por <span className="text-slate-600">{item.autor}</span>
          </p>
        )}

        {/* Botón de acción */}
        {bloqueado ? (
          <Link to="/abogado/suscripcion" className="btn-secondary text-sm w-full justify-center">
            <Lock size={13} /> Mejorar plan para acceder
          </Link>
        ) : (
          <button
            onClick={() => {
              if (item.contenido_url) {
                window.open(item.contenido_url, '_blank');
              } else if (item.link_evento) {
                window.open(item.link_evento, '_blank');
              } else {
                toast('Contenido próximamente disponible.', { icon: '⏳' });
              }
            }}
            className="btn-primary text-sm w-full justify-center"
          >
            <Play size={13} /> {config.accion}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function Campus() {
  const [contenido,   setContenido]   = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [sinAcceso,   setSinAcceso]   = useState(false); // Plan insuficiente
  const [tipoFiltro,  setTipoFiltro]  = useState('');    // Filtro por tipo
  const [busqueda,    setBusqueda]    = useState('');
  const [planActual,  setPlanActual]  = useState('gratuito');

  // Cargar contenido del campus
  useEffect(() => {
    const cargar = async () => {
      try {
        // Obtener el plan actual del abogado para mostrar qué está bloqueado
        const perfilRes = await api.get('/auth/me');
        setPlanActual(perfilRes.data.usuario.perfil_abogado?.plan_slug || 'gratuito');

        const params = tipoFiltro ? { tipo: tipoFiltro } : {};
        const { data } = await api.get('/campus', { params });
        setContenido(data.contenido);

      } catch (err) {
        // 403 = plan sin acceso al campus
        if (err.response?.status === 403) {
          setSinAcceso(true);
        } else {
          toast.error('No se pudo cargar el campus.');
        }
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [tipoFiltro]);

  // Filtrar por búsqueda de texto (filtrado local)
  const contenidoFiltrado = contenido.filter(item => {
    if (!busqueda) return true;
    return (
      item.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.autor?.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.especialidad?.toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  // Separar eventos próximos del resto
  const eventosProximos = contenidoFiltrado.filter(i => i.es_evento);
  const contenidoGeneral = contenidoFiltrado.filter(i => !i.es_evento);

  // ── Sin acceso al campus ─────────────────────────────────────
  if (sinAcceso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-navy-900" />
          </div>
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-3">
            Campus no disponible
          </h2>
          <p className="font-body text-slate-500 mb-6 leading-relaxed">
            El acceso al campus multimedia requiere el plan Básico o superior. Mejorá tu plan para acceder a cursos, podcasts, videoconferencias y mucho más.
          </p>
          <Link to="/abogado/suscripcion" className="btn-primary w-full justify-center">
            Ver planes <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="section-title">Campus multimedia</h1>
          <p className="section-subtitle">
            Capacitación continua, biblioteca jurídica y eventos profesionales.
          </p>
        </div>

        {/* ── Buscador y filtros ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cursos, autores, temas..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Filtro por tipo */}
          <div className="flex items-center gap-2 sm:w-auto">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={tipoFiltro}
              onChange={e => setTipoFiltro(e.target.value)}
              className="input-field"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TIPOS).map(([valor, { label }]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Skeleton de carga ──────────────────────────── */}
        {cargando && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-40 bg-slate-200 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded" />
                  <div className="h-10 bg-slate-200 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Eventos próximos destacados ─────────────────── */}
        {!cargando && eventosProximos.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display font-semibold text-navy-900 text-xl mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-gold-500" />
              Próximos eventos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventosProximos.map(item => (
                <TarjetaContenido key={item.id} item={item} planActual={planActual} />
              ))}
            </div>
          </div>
        )}

        {/* ── Contenido general ─────────────────────────── */}
        {!cargando && contenidoGeneral.length === 0 && contenido.length === 0 && (
          <div className="card p-16 text-center">
            <BookOpen size={40} className="text-slate-300 mx-auto mb-4" />
            <p className="font-display text-xl text-navy-900 mb-2">Sin contenido disponible</p>
            <p className="font-body text-slate-500 text-sm">
              {busqueda || tipoFiltro
                ? 'Probá con otros filtros.'
                : 'El campus estará disponible próximamente.'
              }
            </p>
          </div>
        )}

        {!cargando && contenidoGeneral.length > 0 && (
          <div>
            {eventosProximos.length > 0 && (
              <h2 className="font-display font-semibold text-navy-900 text-xl mb-4">
                Todo el contenido
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contenidoGeneral.map(item => (
                <TarjetaContenido key={item.id} item={item} planActual={planActual} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
