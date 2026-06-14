// ============================================================
// src/pages/admin/Dashboard.jsx — Paleta C: Gris carbón + Cobre
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Scale, Calendar, DollarSign,
  TrendingUp, ArrowRight, CheckCircle,
  Clock, AlertCircle, RefreshCw, Phone, Check, X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

function StatCard({ icono: Icono, valor, label, subLabel, colorFondo, colorIcono, link }) {
  const contenido = (
    <div
      className="card p-6 flex flex-col gap-4 transition-all duration-200"
      style={link ? { cursor: 'pointer' } : {}}
      onMouseEnter={e => { if (link) e.currentTarget.style.boxShadow = '0 6px 24px rgba(28,27,24,0.12)'; }}
      onMouseLeave={e => { if (link) e.currentTarget.style.boxShadow = ''; }}
    >
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorFondo}`}>
          <Icono size={22} className={colorIcono} />
        </div>
        {link && <ArrowRight size={16} style={{ color: '#D4D2CC' }} />}
      </div>
      <div>
        <p className="font-display text-3xl font-bold" style={{ color: '#1C1B18' }}>
          {valor ?? <span style={{ color: '#D4D2CC' }}>—</span>}
        </p>
        <p className="font-body text-sm mt-1" style={{ color: '#8A8780' }}>{label}</p>
        {subLabel && <p className="font-body text-xs mt-0.5" style={{ color: '#B0AEA8' }}>{subLabel}</p>}
      </div>
    </div>
  );
  return link ? <Link to={link}>{contenido}</Link> : contenido;
}

// ─────────────────────────────────────────────────────────────
// Sección para configurar el número de WhatsApp del admin
// ─────────────────────────────────────────────────────────────
function ConfigWhatsApp() {
  const [numero,    setNumero]    = useState('');
  const [original,  setOriginal]  = useState('');
  const [cargando,  setCargando]  = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Cargar número actual
  useEffect(() => {
    api.get('/admin/config')
      .then(r => {
        const val = r.data.config?.whatsapp_admin?.valor || '';
        setNumero(val);
        setOriginal(val);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const guardar = async () => {
    // Validación básica: solo números, mínimo 10 dígitos
    const limpio = numero.replace(/\D/g, '');
    if (limpio && limpio.length < 10) {
      return toast.error('El número debe tener al menos 10 dígitos (incluí el código de país).');
    }

    setGuardando(true);
    try {
      await api.put('/admin/config/whatsapp_admin', { valor: limpio });
      setOriginal(limpio);
      setNumero(limpio);
      toast.success('Número de WhatsApp actualizado.');
    } catch {
      toast.error('No se pudo guardar el número.');
    } finally {
      setGuardando(false);
    }
  };

  const cancelar = () => setNumero(original);
  const cambio   = numero !== original;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        {/* Ícono WhatsApp */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(37,211,102,0.12)' }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <div>
          <h2 className="font-display font-semibold text-base" style={{ color: '#1C1B18' }}>
            Grupo de WhatsApp
          </h2>
          <p className="font-body text-xs" style={{ color: '#8A8780' }}>
            Número al que se envían las solicitudes de los abogados
          </p>
        </div>
      </div>

      {cargando ? (
        <div className="h-10 rounded-xl animate-pulse" style={{ background: '#F0EFED' }} />
      ) : (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              {/* Prefijo +  */}
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm select-none"
                style={{ color: '#8A8780' }}>+</span>
              <input
                type="tel"
                value={numero}
                onChange={e => setNumero(e.target.value.replace(/\D/g, ''))}
                placeholder="5492984123456"
                className="input-field pl-8"
                maxLength={15}
              />
            </div>
            {cambio && (
              <>
                <button onClick={guardar} disabled={guardando}
                  className="px-4 py-2 rounded-xl font-body text-sm font-semibold text-white transition-colors shrink-0"
                  style={{ background: '#25D366' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1da851'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#25D366'; }}>
                  {guardando
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Check size={16} />
                  }
                </button>
                <button onClick={cancelar}
                  className="px-3 py-2 rounded-xl transition-colors shrink-0"
                  style={{ background: '#F0EFED', color: '#56534A' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E8E6E3'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F0EFED'; }}>
                  <X size={16} />
                </button>
              </>
            )}
          </div>

          <p className="font-body text-xs mt-2" style={{ color: '#8A8780' }}>
            Formato: código de país + número sin espacios.{' '}
            <span style={{ color: '#B86030' }}>Ej: 5492984123456</span>
            {' '}(54 = Argentina, 929 = Río Negro sin el 0 ni el 15)
          </p>

          {/* Preview del link si hay número */}
          {original && (
            <a
              href={`https://wa.me/${original}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 font-body text-xs transition-colors hover:underline"
              style={{ color: '#25D366' }}
            >
              <Phone size={12} /> Probar enlace →
            </a>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltima] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/admin/estadisticas');
      setStats(data);
      setUltima(new Date());
    } catch {
      toast.error('No se pudieron cargar las estadísticas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">Panel de administración</h1>
            <p className="font-body text-sm mt-1" style={{ color: '#8A8780' }}>
              {ultimaActualizacion
                ? `Actualizado: ${format(ultimaActualizacion, "HH:mm 'hs'")}`
                : 'Cargando...'
              }
            </p>
          </div>
          <button onClick={cargar} disabled={cargando} className="btn-secondary gap-2 shrink-0">
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Stats principales */}
        {cargando && !stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-12 h-12 rounded-xl mb-4" style={{ background: '#E8E6E3' }} />
                <div className="h-8 rounded w-1/2 mb-2" style={{ background: '#E8E6E3' }} />
                <div className="h-3 rounded w-3/4" style={{ background: '#E8E6E3' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icono={Users}      valor={stats?.usuarios_activos?.toLocaleString('es-AR')}  label="Usuarios activos"   subLabel="Clientes y abogados"    colorFondo="bg-blue-50"   colorIcono="text-blue-600"  link="/admin/usuarios" />
            <StatCard icono={Scale}      valor={stats?.abogados_visibles?.toLocaleString('es-AR')} label="Abogados en grilla" subLabel="Perfiles aprobados"     colorFondo="bg-stone-100" colorIcono="text-stone-600" link="/admin/abogados" />
            <StatCard icono={Calendar}   valor={stats?.consultas_totales?.toLocaleString('es-AR')} label="Consultas totales"  subLabel={`${stats?.consultas_completadas || 0} completadas`} colorFondo="bg-green-50"  colorIcono="text-green-600" />
            <StatCard icono={DollarSign} valor={stats?.ingresos_totales ? `$${Math.round(stats.ingresos_totales).toLocaleString('es-AR')}` : '$0'} label="Ingresos totales" subLabel="Suscripciones" colorFondo="bg-amber-50" colorIcono="text-amber-600" />
          </div>
        )}

        {/* Alerta pendientes */}
        {stats?.abogados_pendientes > 0 && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(184,96,48,0.08)', border: '1px solid rgba(184,96,48,0.2)' }}>
            <AlertCircle size={18} style={{ color: '#B86030' }} className="shrink-0" />
            <p className="font-body text-sm" style={{ color: '#56534A' }}>
              Hay <strong>{stats.abogados_pendientes}</strong> abogado{stats.abogados_pendientes > 1 ? 's' : ''} esperando aprobación.
            </p>
            <Link to="/admin/abogados"
              className="ml-auto font-body text-sm font-medium shrink-0 hover:underline"
              style={{ color: '#B86030' }}>
              Revisar →
            </Link>
          </div>
        )}

        {/* Segunda fila */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-sm font-medium" style={{ color: '#56534A' }}>Tasa de completado</p>
                <CheckCircle size={16} className="text-green-500" />
              </div>
              <p className="font-display text-2xl font-bold mb-1" style={{ color: '#1C1B18' }}>
                {stats.consultas_totales > 0
                  ? `${Math.round((stats.consultas_completadas / stats.consultas_totales) * 100)}%`
                  : '0%'
                }
              </p>
              <div className="w-full rounded-full h-1.5 mt-2" style={{ background: '#F0EFED' }}>
                <div className="h-1.5 rounded-full transition-all" style={{
                  background: '#B86030',
                  width: stats.consultas_totales > 0
                    ? `${(stats.consultas_completadas / stats.consultas_totales) * 100}%`
                    : '0%'
                }} />
              </div>
              <p className="font-body text-xs mt-1.5" style={{ color: '#8A8780' }}>
                {stats.consultas_completadas} de {stats.consultas_totales}
              </p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-sm font-medium" style={{ color: '#56534A' }}>Abogados activos</p>
                <TrendingUp size={16} style={{ color: '#B86030' }} />
              </div>
              <p className="font-display text-2xl font-bold" style={{ color: '#1C1B18' }}>{stats.abogados_visibles}</p>
              <p className="font-body text-xs mt-1" style={{ color: '#8A8780' }}>Perfiles visibles</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-sm font-medium" style={{ color: '#56534A' }}>Ingreso por abogado</p>
                <DollarSign size={16} style={{ color: '#B86030' }} />
              </div>
              <p className="font-display text-2xl font-bold" style={{ color: '#1C1B18' }}>
                {stats.abogados_visibles > 0 && stats.ingresos_totales > 0
                  ? `$${Math.round(stats.ingresos_totales / stats.abogados_visibles).toLocaleString('es-AR')}`
                  : '$0'
                }
              </p>
              <p className="font-body text-xs mt-1" style={{ color: '#8A8780' }}>Promedio mensual</p>
            </div>
          </div>
        )}

        {/* Tercera fila: acciones + estado + config WhatsApp */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h2 className="font-display font-semibold text-lg mb-5" style={{ color: '#1C1B18' }}>
              Acciones rápidas
            </h2>
            <div className="space-y-1">
              {[
                { href: '/admin/abogados', label: 'Aprobar perfiles pendientes', desc: 'Revisar y validar nuevos abogados', icono: '✅' },
                { href: '/admin/campus',   label: 'Gestionar campus',            desc: 'Agregar cursos y contenido',        icono: '📚' },
                { href: '/admin/eventos',  label: 'Crear evento en la agenda',   desc: 'Seminarios y charlas',             icono: '📅' },
                { href: '/admin/foro',     label: 'Moderar el foro',             desc: 'Gestionar categorías e hilos',     icono: '💬' },
                { href: '/admin/links',    label: 'Gestionar links de interés',  desc: 'Links del sidebar del abogado',    icono: '🔗' },
              ].map(({ href, label, desc, icono }) => (
                <Link key={href + label} to={href}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors group"
                  onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <span className="text-xl shrink-0">{icono}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-medium text-sm" style={{ color: '#1C1B18' }}>{label}</p>
                    <p className="font-body text-xs" style={{ color: '#8A8780' }}>{desc}</p>
                  </div>
                  <ArrowRight size={15} style={{ color: '#D4D2CC' }} className="shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Config WhatsApp */}
            <ConfigWhatsApp />

            {/* Estado plataforma */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-lg mb-4" style={{ color: '#1C1B18' }}>
                Estado de la plataforma
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'API Backend',       ok: true,  desc: 'Operativa'    },
                  { label: 'Base de datos',     ok: true,  desc: 'Conectada'    },
                  { label: 'Sistema de pagos',  ok: false, desc: 'MercadoPago'  },
                  { label: 'Servicio de email', ok: false, desc: 'SMTP'         },
                ].map(({ label, ok, desc }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: '#F0EFED' }}>
                    <div>
                      <p className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>{label}</p>
                      <p className="font-body text-xs" style={{ color: '#8A8780' }}>{desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium"
                      style={ok
                        ? { background: 'rgba(22,163,74,0.08)', color: '#16a34a' }
                        : { background: 'rgba(220,38,38,0.08)', color: '#dc2626' }
                      }>
                      <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'animate-pulse-slow' : ''}`}
                        style={{ background: ok ? '#16a34a' : '#dc2626' }} />
                      {ok ? 'OK' : 'Configurar'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
