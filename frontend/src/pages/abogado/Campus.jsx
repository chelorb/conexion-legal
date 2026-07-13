// ============================================================
// src/pages/abogado/Campus.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Headphones, Video, Library, Clock, Lock, ArrowRight, Play, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TIPOS = {
  curso:           { label: 'Curso',        icono: BookOpen,   accion: 'Ver curso'   },
  articulo:        { label: 'Artículo',     icono: Library,    accion: 'Leer'        },
  podcast:         { label: 'Podcast',      icono: Headphones, accion: 'Escuchar'    },
  videoconferencia:{ label: 'Videoconf.',   icono: Video,      accion: 'Ver'         },
  biblioteca:      { label: 'Biblioteca',   icono: Library,    accion: 'Descargar'   },
  congreso:        { label: 'Congreso',     icono: BookOpen,   accion: 'Inscribirse' },
};

function TarjetaContenido({ item, planActual }) {
  const config  = TIPOS[item.tipo] || TIPOS.curso;
  const Icono   = config.icono;
  // tiene_acceso viene del backend — true si el plan del abogado está en planes_requeridos
  const bloqueado = !item.tiene_acceso;

  return (
    <div className={`card flex flex-col transition-all duration-200 ${bloqueado ? 'opacity-60' : 'hover:shadow-card-hover'}`}>
      {/* Miniatura */}
      <div
        className="relative h-40 rounded-t-2xl overflow-hidden flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1C1B18 0%, #3A3832 100%)' }}
      >
        <Icono size={40} style={{ color: 'rgba(255,255,255,0.15)' }} />

        {/* Badge tipo */}
        <div
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-medium"
          style={{ background: 'rgba(184,96,48,0.9)', color: '#fff' }}
        >
          <Icono size={11} /> {config.label}
        </div>

        {/* Candado */}
        {bloqueado && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="text-center">
              <Lock size={28} className="text-white mx-auto mb-2" />
              <p className="font-body text-white text-xs font-medium capitalize">
                Plan requerido
              </p>
            </div>
          </div>
        )}

        {/* Duración */}
        {item.duracion_min && !bloqueado && (
          <div
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-body text-white"
            style={{ background: 'rgba(28,27,24,0.6)' }}
          >
            <Clock size={10} />
            {item.duracion_min >= 60
              ? `${Math.floor(item.duracion_min / 60)}h${item.duracion_min % 60 > 0 ? ` ${item.duracion_min % 60}m` : ''}`
              : `${item.duracion_min}m`
            }
          </div>
        )}
      </div>

      {/* Cuerpo */}
      <div className="p-5 flex flex-col flex-1">
        {item.especialidad && (
          <span
            className="font-body text-xs px-2.5 py-1 rounded-full inline-block mb-3 self-start"
            style={{ background: 'rgba(184,96,48,0.08)', color: '#B86030' }}
          >
            {item.especialidad}
          </span>
        )}

        <h3 className="font-display font-semibold text-base leading-snug mb-2 flex-1"
          style={{ color: '#1C1B18' }}>
          {item.titulo}
        </h3>

        {item.descripcion && (
          <p className="font-body text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: '#8A8780' }}>
            {item.descripcion}
          </p>
        )}

        {item.autor && (
          <p className="font-body text-xs mb-4" style={{ color: '#8A8780' }}>
            Por <span style={{ color: '#56534A' }}>{item.autor}</span>
          </p>
        )}

        {bloqueado ? (
          <Link
            to="/abogado/suscripcion"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-body font-medium text-sm border transition-colors w-full"
            style={{ borderColor: '#D4D2CC', color: '#56534A' }}
          >
            <Lock size={13} /> Mejorar plan
          </Link>
        ) : (
          <button
            onClick={() => {
              if (item.contenido_url) window.open(item.contenido_url, '_blank');
              else if (item.link_evento) window.open(item.link_evento, '_blank');
              else toast('Contenido próximamente.', { icon: '⏳' });
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-body font-medium text-sm text-white w-full transition-colors"
            style={{ background: '#2C2B27' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
          >
            <Play size={13} /> {config.accion}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Campus() {
  const [contenido,  setContenido]  = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [sinAcceso,  setSinAcceso]  = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [busqueda,   setBusqueda]   = useState('');
  useEffect(() => {
    const cargar = async () => {
      try {
        const params = tipoFiltro ? { tipo: tipoFiltro } : {};
        const { data } = await api.get('/campus', { params });
        setContenido(data.contenido); // cada item tiene tiene_acceso desde el backend
      } catch (err) {
        if (err.response?.status === 403) setSinAcceso(true);
        else toast.error('No se pudo cargar el campus.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [tipoFiltro]);

  const contenidoFiltrado = contenido.filter(item => {
    if (!busqueda) return true;
    return item.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
           item.autor?.toLowerCase().includes(busqueda.toLowerCase());
  });

  if (sinAcceso) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFED' }}>
      <div className="card p-12 max-w-md text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(44,43,39,0.06)' }}>
          <Lock size={36} style={{ color: '#2C2B27' }} />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3" style={{ color: '#1C1B18' }}>Campus no disponible</h2>
        <p className="font-body mb-6 leading-relaxed" style={{ color: '#8A8780' }}>
          El acceso al campus requiere el plan Básico o superior.
        </p>
        <Link to="/abogado/suscripcion" className="btn-primary w-full justify-center">
          Ver planes <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        <div className="mb-8">
          <h1 className="section-title">Campus multimedia</h1>
          <p className="section-subtitle">Capacitación continua, biblioteca jurídica y eventos.</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
            <input type="text" placeholder="Buscar cursos, autores..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} style={{ color: '#8A8780' }} />
            <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} className="input-field">
              <option value="">Todos los tipos</option>
              {Object.entries(TIPOS).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Skeleton */}
        {cargando && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-40 rounded-t-2xl" style={{ background: '#E8E6E3' }} />
                <div className="p-5 space-y-3">
                  <div className="h-3 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                  <div className="h-5 rounded w-3/4" style={{ background: '#E8E6E3' }} />
                  <div className="h-10 rounded-xl mt-4" style={{ background: '#E8E6E3' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin contenido */}
        {!cargando && contenidoFiltrado.length === 0 && (
          <div className="card p-16 text-center">
            <BookOpen size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>Sin contenido disponible</p>
            <p className="font-body text-sm" style={{ color: '#8A8780' }}>
              {busqueda || tipoFiltro ? 'Probá con otros filtros.' : 'El campus estará disponible próximamente.'}
            </p>
          </div>
        )}

        {/* Grilla */}
        {!cargando && contenidoFiltrado.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contenidoFiltrado.map(item => (
              <TarjetaContenido key={item.id} item={item} planActual={planActual} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
