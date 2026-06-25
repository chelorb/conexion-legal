// ============================================================
// src/pages/abogado/Documentos.jsx — Paleta C
// El abogado ve sus documentos y puede subir nuevos
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, CheckCircle, Clock, XCircle, X, Eye, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TIPOS = [
  { valor: 'credencial', label: 'Credencial del letrado' },
  { valor: 'titulo',     label: 'Título universitario'   },
  { valor: 'cuil',       label: 'Constancia de CUIL'     },
];

const ESTADOS = {
  pendiente: { icono: <Clock size={14} />,        label: 'En revisión', color: '#b45309', bg: 'rgba(245,158,11,0.1)'  },
  aprobado:  { icono: <CheckCircle size={14} />,  label: 'Aprobado',    color: '#15803d', bg: 'rgba(22,163,74,0.1)'   },
  rechazado: { icono: <XCircle size={14} />,      label: 'Rechazado',   color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
};

function BadgeEstado({ estado }) {
  const cfg = ESTADOS[estado] || ESTADOS.pendiente;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-body font-medium px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.icono} {cfg.label}
    </span>
  );
}

function ModalSubir({ onSubido, onCerrar, docReemplazar }) {
  const [tipo,     setTipo]     = useState(docReemplazar?.tipo || 'credencial');
  const [nombre,   setNombre]   = useState('');
  const [archivo,  setArchivo]  = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const subir = async () => {
    if (!archivo) { toast.error('Seleccioná un archivo.'); return; }
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('tipo',    tipo);
      formData.append('nombre',  nombre || TIPOS.find(t => t.valor === tipo)?.label);

      await api.post('/documentos/subir', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Documento enviado para revisión.');
      onSubido();
      onCerrar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir el documento.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(28,27,24,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-md p-6 animate-slide-up">

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg" style={{ color: '#1C1B18' }}>
            Subir documento
          </h3>
          <button onClick={onCerrar} className="p-2 rounded-lg transition-colors"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <X size={16} style={{ color: '#56534A' }} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="input-label">Tipo de documento</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="input-field">
              {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="input-label">
              Nombre descriptivo <span className="font-normal" style={{ color: '#8A8780' }}>(opcional)</span>
            </label>
            <input type="text" placeholder="Ej: Título - UBA 2020"
              value={nombre} onChange={e => setNombre(e.target.value)}
              className="input-field" />
          </div>

          <div>
            <label className="input-label">Archivo</label>
            {archivo ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                style={{ background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.25)' }}>
                <FileText size={16} style={{ color: '#16a34a' }} />
                <span className="font-body text-sm flex-1 truncate" style={{ color: '#1C1B18' }}>
                  {archivo.name}
                </span>
                <button onClick={() => setArchivo(null)}>
                  <X size={14} style={{ color: '#dc2626' }} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                style={{ borderColor: '#D4D2CC' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#B86030'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D4D2CC'; }}>
                <Upload size={24} style={{ color: '#8A8780' }} />
                <span className="font-body text-sm" style={{ color: '#8A8780' }}>
                  Click para seleccionar
                </span>
                <span className="font-body text-xs" style={{ color: '#B0AEA8' }}>
                  JPG, PNG, PDF · Máx 10 MB
                </span>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp"
                  className="hidden"
                  onChange={e => setArchivo(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>

          <div className="rounded-xl p-4" style={{ background: '#F7F6F4' }}>
            <p className="font-body text-xs leading-relaxed" style={{ color: '#56534A' }}>
              📋 El documento quedará en revisión hasta que nuestro equipo lo apruebe.
              Te notificaremos por email y en la plataforma.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={subir} disabled={subiendo || !archivo} className="btn-primary flex-1 gap-2">
            {subiendo
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Subiendo...</>
              : <><Upload size={15} /> Enviar</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentosAbogado() {
  const [documentos, setDocumentos] = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [modal,        setModal]        = useState(false);
  const [docReemplazar, setDocReemplazar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/documentos/mis-documentos');
      setDocumentos(data.documentos || []);
    } catch {
      toast.error('No se pudieron cargar los documentos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-3xl">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">Mis documentos</h1>
            <p className="section-subtitle">
              Documentación profesional verificada por el equipo de IUSTIXIUM.
            </p>
          </div>
          <button onClick={() => setModal(true)} className="btn-primary gap-2 shrink-0">
            <Upload size={15} /> Subir documento
          </button>
        </div>

        {cargando ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl" style={{ background: '#E8E6E3' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-1/3" style={{ background: '#E8E6E3' }} />
                  <div className="h-3 rounded w-1/4" style={{ background: '#E8E6E3' }} />
                </div>
              </div>
            ))}
          </div>
        ) : documentos.length === 0 ? (
          <div className="card p-14 text-center">
            <FileText size={40} className="mx-auto mb-4" style={{ color: '#D4D2CC' }} />
            <p className="font-display text-xl mb-2" style={{ color: '#1C1B18' }}>
              Sin documentos cargados
            </p>
            <p className="font-body text-sm mb-6" style={{ color: '#8A8780' }}>
              Subí tu credencial, título y constancia de CUIL para completar tu perfil.
            </p>
            <button onClick={() => setModal(true)} className="btn-primary gap-2 mx-auto">
              <Upload size={15} /> Subir primer documento
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {documentos.map(doc => (
              <div key={doc.id} className="card p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#F0EFED' }}>
                  <FileText size={20} style={{ color: '#B86030' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
                    {doc.nombre}
                  </p>
                  <p className="font-body text-xs mt-0.5" style={{ color: '#8A8780' }}>
                    {TIPOS.find(t => t.valor === doc.tipo)?.label || doc.tipo}
                  </p>
                  {doc.estado === 'rechazado' && doc.motivo_rechazo && (
                    <p className="font-body text-xs mt-1" style={{ color: '#dc2626' }}>
                      Motivo: {doc.motivo_rechazo}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <BadgeEstado estado={doc.estado} />
                  {/* Ver */}
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: '#8A8780' }}
                    title="Ver documento"
                    onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; e.currentTarget.style.color = '#1C1B18'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}>
                    <Eye size={16} />
                  </a>
                  {/* Reemplazar — abre el modal con el mismo tipo */}
                  <button
                    onClick={() => { setDocReemplazar(doc); setModal(true); }}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: '#8A8780' }}
                    title="Reemplazar documento"
                    onMouseEnter={e => { e.currentTarget.style.background = '#F0EFED'; e.currentTarget.style.color = '#B86030'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}>
                    <RefreshCw size={15} />
                  </button>
                  {/* Eliminar — solo si está rechazado o pendiente */}
                  {doc.estado !== 'aprobado' && (
                    <button
                      onClick={async () => {
                        if (!window.confirm('¿Eliminar este documento?')) return;
                        try {
                          await api.delete(`/documentos/${doc.id}`);
                          toast.success('Documento eliminado.');
                          cargar();
                        } catch {
                          toast.error('Error al eliminar.');
                        }
                      }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: '#8A8780' }}
                      title="Eliminar documento"
                      onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#dc2626'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#8A8780'; }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <ModalSubir
          onSubido={cargar}
          docReemplazar={docReemplazar}
          onCerrar={() => { setModal(false); setDocReemplazar(null); }}
        />
      )}
    </div>
  );
}
