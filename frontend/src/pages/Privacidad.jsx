// ============================================================
// src/pages/Privacidad.jsx
// Política de privacidad — IUSTIXIUM
// Redactada conforme a la Ley 25.326 de Protección de Datos
// Personales de la República Argentina
// ============================================================

import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const ULTIMA_ACTUALIZACION = '15 de junio de 2025';

function Seccion({ numero, titulo, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-display font-bold text-xl mb-4 flex items-baseline gap-2"
        style={{ color: '#1C1B18' }}>
        <span style={{ color: '#B86030' }}>{numero}.</span> {titulo}
      </h2>
      <div className="font-body text-sm leading-relaxed space-y-3" style={{ color: '#56534A' }}>
        {children}
      </div>
    </section>
  );
}

function TablaItem({ dato, uso }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-3 border-b last:border-0"
      style={{ borderColor: '#F0EFED' }}>
      <span className="font-body text-sm font-medium" style={{ color: '#1C1B18' }}>{dato}</span>
      <span className="font-body text-sm" style={{ color: '#56534A' }}>{uso}</span>
    </div>
  );
}

export default function Privacidad() {
  return (
    <div className="min-h-screen" style={{ background: '#F0EFED' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0A0908 0%, #2C2B27 100%)' }}>
        <div className="page-container py-12 max-w-3xl">
          <Link to="/"
            className="inline-flex items-center gap-2 text-sm font-body mb-8 transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: '#B86030' }}>IUSTIXIUM</p>
              <h1 className="font-display font-bold text-3xl text-white">
                Política de privacidad
              </h1>
            </div>
          </div>
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Última actualización: {ULTIMA_ACTUALIZACION}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="page-container py-12 max-w-3xl">
        <div className="card p-8 md:p-12">

          {/* Intro */}
          <div className="rounded-2xl p-5 mb-10"
            style={{ background: 'rgba(184,96,48,0.06)', border: '1px solid rgba(184,96,48,0.15)' }}>
            <p className="font-body text-sm leading-relaxed" style={{ color: '#56534A' }}>
              En IUSTIXIUM nos tomamos muy en serio la privacidad de nuestros usuarios. Esta política
              describe qué datos recopilamos, cómo los usamos y cuáles son tus derechos, de conformidad
              con la <strong>Ley 25.326 de Protección de Datos Personales</strong> de la República Argentina
              y sus normas reglamentarias.
            </p>
          </div>

          <Seccion numero="1" titulo="Responsable del tratamiento de datos">
            <p>
              El responsable del tratamiento de los datos personales recopilados a través de la
              plataforma IUSTIXIUM es la empresa titular de la misma, con domicilio en la
              Ciudad Autónoma de Buenos Aires, República Argentina.
            </p>
            <p>
              Para consultas relacionadas con el tratamiento de tus datos, podés contactarnos en:{' '}
              <a href="mailto:adminiustixium@gmail.com" className="hover:underline font-medium"
                style={{ color: '#B86030' }}>
                adminiustixium@gmail.com
              </a>
            </p>
          </Seccion>

          <Seccion numero="2" titulo="Datos que recopilamos">
            <p>Recopilamos los siguientes datos según el tipo de usuario:</p>

            <p className="font-semibold mt-4 mb-2" style={{ color: '#1C1B18' }}>
              Para todos los usuarios:
            </p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#F0EFED' }}>
              <div className="grid grid-cols-2 gap-4 px-4 py-2"
                style={{ background: '#F7F6F4' }}>
                <span className="font-body text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#8A8780' }}>Dato</span>
                <span className="font-body text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#8A8780' }}>Finalidad</span>
              </div>
              <div className="px-4">
                <TablaItem dato="Nombre y apellido"       uso="Identificación y personalización" />
                <TablaItem dato="Dirección de email"      uso="Acceso, notificaciones y comunicaciones" />
                <TablaItem dato="Contraseña (encriptada)" uso="Autenticación segura" />
                <TablaItem dato="Número de teléfono"      uso="Contacto y verificación (opcional)" />
                <TablaItem dato="Dirección IP"            uso="Seguridad, detección de fraudes y rate limiting" />
              </div>
            </div>

            <p className="font-semibold mt-6 mb-2" style={{ color: '#1C1B18' }}>
              Datos adicionales para abogados registrados:
            </p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#F0EFED' }}>
              <div className="grid grid-cols-2 gap-4 px-4 py-2"
                style={{ background: '#F7F6F4' }}>
                <span className="font-body text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#8A8780' }}>Dato</span>
                <span className="font-body text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#8A8780' }}>Finalidad</span>
              </div>
              <div className="px-4">
                <TablaItem dato="Matrícula profesional"       uso="Verificación de habilitación para ejercer" />
                <TablaItem dato="CUIL"                        uso="Identificación fiscal y verificación de identidad" />
                <TablaItem dato="Título universitario"        uso="Acreditación de formación académica" />
                <TablaItem dato="Documentos (título, CUIL)"   uso="Verificación del perfil profesional" />
                <TablaItem dato="Foto de perfil"              uso="Presentación pública en la plataforma" />
                <TablaItem dato="Ciudad y provincia"          uso="Visibilidad geográfica en búsquedas" />
                <TablaItem dato="Especialidades y descripción" uso="Presentación del perfil profesional" />
              </div>
            </div>
          </Seccion>

          <Seccion numero="3" titulo="Cómo usamos tus datos">
            <p>Utilizamos los datos recopilados para:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Crear y gestionar tu cuenta en la plataforma.</li>
              <li>Facilitar la conexión entre clientes y abogados.</li>
              <li>Verificar la identidad y habilitación profesional de los abogados.</li>
              <li>Enviar notificaciones relacionadas con el uso de la plataforma (nuevas consultas, mensajes, aprobación de perfil).</li>
              <li>Mejorar la seguridad de la plataforma y prevenir fraudes.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
            <p>
              <strong>No utilizamos tus datos para publicidad de terceros ni los vendemos a ninguna empresa.</strong>
            </p>
          </Seccion>

          <Seccion numero="4" titulo="Terceros que acceden a tus datos">
            <p>
              Para operar la plataforma, utilizamos los siguientes servicios de terceros que pueden
              tener acceso a parte de tus datos:
            </p>
            <div className="space-y-3 mt-3">
              {[
                {
                  nombre: 'SendGrid (Twilio)',
                  uso: 'Envío de emails transaccionales (verificación, notificaciones, alertas).',
                  link: 'https://sendgrid.com/policies/privacy/',
                },
                {
                  nombre: 'Cloudinary',
                  uso: 'Almacenamiento y gestión de imágenes de perfil y documentos subidos por abogados.',
                  link: 'https://cloudinary.com/privacy',
                },
                {
                  nombre: 'Neon (PostgreSQL)',
                  uso: 'Base de datos donde se almacena toda la información de la plataforma.',
                  link: 'https://neon.tech/privacy-policy',
                },
                {
                  nombre: 'Render',
                  uso: 'Alojamiento del servidor backend de la plataforma.',
                  link: 'https://render.com/privacy',
                },
                {
                  nombre: 'Vercel',
                  uso: 'Alojamiento del frontend (interfaz web) de la plataforma.',
                  link: 'https://vercel.com/legal/privacy-policy',
                },
                {
                  nombre: 'hCaptcha',
                  uso: 'Verificación de que los registros provienen de personas humanas (anti-bots).',
                  link: 'https://www.hcaptcha.com/privacy',
                },
              ].map(({ nombre, uso, link }) => (
                <div key={nombre} className="rounded-xl p-4" style={{ background: '#F7F6F4' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-body font-semibold text-sm mb-0.5" style={{ color: '#1C1B18' }}>
                        {nombre}
                      </p>
                      <p className="font-body text-xs" style={{ color: '#56534A' }}>{uso}</p>
                    </div>
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      className="font-body text-xs shrink-0 hover:underline"
                      style={{ color: '#B86030' }}>
                      Ver política →
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <p>
              Todos estos proveedores están contractualmente obligados a proteger tus datos y solo
              pueden usarlos para los fines indicados.
            </p>
          </Seccion>

          <Seccion numero="5" titulo="Almacenamiento y seguridad">
            <p>
              Tus datos se almacenan en servidores seguros ubicados fuera del territorio argentino
              (Estados Unidos), gestionados por los proveedores mencionados en la sección anterior.
              Al usar la plataforma, aceptás esta transferencia internacional de datos conforme
              al artículo 12 de la Ley 25.326.
            </p>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos, incluyendo:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Encriptación de contraseñas con bcrypt.</li>
              <li>Comunicaciones cifradas mediante HTTPS/TLS.</li>
              <li>Autenticación mediante tokens JWT con expiración.</li>
              <li>Limitación de intentos de acceso (rate limiting).</li>
              <li>Acceso restringido a los datos según rol de usuario.</li>
            </ul>
          </Seccion>

          <Seccion numero="6" titulo="Retención de datos">
            <p>
              Conservamos tus datos mientras tu cuenta esté activa en la plataforma. Si solicitás
              la eliminación de tu cuenta, procederemos a eliminar o anonimizar tus datos personales
              en un plazo máximo de 30 días, salvo que exista una obligación legal que requiera
              su conservación por un período mayor.
            </p>
          </Seccion>

          <Seccion numero="7" titulo="Tus derechos">
            <p>
              De acuerdo con la Ley 25.326 y su reglamentación, tenés derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Acceso:</strong> conocer qué datos tuyos tenemos almacenados.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o desactualizados.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos (derecho al olvido).</li>
              <li><strong>Confidencialidad:</strong> que tus datos no sean cedidos a terceros sin tu consentimiento, salvo las excepciones previstas por ley.</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, escribinos a{' '}
              <a href="mailto:adminiustixium@gmail.com" className="hover:underline font-medium"
                style={{ color: '#B86030' }}>
                adminiustixium@gmail.com
              </a>{' '}
              indicando tu nombre completo, email de registro y la acción que querés realizar.
              Responderemos dentro de los 5 días hábiles.
            </p>
            <p>
              También podés presentar una denuncia ante la{' '}
              <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer"
                className="hover:underline" style={{ color: '#B86030' }}>
                Agencia de Acceso a la Información Pública (AAIP)
              </a>
              , organismo de control en materia de protección de datos personales en Argentina.
            </p>
          </Seccion>

          <Seccion numero="8" titulo="Cookies y tecnologías similares">
            <p>
              La plataforma utiliza almacenamiento local del navegador (localStorage) para mantener
              tu sesión activa y recordar tus preferencias. No utilizamos cookies de seguimiento
              ni de publicidad de terceros.
            </p>
          </Seccion>

          <Seccion numero="9" titulo="Cambios en esta política">
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos
              cualquier cambio significativo por email y/o mediante un aviso en la plataforma
              con al menos 15 días de anticipación. El uso continuado de la plataforma tras
              la notificación implica la aceptación de los cambios.
            </p>
          </Seccion>

          {/* Footer del doc */}
          <div className="pt-8 mt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: '#F0EFED' }}>
            <p className="font-body text-xs" style={{ color: '#B0AEA8' }}>
              © {new Date().getFullYear()} IUSTIXIUM. Todos los derechos reservados.
            </p>
            <Link to="/terminos" className="font-body text-xs hover:underline"
              style={{ color: '#B86030' }}>
              Ver términos y condiciones →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
