// ============================================================
// src/pages/Terminos.jsx
// Términos y condiciones de uso — IUSTIXIUM
// ============================================================

import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';

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

export default function Terminos() {
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
              <Scale size={22} className="text-white" />
            </div>
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: '#B86030' }}>IUSTIXIUM</p>
              <h1 className="font-display font-bold text-3xl text-white">
                Términos y condiciones
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
              Al acceder o utilizar la plataforma IUSTIXIUM, ya sea como visitante, cliente o abogado registrado,
              aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna de las
              condiciones aquí establecidas, te pedimos que no utilices la plataforma.
            </p>
          </div>

          <Seccion numero="1" titulo="Descripción del servicio">
            <p>
              IUSTIXIUM es una plataforma digital de intermediación que conecta a personas que necesitan
              asesoramiento legal (clientes) con abogados matriculados y verificados que ofrecen sus servicios
              profesionales de forma online y/o presencial.
            </p>
            <p>
              IUSTIXIUM <strong>no presta servicios jurídicos</strong> ni ejerce la abogacía. La plataforma
              actúa exclusivamente como intermediaria tecnológica. Toda la responsabilidad por el contenido
              del asesoramiento legal brindado recae exclusivamente en el profesional contratado.
            </p>
            <p>
              El uso de la plataforma no genera una relación cliente-abogado con IUSTIXIUM ni con sus
              representantes.
            </p>
          </Seccion>

          <Seccion numero="2" titulo="Registro y cuentas de usuario">
            <p>
              Para acceder a las funcionalidades de la plataforma, es necesario crear una cuenta. El usuario
              se compromete a proporcionar información veraz, completa y actualizada al momento del registro
              y durante el uso de la plataforma.
            </p>
            <p>
              Cada usuario es responsable de mantener la confidencialidad de sus credenciales de acceso
              (email y contraseña). IUSTIXIUM no será responsable por accesos no autorizados derivados de
              la negligencia del usuario en la custodia de sus datos de acceso.
            </p>
            <p>
              IUSTIXIUM se reserva el derecho de suspender o eliminar cuentas que incumplan estos términos,
              que proporcionen información falsa o que realicen actividades que perjudiquen a otros usuarios
              o a la plataforma.
            </p>
          </Seccion>

          <Seccion numero="3" titulo="Registro de abogados">
            <p>
              Los profesionales que deseen ofrecer sus servicios a través de IUSTIXIUM deben registrarse
              como abogados, proporcionar su matrícula profesional vigente y documentación que acredite su
              habilitación para ejercer la profesión en la República Argentina.
            </p>
            <p>
              El equipo de IUSTIXIUM verificará la información proporcionada antes de aprobar el perfil.
              La aprobación no implica aval o recomendación por parte de IUSTIXIUM respecto a la calidad
              o idoneidad del profesional.
            </p>
            <p>
              El abogado registrado es el único responsable del contenido de su perfil, de la veracidad
              de la información publicada y de la calidad del servicio prestado a los clientes.
            </p>
          </Seccion>

          <Seccion numero="4" titulo="Uso del foro de la comunidad">
            <p>
              IUSTIXIUM pone a disposición de los abogados registrados un foro interno de debate y
              colaboración profesional. Al participar en el foro, los usuarios se comprometen a:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Mantener un lenguaje respetuoso y profesional.</li>
              <li>No publicar información confidencial de clientes ni datos de terceros sin su consentimiento.</li>
              <li>No utilizar el foro con fines de publicidad o promoción comercial no autorizada.</li>
              <li>No difundir contenido falso, engañoso, difamatorio o que viole derechos de terceros.</li>
            </ul>
            <p>
              IUSTIXIUM se reserva el derecho de moderar, editar o eliminar contenidos que incumplan estas
              pautas, y de suspender el acceso al foro a usuarios que reincidan en conductas inapropiadas.
            </p>
          </Seccion>

          <Seccion numero="5" titulo="Conducta del usuario">
            <p>Queda expresamente prohibido en la plataforma:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Publicar o transmitir contenido ilegal, ofensivo, difamatorio o que viole derechos de terceros.</li>
              <li>Suplantar la identidad de otras personas o instituciones.</li>
              <li>Utilizar bots, scrapers u otras herramientas automatizadas para acceder o extraer información.</li>
              <li>Intentar vulnerar la seguridad o integridad de la plataforma.</li>
              <li>Utilizar la plataforma para fines distintos a los establecidos en estos términos.</li>
            </ul>
          </Seccion>

          <Seccion numero="6" titulo="Propiedad intelectual">
            <p>
              Todo el contenido de la plataforma IUSTIXIUM — incluyendo el nombre, logotipo, diseño,
              textos, imágenes y código fuente — es propiedad exclusiva de IUSTIXIUM o de sus licenciantes
              y está protegido por las leyes de propiedad intelectual de la República Argentina.
            </p>
            <p>
              El usuario no podrá reproducir, distribuir, modificar o utilizar dicho contenido sin
              autorización expresa y por escrito de IUSTIXIUM.
            </p>
            <p>
              Los abogados conservan la propiedad intelectual del contenido que publican en sus perfiles
              y en el foro, pero otorgan a IUSTIXIUM una licencia no exclusiva para mostrarlo dentro
              de la plataforma.
            </p>
          </Seccion>

          <Seccion numero="7" titulo="Limitación de responsabilidad">
            <p>
              IUSTIXIUM no garantiza la exactitud, completitud o idoneidad del contenido publicado por
              los usuarios ni la calidad de los servicios ofrecidos por los abogados registrados.
            </p>
            <p>
              IUSTIXIUM no será responsable por daños directos, indirectos, incidentales o consecuentes
              derivados del uso de la plataforma, de los servicios contratados a través de ella o de
              la interrupción del servicio por causas ajenas a su control.
            </p>
            <p>
              La relación contractual por la prestación de servicios legales se establece exclusivamente
              entre el cliente y el abogado. IUSTIXIUM no es parte de dicha relación.
            </p>
          </Seccion>

          <Seccion numero="8" titulo="Modificaciones">
            <p>
              IUSTIXIUM se reserva el derecho de modificar estos Términos y Condiciones en cualquier
              momento. Los cambios serán notificados a los usuarios registrados por email y/o mediante
              un aviso destacado en la plataforma.
            </p>
            <p>
              El uso continuado de la plataforma tras la notificación de cambios implica la aceptación
              de los nuevos términos.
            </p>
          </Seccion>

          <Seccion numero="9" titulo="Ley aplicable y jurisdicción">
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la República Argentina.
              Para cualquier controversia derivada del uso de la plataforma, las partes se someten
              a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires,
              con renuncia expresa a cualquier otro fuero o jurisdicción que pudiera corresponderles.
            </p>
          </Seccion>

          <Seccion numero="10" titulo="Contacto">
            <p>
              Para consultas sobre estos Términos y Condiciones, podés escribirnos a:{' '}
              <a href="mailto:adminiustixium@gmail.com" className="hover:underline font-medium"
                style={{ color: '#B86030' }}>
                adminiustixium@gmail.com
              </a>
            </p>
          </Seccion>

          {/* Footer del doc */}
          <div className="pt-8 mt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: '#F0EFED' }}>
            <p className="font-body text-xs" style={{ color: '#B0AEA8' }}>
              © {new Date().getFullYear()} IUSTIXIUM. Todos los derechos reservados.
            </p>
            <Link to="/privacidad" className="font-body text-xs hover:underline"
              style={{ color: '#B86030' }}>
              Ver política de privacidad →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
