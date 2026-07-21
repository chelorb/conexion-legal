// ============================================================
// src/pages/admin/Auditoria.jsx — Paleta C: Gris carbón + Cobre
// Historial de acciones críticas realizadas por administradores
// Permite filtrar por tipo de acción, admin y rango de fechas
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Filter, ChevronLeft, ChevronRight, Search, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Etiquetas legibles y colores por tipo de acción
const ACCIONES = {
  aprobar_abogado:    { label: 'Aprobó abogado',        color: '#16a34a', bg: 'rgba(22,163,74,0.08)'   },
  rechazar_abogado:   { label: 'Rechazó abogado',       color: '#dc2626', bg: 'rgba(220,38,38,0.08)'   },
  habilitar_cuenta:   { label: 'Habilitó cuenta',       color: '#16a34a', bg: 'rgba(22,163,74,0.08)'   },
  deshabilitar_cuenta:{ label: 'Deshabilitó cuenta',    color: '#b45309', bg: 'rgba(245,158,11,0.08)'  },
  eliminar_cuenta:    { label: 'Eliminó cuenta',        color: '#dc2626', bg: 'rgba(220,38,38,0.08)'   },
  cambiar_plan_abogado:{ label: 'Cambió plan',          color: '#B86030', bg: 'rgba(184,96,48,0.08)'   },
  permitir_reregistro:{ label: 'Permitió re-registro',  color: '#7c3aed', bg: 'rgba(124,58,237,0.08)'  },
};

const etiquetaAccion = (accion) =>
  ACCIONES[accion] || { label: accion, color: '#56534A', bg: 'rgba(0,0,0,0.05)' };

