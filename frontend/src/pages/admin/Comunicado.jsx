// ============================================================
// src/pages/admin/Comunicado.jsx — Paleta C
// Envío de comunicados masivos desde el admin
// ============================================================

import { useState } from 'react';
import { Send, Users, User, Briefcase, Bell, ArrowLeft, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DESTINATARIOS = [
  { valor: 'todos',      label: 'Todos los usuarios',   desc: 'Abogados y clientes activos',  icono: Users     },
  { valor: 'abogados',   label: 'Solo abogados',        desc: 'Todos los abogados aprobados', icono: Briefcase },
  { valor: 'clientes',   label: 'Solo clientes',        desc: 'Todos los clientes activos',   icono: User      },
  { valor: 'especifico', label: 'Usuarios específicos', desc: 'Podés seleccionar varios',     icono: Search    },
];

export default function AdminComunicado() {
  const [destinatario, setDestinatario] = useState('todos');
  const [form, setForm]                 = useState({ titulo: '', mensaje: '', link: '' });
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]); // array para modo específico multi-usuario
  const [enviando, setEnviando]         = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [busqueda,  setBusqueda]        = useState('');
  const [usuarios,  setUsuarios]        = useState([]);
  const [buscando,  setBuscando]        = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const buscarUsuario = async (texto) => {
    if (!texto.trim() || texto.length < 3) { setUsuarios([]); return; }
    setBuscando(true);
    try {
      const { data } = await api.get('/admin/usuarios');
      const filtrados = (data.usuarios || []).filter(u =>
        `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(texto.toLowerCase())
      ).slice(0, 5);
      setUsuarios(filtrados);
    } catch {}
    finally { setBuscando(false); }
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      toast.error('Título y mensaje son obligatorios.'); return;
    }
    if (destinatario === 'especifico' && usuariosSeleccionados.length === 0) {
      toast.error('Seleccioná al menos un usuario.'); return;
    }
    setEnviando(true);
    try {
      const { data } = await api.post('/notificaciones/comunicado', {
        titulo:       form.titulo.trim(),
        mensaje:      form.mensaje.trim(),
        link:         form.link.trim() || null,
        destinatario,
        usuario_ids:  destinatario === 'especifico' ? usuariosSeleccionados.map(u => u.id) : undefined,
      });
      setResultado(data);
      toast.success(data.mensaje);
      setForm({ titulo: '', mensaje: '', link: '' });
      setUsuariosSeleccionados([]);
      setBusqueda(''); setUsuarios([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al enviar.');
    } finally { setEnviando(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-3xl">

        <Link to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-body mb-6 transition-colors"
          style={{ color: '#8A8780' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}>
          <ArrowLeft size={16} /> Volver al dashboard
        </Link>

        <div className="mb-8">
          <h1 className="section-title">Enviar comunicado</h1>
          <p className="section-subtitle">
            La notificación aparece en la campana de cada usuario en tiempo real.
          </p>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="rounded-2xl p-5 mb-6 flex items-center gap-3 animate-slide-down"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
            <Bell size={20} style={{ color: '#16a34a' }} />
            <div>
              <p className="font-body font-semibold text-sm" style={{ color: '#15803d' }}>
                Comunicado enviado correctamente
              </p>
              <p className="font-body text-xs mt-0.5" style={{ color: '#16a34a' }}>
                {resultado.mensaje}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={enviar} className="space-y-6">

          {/* Selector de destinatarios */}
          <div className="card p-6">
            <p className="font-body font-semibold text-sm mb-4" style={{ color: '#1C1B18' }}>
              ¿A quién le llega?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {DESTINATARIOS.map(({ valor, label, desc, icono: Icono }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => { setDestinatario(valor); setUsuariosSeleccionados([]); setBusqueda(''); setUsuarios([]); }}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: destinatario === valor ? '#2C2B27' : '#E8E6E3',
                    background:  destinatario === valor ? '#F7F6F4' : '#fff',
                  }}
                >
                  <Icono size={18} className="mb-2" style={{ color: destinatario === valor ? '#2C2B27' : '#8A8780' }} />
                  <p className="font-body font-medium text-sm" style={{ color: '#1C1B18' }}>{label}</p>
                  <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>{desc}</p>
                </button>
              ))}
            </div>

            {/* Buscador multi-usuario para modo específico */}
            {destinatario === 'especifico' && (
              <div className="mt-4 animate-slide-down">
                <label className="input-label">Buscar y agregar usuarios</label>

                {/* Chips de usuarios ya seleccionados */}
                {usuariosSeleccionados.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {usuariosSeleccionados.map(u => (
                      <span key={u.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium"
                        style={{ background: '#2C2B27', color: '#fff' }}>
                        {u.nombre} {u.apellido}
                        <button type="button"
                          onClick={() => setUsuariosSeleccionados(prev => prev.filter(x => x.id !== u.id))}
                          className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input de búsqueda */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8A8780' }} />
                  <input type="text" placeholder="Nombre o email (mínimo 3 caracteres)..."
                    value={busqueda}
                    onChange={e => { setBusqueda(e.target.value); buscarUsuario(e.target.value); }}
                    className="input-field pl-9" />
                </div>

                {/* Lista de resultados — solo muestra los que no están seleccionados */}
                {usuarios.filter(u => !usuariosSeleccionados.some(s => s.id === u.id)).length > 0 && (
                  <div className="mt-2 rounded-xl border overflow-hidden" style={{ borderColor: '#E8E6E3' }}>
                    {usuarios
                      .filter(u => !usuariosSeleccionados.some(s => s.id === u.id))
                      .map(u => (
                        <button key={u.id} type="button"
                          onClick={() => {
                            // Agregar al array de seleccionados y limpiar el input
                            setUsuariosSeleccionados(prev => [...prev, u]);
                            setBusqueda('');
                            setUsuarios([]);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left border-b last:border-0 transition-colors"
                          style={{ borderColor: '#F7F6F4' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: '#2C2B27' }}>
                            <span className="text-white text-xs font-bold">{u.nombre[0]}{u.apellido[0]}</span>
                          </div>
                          <div>
                            <p className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>{u.nombre} {u.apellido}</p>
                            <p className="font-body text-xs" style={{ color: '#8A8780' }}>{u.email} · {u.rol}</p>
                          </div>
                        </button>
                      ))
                    }
                  </div>
                )}

                {/* Contador de seleccionados */}
                {usuariosSeleccionados.length > 0 && (
                  <p className="font-body text-xs mt-2 flex items-center gap-1.5" style={{ color: '#16a34a' }}>
                    ✓ {usuariosSeleccionados.length} usuario{usuariosSeleccionados.length > 1 ? 's' : ''} seleccionado{usuariosSeleccionados.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Contenido del comunicado */}
          <div className="card p-6 space-y-4">
            <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
              Contenido
            </p>
            <div>
              <label className="input-label">Título *</label>
              <input type="text" placeholder="Ej: Actualización importante de la plataforma"
                value={form.titulo} onChange={e => set('titulo', e.target.value)}
                className="input-field" maxLength={255} required />
              <p className="font-body text-xs mt-1 text-right" style={{ color: '#B0AEA8' }}>
                {form.titulo.length}/255
              </p>
            </div>
            <div>
              <label className="input-label">Mensaje *</label>
              <textarea rows={5} placeholder="Escribí el contenido del comunicado..."
                value={form.mensaje} onChange={e => set('mensaje', e.target.value)}
                className="input-field resize-none" required />
            </div>
            <div>
              <label className="input-label">
                Link <span className="font-normal" style={{ color: '#8A8780' }}>(opcional — al hacer click en la notificación)</span>
              </label>
              <input type="text" placeholder="Ej: /abogado/suscripcion o /clientes"
                value={form.link} onChange={e => set('link', e.target.value)}
                className="input-field" />
            </div>
          </div>

          {/* Preview */}
          {(form.titulo || form.mensaje) && (
            <div className="card p-5">
              <p className="font-body text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8A8780' }}>
                Preview de la notificación
              </p>
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#F7F6F4' }}>
                <span className="text-xl">📢</span>
                <div>
                  <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
                    {form.titulo || 'Título del comunicado'}
                  </p>
                  <p className="font-body text-xs mt-0.5 leading-relaxed" style={{ color: '#56534A' }}>
                    {form.mensaje || 'Contenido del mensaje...'}
                  </p>
                  <p className="font-body text-xs mt-1" style={{ color: '#B0AEA8' }}>ahora mismo</p>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={enviando}
            className="btn-primary w-full justify-center gap-2">
            {enviando
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
              : <><Send size={16} /> Enviar comunicado</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
