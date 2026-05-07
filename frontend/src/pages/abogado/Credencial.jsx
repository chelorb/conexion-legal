// ============================================================
// src/pages/abogado/Credencial.jsx
// Credencial virtual del abogado — identificación digital
// Diseño tipo tarjeta de membresía, descargable e imprimible
// ============================================================

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Shield, Download, Share2, Lock, ArrowRight, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────────────────────────
// Componente: La credencial visual en sí
// Está separada para poder imprimirla / capturarla con html2canvas
// ─────────────────────────────────────────────────────────────
function TarjetaCredencial({ usuario, perfil, codigo }) {
  return (
    // Dimensiones estándar de tarjeta de crédito (proporción 85.6x54mm)
    <div
      id="credencial-visual"
      className="relative w-full max-w-sm mx-auto overflow-hidden"
      style={{ aspectRatio: '1.586 / 1', borderRadius: '16px' }}
    >
      {/* Fondo con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800" />

      {/* Patrón decorativo de fondo */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            rgba(255,255,255,0.05) 20px,
            rgba(255,255,255,0.05) 40px
          )`
        }}
      />

      {/* Círculo decorativo dorado */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-gold-500/20" />
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full border border-gold-500/10" />

      {/* Contenido de la credencial */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">

        {/* Fila superior: logo + plan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <Scale size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">
              Conexión<span className="text-gold-400">Legal</span>
            </span>
          </div>
          {/* Badge de plan */}
          <div className="flex items-center gap-1.5 bg-gold-500/20 border border-gold-500/30 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse-slow" />
            <span className="font-body text-gold-400 text-xs font-medium capitalize">
              {perfil?.plan_nombre || 'Premium'}
            </span>
          </div>
        </div>

        {/* Nombre del abogado */}
        <div>
          <p className="font-body text-white/50 text-xs mb-1 uppercase tracking-widest">
            Miembro verificado
          </p>
          <p className="font-display font-bold text-white text-xl leading-tight">
            {usuario?.nombre} {usuario?.apellido}
          </p>
          {perfil?.especialidades?.length > 0 && (
            <p className="font-body text-white/60 text-xs mt-1">
              {perfil.especialidades.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>

        {/* Fila inferior: código + verificado */}
        <div className="flex items-end justify-between">
          <div>
            {/* Código de credencial */}
            <p className="font-body text-white/30 text-xs uppercase tracking-wider mb-1">
              ID de miembro
            </p>
            <p className="font-mono text-white/80 text-sm tracking-widest">
              {codigo || 'CL-000000'}
            </p>
          </div>
          {/* Sello de verificación */}
          <div className="flex items-center gap-1.5 text-white/60">
            <Shield size={14} className="text-gold-400" />
            <span className="font-body text-xs text-gold-400">Verificado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function Credencial() {
  const { usuario } = useAuth();
  const perfil      = usuario?.perfil_abogado;
  const credencialRef = useRef(null);

  // Verificar si tiene acceso a la credencial
  const tieneCredencial = perfil?.credencial_activa || perfil?.plan_slug === 'premium';

  // Función para compartir / copiar el código
  const compartir = () => {
    const texto = `Mi credencial de Conexión Legal — ${usuario?.nombre} ${usuario?.apellido} | ID: ${perfil?.credencial_codigo || 'CL-000000'}`;
    if (navigator.share) {
      navigator.share({ title: 'Mi credencial Conexión Legal', text: texto });
    } else {
      navigator.clipboard.writeText(texto);
      toast.success('Credencial copiada al portapapeles');
    }
  };

  // Función para descargar (imprime la sección de la credencial)
  const descargar = () => {
    window.print();
    toast('Se abrió el diálogo de impresión. Guardá como PDF para descargar.', { icon: '🖨️' });
  };

  // ── Sin acceso ──────────────────────────────────────────────
  if (!tieneCredencial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={36} className="text-navy-900" />
          </div>
          <h2 className="font-display text-2xl font-bold text-navy-900 mb-3">
            Credencial virtual
          </h2>
          <p className="font-body text-slate-500 mb-6 leading-relaxed">
            La credencial digital exclusiva con identificación de miembro verificado está disponible en el plan Premium.
          </p>
          <Link to="/abogado/suscripcion" className="btn-primary w-full justify-center">
            Ver plan Premium <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-container py-8 max-w-2xl">

        {/* ── Encabezado ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="section-title">Mi credencial virtual</h1>
          <p className="section-subtitle">
            Tu identificación digital como miembro verificado de Conexión Legal.
          </p>
        </div>

        {/* ── La credencial ────────────────────────────────── */}
        <div ref={credencialRef} className="mb-6">
          <TarjetaCredencial
            usuario={usuario}
            perfil={perfil}
            codigo={perfil?.credencial_codigo}
          />
        </div>

        {/* ── Acciones ─────────────────────────────────────── */}
        <div className="flex gap-3 mb-8">
          <button onClick={descargar} className="btn-secondary flex-1 justify-center">
            <Download size={16} /> Descargar / Imprimir
          </button>
          <button onClick={compartir} className="btn-primary flex-1 justify-center">
            <Share2 size={16} /> Compartir
          </button>
        </div>

        {/* ── Info sobre la credencial ─────────────────────── */}
        <div className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-navy-900 text-lg">
            ¿Cómo usar tu credencial?
          </h3>

          <div className="space-y-4">
            {[
              {
                icono: '🏷️',
                titulo: 'Mostrar en comercios adheridos',
                desc: 'Presentá tu credencial (digital o impresa) en los comercios y servicios para acceder a tus descuentos.',
              },
              {
                icono: '💼',
                titulo: 'Identificación profesional',
                desc: 'Usala como identificación digital que certifica tu membresía y verificación en Conexión Legal.',
              },
              {
                icono: '📱',
                titulo: 'Compartir en redes sociales',
                desc: 'Mostrá tu pertenencia a la comunidad de profesionales verificados en tus redes.',
              },
              {
                icono: '🔗',
                titulo: 'Código de miembro único',
                desc: `Tu ID de miembro es ${perfil?.credencial_codigo || 'CL-000000'}. Podés usarlo para verificaciones online.`,
              },
            ].map(({ icono, titulo, desc }) => (
              <div key={titulo} className="flex items-start gap-4">
                <span className="text-2xl shrink-0">{icono}</span>
                <div>
                  <p className="font-body font-semibold text-navy-900 text-sm">{titulo}</p>
                  <p className="font-body text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Beneficios disponibles con la credencial ──────── */}
        <div className="card p-6 mt-4 bg-navy-900 border-0">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} className="text-gold-400" />
            <h3 className="font-body font-semibold text-white">
              Accedé a tus beneficios
            </h3>
          </div>
          <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
            Con tu credencial Premium tenés descuentos en librerías jurídicas, coworkings, confiterías adheridas y más.
          </p>
          <Link to="/abogado/beneficios" className="btn-gold text-sm">
            Ver todos mis beneficios <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