export default function AdminAuditoria() {
  const [registros,  setRegistros]  = useState([]);
  const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, paginas: 1 });
  const [cargando,   setCargando]   = useState(true);
  const [expandido,  setExpandido]  = useState(null); // id del registro expandido

  // Filtros
  const [filtros, setFiltros] = useState({
    accion:  '',
    desde:   '',
    hasta:   '',
    pagina:  1,
  });

  const setFiltro = (k, v) => setFiltros(p => ({ ...p, [k]: v, pagina: 1 }));
  const [exportando, setExportando] = useState(false);

  // ── Exportar a Excel ────────────────────────────────────────
  const exportarExcel = async () => {
    setExportando(true);
    try {
      // Traer TODOS los registros sin paginación para exportar
      const params = new URLSearchParams();
      if (filtros.accion) params.set('accion', filtros.accion);
      if (filtros.desde)  params.set('desde',  filtros.desde);
      if (filtros.hasta)  params.set('hasta',  filtros.hasta);
      params.set('pagina', 1);
      params.set('limite', 9999); // traer todo

      const { data } = await api.get(`/admin/auditoria?${params}`);
      const todos = data.registros || [];

      // Importar xlsx dinámicamente
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');

      const filas = todos.map(r => ({
        'Fecha':       format(new Date(r.creado_en), "dd/MM/yyyy HH:mm", { locale: es }),
        'Acción':      etiquetaAccion(r.accion).label,
        'Descripción': r.descripcion || '',
        'Entidad':     r.entidad_label || '',
        'Admin':       r.admin_nombre ? `${r.admin_nombre} ${r.admin_apellido || ''}`.trim() : r.admin_email || '',
        'IP':          r.ip || '',
        'ID Registro': r.id,
      }));

      const ws = XLSX.utils.json_to_sheet(filas);
      // Ancho de columnas
      ws['!cols'] = [
        { wch: 18 }, { wch: 22 }, { wch: 50 },
        { wch: 35 }, { wch: 25 }, { wch: 16 }, { wch: 38 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Auditoría');

      const fecha = format(new Date(), 'yyyyMMdd_HHmm');
      XLSX.writeFile(wb, `IUSTIXIUM_Auditoria_${fecha}.xlsx`);
      toast.success('Exportado a Excel correctamente.');
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar a Excel.');
    } finally { setExportando(false); }
  };

  // ── Exportar a PDF (impresión del navegador) ─────────────────
  const exportarPDF = async () => {
    setExportando(true);
    try {
      // Traer todos los registros
      const params = new URLSearchParams();
      if (filtros.accion) params.set('accion', filtros.accion);
      if (filtros.desde)  params.set('desde',  filtros.desde);
      if (filtros.hasta)  params.set('hasta',  filtros.hasta);
      params.set('pagina', 1);
      params.set('limite', 9999);

      const { data } = await api.get(`/admin/auditoria?${params}`);
      const todos = data.registros || [];

      // Crear ventana de impresión con el contenido formateado
      const filas = todos.map(r => `
        <tr>
          <td>${format(new Date(r.creado_en), "dd/MM/yyyy HH:mm", { locale: es })}</td>
          <td><span class="badge">${etiquetaAccion(r.accion).label}</span></td>
          <td>${r.descripcion || '—'}</td>
          <td>${r.entidad_label || '—'}</td>
          <td>${r.admin_nombre ? `${r.admin_nombre} ${r.admin_apellido || ''}`.trim() : r.admin_email || '—'}</td>
          <td>${r.ip || '—'}</td>
        </tr>
      `).join('');

      const fechaGen = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>IUSTIXIUM — Auditoría</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #333; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #2C2B27; }
    .header h1 { font-size: 18px; color: #2C2B27; }
    .header p { font-size: 10px; color: #8A8780; }
    .meta { margin-bottom: 12px; font-size: 10px; color: #666; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #2C2B27; color: #fff; padding: 8px 6px; text-align: left; font-size: 10px; }
    td { padding: 6px; border-bottom: 1px solid #E8E6E3; vertical-align: top; font-size: 10px; }
    tr:nth-child(even) td { background: #FAFAF8; }
    .badge { background: #F0EFED; padding: 2px 6px; border-radius: 10px; font-size: 9px; white-space: nowrap; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #B0AEA8; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>⚖ IUSTIXIUM</h1>
      <p>Plataforma Legal Digital</p>
    </div>
    <div style="text-align:right">
      <strong>Registro de Auditoría</strong>
      <p>Generado: ${fechaGen}</p>
      <p>Total registros: ${todos.length}</p>
    </div>
  </div>
  ${filtros.accion || filtros.desde || filtros.hasta ? `
  <div class="meta">
    Filtros aplicados:
    ${filtros.accion ? `Acción: ${etiquetaAccion(filtros.accion).label}` : ''}
    ${filtros.desde ? `| Desde: ${filtros.desde}` : ''}
    ${filtros.hasta ? `| Hasta: ${filtros.hasta}` : ''}
  </div>` : ''}
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Acción</th>
        <th>Descripción</th>
        <th>Entidad</th>
        <th>Usuario</th>
        <th>IP</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="footer">IUSTIXIUM — Documento generado automáticamente el ${fechaGen}</div>
</body>
</html>`;

      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
      win.onload = () => { win.print(); };
      toast.success('PDF listo para imprimir/guardar.');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF.');
    } finally { setExportando(false); }
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.accion) params.set('accion', filtros.accion);
      if (filtros.desde)  params.set('desde',  filtros.desde);
      if (filtros.hasta)  params.set('hasta',  filtros.hasta);
      params.set('pagina', filtros.pagina);

      const { data } = await api.get(`/admin/auditoria?${params}`);
      setRegistros(data.registros);
      setPaginacion(data.paginacion);
    } catch {
      toast.error('Error al cargar el historial de auditoría.');
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);

  const irPagina = (p) => setFiltros(prev => ({ ...prev, pagina: p }));

  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>
      <div className="page-container py-8 max-w-6xl">

        {/* Header */}
        <Link to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-body mb-6 transition-colors"
          style={{ color: '#8A8780' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}>
          <ArrowLeft size={16} /> Volver al dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(44,43,39,0.08)' }}>
            <Shield size={20} style={{ color: '#2C2B27' }} />
          </div>
          <div>
            <h1 className="section-title mb-0">Auditoría</h1>
            <p className="section-subtitle mb-0">
              Historial de acciones críticas realizadas por administradores
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={15} style={{ color: '#8A8780' }} />
            <p className="font-body text-sm font-medium" style={{ color: '#56534A' }}>Filtros</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">

            {/* Tipo de acción */}
            <div>
              <label className="input-label">Tipo de acción</label>
              <select
                value={filtros.accion}
                onChange={e => setFiltro('accion', e.target.value)}
                className="input-field"
              >
                <option value="">Todas las acciones</option>
                {Object.entries(ACCIONES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Desde */}
            <div>
              <label className="input-label">Desde</label>
              <input type="date" value={filtros.desde}
                onChange={e => setFiltro('desde', e.target.value)}
                className="input-field" />
            </div>

            {/* Hasta */}
            <div>
              <label className="input-label">Hasta</label>
              <input type="date" value={filtros.hasta}
                onChange={e => setFiltro('hasta', e.target.value)}
                className="input-field" />
            </div>
          </div>

          {/* Limpiar filtros */}
          {(filtros.accion || filtros.desde || filtros.hasta) && (
            <button
              onClick={() => setFiltros({ accion: '', desde: '', hasta: '', pagina: 1 })}
              className="mt-3 font-body text-xs hover:underline"
              style={{ color: '#B86030' }}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Contador + Exportación */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="font-body text-sm" style={{ color: '#8A8780' }}>
            {cargando ? 'Cargando...' : `${paginacion.total} registro${paginacion.total !== 1 ? 's' : ''} encontrado${paginacion.total !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-2">
            {paginacion.paginas > 1 && (
              <p className="font-body text-xs mr-2" style={{ color: '#B0AEA8' }}>
                Página {paginacion.pagina} de {paginacion.paginas}
              </p>
            )}
            {/* Botones de exportación */}
            {!cargando && paginacion.total > 0 && (
              <>
                <button
                  onClick={exportarExcel}
                  disabled={exportando}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-colors disabled:opacity-40"
                  style={{ background: 'rgba(22,163,74,0.08)', color: '#15803d', border: '1px solid rgba(22,163,74,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.08)'; }}
                  title="Exportar a Excel">
                  <Download size={13} /> {exportando ? 'Exportando...' : 'Excel'}
                </button>
                <button
                  onClick={exportarPDF}
                  disabled={exportando}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-colors disabled:opacity-40"
                  style={{ background: 'rgba(184,96,48,0.08)', color: '#B86030', border: '1px solid rgba(184,96,48,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,96,48,0.08)'; }}
                  title="Exportar a PDF">
                  <FileText size={13} /> {exportando ? 'Generando...' : 'PDF'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lista de registros */}
        {cargando ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-6 rounded-full" style={{ background: '#E8E6E3' }} />
                  <div className="h-4 rounded flex-1" style={{ background: '#E8E6E3' }} />
                  <div className="w-32 h-4 rounded" style={{ background: '#E8E6E3' }} />
                </div>
              </div>
            ))}
          </div>
        ) : registros.length === 0 ? (
          <div className="card p-12 text-center">
            <Shield size={40} className="mx-auto mb-3" style={{ color: '#D4D2CC' }} />
            <p className="font-body text-sm" style={{ color: '#8A8780' }}>
              No hay registros de auditoría para los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {registros.map(reg => {
              const { label, color, bg } = etiquetaAccion(reg.accion);
              const estaExpandido = expandido === reg.id;
              const tieneDatos = reg.datos_antes || reg.datos_despues;

              return (
                <div key={reg.id} className="card overflow-hidden">
                  {/* Fila principal */}
                  <div
                    className="flex items-center gap-4 p-4 transition-colors"
                    style={{ cursor: tieneDatos ? 'pointer' : 'default' }}
                    onClick={() => tieneDatos && setExpandido(estaExpandido ? null : reg.id)}
                    onMouseEnter={e => { if (tieneDatos) e.currentTarget.style.background = '#FAFAF8'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                  >
                    {/* Badge de acción */}
                    <span
                      className="shrink-0 px-3 py-1 rounded-full font-body text-xs font-semibold whitespace-nowrap"
                      style={{ color, background: bg }}
                    >
                      {label}
                    </span>

                    {/* Descripción */}
                    <p className="font-body text-sm flex-1 min-w-0 truncate" style={{ color: '#3A3832' }}>
                      {reg.descripcion || reg.entidad_label || '—'}
                    </p>

                    {/* Admin que ejecutó */}
                    <div className="shrink-0 text-right hidden sm:block">
                      <p className="font-body text-xs font-medium" style={{ color: '#56534A' }}>
                        {reg.admin_nombre ? `${reg.admin_nombre} ${reg.admin_apellido || ''}` : reg.admin_email || '—'}
                      </p>
                      <p className="font-body text-xs" style={{ color: '#B0AEA8' }}>
                        {format(new Date(reg.creado_en), "d MMM yyyy · HH:mm", { locale: es })}
                      </p>
                    </div>

                    {/* Expandir si hay datos */}
                    {tieneDatos && (
                      <ChevronRight
                        size={16}
                        style={{
                          color: '#D4D2CC',
                          transform: estaExpandido ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>

                  {/* Fecha en mobile */}
                  <div className="px-4 pb-3 sm:hidden">
                    <p className="font-body text-xs" style={{ color: '#B0AEA8' }}>
                      {reg.admin_email} · {format(new Date(reg.creado_en), "d MMM yyyy · HH:mm", { locale: es })}
                    </p>
                  </div>

                  {/* Panel expandido con datos antes/después */}
                  {estaExpandido && tieneDatos && (
                    <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: '#F0EFED', background: '#FAFAF8' }}>
                      <div className="grid sm:grid-cols-2 gap-4">

                        {reg.datos_antes && (
                          <div>
                            <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2"
                              style={{ color: '#8A8780' }}>
                              Antes
                            </p>
                            <pre
                              className="font-body text-xs rounded-xl p-3 overflow-auto"
                              style={{ background: 'rgba(220,38,38,0.04)', color: '#56534A', maxHeight: 200 }}
                            >
                              {JSON.stringify(reg.datos_antes, null, 2)}
                            </pre>
                          </div>
                        )}

                        {reg.datos_despues && (
                          <div>
                            <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2"
                              style={{ color: '#8A8780' }}>
                              Después
                            </p>
                            <pre
                              className="font-body text-xs rounded-xl p-3 overflow-auto"
                              style={{ background: 'rgba(22,163,74,0.04)', color: '#56534A', maxHeight: 200 }}
                            >
                              {JSON.stringify(reg.datos_despues, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Metadata adicional */}
                      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t" style={{ borderColor: '#F0EFED' }}>
                        {reg.entidad_label && (
                          <div>
                            <span className="font-body text-xs" style={{ color: '#8A8780' }}>Entidad: </span>
                            <span className="font-body text-xs font-medium" style={{ color: '#3A3832' }}>{reg.entidad_label}</span>
                          </div>
                        )}
                        {reg.ip && (
                          <div>
                            <span className="font-body text-xs" style={{ color: '#8A8780' }}>IP: </span>
                            <span className="font-body text-xs font-medium" style={{ color: '#3A3832' }}>{reg.ip}</span>
                          </div>
                        )}
                        {reg.entidad_id && (
                          <div>
                            <span className="font-body text-xs" style={{ color: '#8A8780' }}>ID: </span>
                            <span className="font-body text-xs" style={{ color: '#B0AEA8', fontFamily: 'monospace' }}>
                              {reg.entidad_id}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {paginacion.paginas > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => irPagina(paginacion.pagina - 1)}
              disabled={paginacion.pagina === 1}
              className="p-2 rounded-xl transition-colors disabled:opacity-40"
              style={{ background: '#fff', border: '1px solid #E8E6E3' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              <ChevronLeft size={16} style={{ color: '#56534A' }} />
            </button>

            {[...Array(paginacion.paginas)].map((_, i) => {
              const p = i + 1;
              const activa = p === paginacion.pagina;
              // Mostrar solo páginas cercanas a la actual
              if (p !== 1 && p !== paginacion.paginas && Math.abs(p - paginacion.pagina) > 2) {
                if (p === 2 || p === paginacion.paginas - 1) {
                  return <span key={p} className="font-body text-sm" style={{ color: '#D4D2CC' }}>…</span>;
                }
                return null;
              }
              return (
                <button key={p} onClick={() => irPagina(p)}
                  className="w-9 h-9 rounded-xl font-body text-sm font-medium transition-colors"
                  style={activa
                    ? { background: '#2C2B27', color: '#fff' }
                    : { background: '#fff', color: '#56534A', border: '1px solid #E8E6E3' }
                  }
                  onMouseEnter={e => { if (!activa) e.currentTarget.style.background = '#F7F6F4'; }}
                  onMouseLeave={e => { if (!activa) e.currentTarget.style.background = '#fff'; }}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => irPagina(paginacion.pagina + 1)}
              disabled={paginacion.pagina === paginacion.paginas}
              className="p-2 rounded-xl transition-colors disabled:opacity-40"
              style={{ background: '#fff', border: '1px solid #E8E6E3' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F7F6F4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              <ChevronRight size={16} style={{ color: '#56534A' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
