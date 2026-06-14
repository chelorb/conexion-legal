// ============================================================
// src/components/BotonWhatsAppComunidad.jsx
// Botón reutilizable para solicitar unirse al grupo de WhatsApp
// Se usa en: Dashboard del abogado, Foro, Perfil del abogado
// ============================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Ícono SVG de WhatsApp (no está en lucide-react)
function IconoWhatsApp({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Variantes de tamaño para usar en distintos contextos
// tamaño: 'normal' | 'compacto' | 'banner'
// ─────────────────────────────────────────────────────────────
export default function BotonWhatsAppComunidad({ tamano = 'normal' }) {
  const { usuario } = useAuth();
  const [numeroAdmin, setNumeroAdmin] = useState('');
  const [cargando,    setCargando]    = useState(true);

  // Cargar número del admin desde la config pública
  useEffect(() => {
    api.get('/config/publica')
      .then(r => setNumeroAdmin(r.data.config?.whatsapp_admin || ''))
      .catch(() => {}) // Si falla, simplemente no mostramos el botón
      .finally(() => setCargando(false));
  }, []);

  // No mostrar si no hay número configurado o está cargando
  if (cargando || !numeroAdmin) return null;

  // Mensaje prehecho que se envía al admin
  const mensaje = encodeURIComponent(
    `Hola! Soy ${usuario?.nombre} ${usuario?.apellido}, abogado registrado en IUSTIXIUM. ` +
    `Me gustaría unirme al grupo de WhatsApp de la comunidad. ` +
    `Mi email de registro es: ${usuario?.email}. ¡Gracias!`
  );

  const urlWhatsApp = `https://wa.me/${numeroAdmin}?text=${mensaje}`;

  // ── Variante banner (más llamativo, para el dashboard) ──
  if (tamano === 'banner') {
    return (
      <a
        href={urlWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-5 rounded-2xl transition-all group"
        style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.14)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.08)'; }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#25D366', color: '#fff' }}>
          <IconoWhatsApp size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-sm" style={{ color: '#1C1B18' }}>
            Grupo de WhatsApp de la comunidad
          </p>
          <p className="font-body text-xs mt-0.5" style={{ color: '#56534A' }}>
            Pedí acceso y conectate con otros abogados
          </p>
        </div>
        <div className="shrink-0 px-4 py-2 rounded-xl font-body text-sm font-semibold text-white transition-colors"
          style={{ background: '#25D366' }}>
          Unirme
        </div>
      </a>
    );
  }

  // ── Variante compacto (para el foro) ─────────────────────
  if (tamano === 'compacto') {
    return (
      <a
        href={urlWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold text-white transition-all"
        style={{ background: '#25D366' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1da851'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#25D366'; }}
      >
        <IconoWhatsApp size={16} />
        Pedir acceso al grupo
      </a>
    );
  }

  // ── Variante normal (default) ─────────────────────────────
  return (
    <a
      href={urlWhatsApp}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm font-semibold text-white transition-all w-full justify-center"
      style={{ background: '#25D366' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#1da851'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#25D366'; }}
    >
      <IconoWhatsApp size={18} />
      Pedir acceso al grupo de WhatsApp
    </a>
  );
}
