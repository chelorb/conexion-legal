// ============================================================
// src/App.jsx — Router principal de la aplicación
// Define todas las rutas públicas y protegidas
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Navbar  from './components/layout/Navbar';
import Footer  from './components/layout/Footer';

// ── Páginas públicas ─────────────────────────────────────────
import Inicio          from './pages/Inicio';
import PortalClientes  from './pages/PortalClientes';   // catálogo público
import PortalAbogados  from './pages/PortalAbogados';   // landing abogados
import PerfilAbogado   from './pages/PerfilAbogado';
import Planes          from './pages/Planes';
import Login           from './pages/Login';
import Registro        from './pages/Registro';
import VerificarEmail  from './pages/VerificarEmail';
import ResetPassword   from './pages/ResetPassword';
import PagoExitoso     from './pages/PagoExitoso';

// ── Páginas del abogado (requieren auth + rol abogado) ───────
import DashboardAbogado from './pages/abogado/Dashboard';
import PerfilEditar     from './pages/abogado/PerfilEditar';
import Disponibilidad   from './pages/abogado/Disponibilidad';
import ConsultasAbogado from './pages/abogado/Consultas';
import DetalleConsulta  from './pages/abogado/DetalleConsulta';
import Campus           from './pages/abogado/Campus';
import Agenda           from './pages/abogado/Agenda';
import Foro             from './pages/abogado/Foro';
import ForoCategoria    from './pages/abogado/ForoCategoria';
import ForoHilo         from './pages/abogado/ForoHilo';
import Beneficios       from './pages/abogado/Beneficios';
import Credencial       from './pages/abogado/Credencial';
import Suscripcion      from './pages/abogado/Suscripcion';

// ── Páginas del cliente (requieren auth + rol cliente) ───────
import DashboardCliente from './pages/cliente/Dashboard';
import MisConsultas            from './pages/cliente/MisConsultas';
import DetalleConsultaCliente  from './pages/cliente/DetalleConsulta';
import NuevaConsulta    from './pages/cliente/NuevaConsulta';

// ── Panel admin (requiere auth + rol admin) ──────────────────
import AdminDashboard   from './pages/admin/Dashboard';
import AdminAbogados    from './pages/admin/Abogados';
import AdminUsuarios    from './pages/admin/Usuarios';
import AdminEventos     from './pages/admin/Eventos';
import AdminPlanes      from './pages/admin/Planes';
import AdminComunicado  from './pages/admin/Comunicado';
import AdminCampus     from './pages/admin/Campus';
import AdminLinks      from './pages/admin/Links';

// ─────────────────────────────────────────────────────────────
// Protección de rutas por autenticación y rol
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Pantalla: abogado pendiente de aprobación
// ─────────────────────────────────────────────────────────────
function PantallaPendienteAprobacion() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFED' }}>
      <div className="card p-10 max-w-lg w-full text-center animate-slide-up">

        {/* Ícono animado */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(184,96,48,0.1)' }}>
          <div className="text-5xl animate-pulse-slow">⏳</div>
        </div>

        <h1 className="font-display text-3xl font-bold mb-3" style={{ color: '#1C1B18' }}>
          Perfil en revisión
        </h1>
        <p className="font-body leading-relaxed mb-2" style={{ color: '#56534A' }}>
          Tu cuenta fue creada correctamente. Nuestro equipo está revisando tu perfil profesional y matrícula.
        </p>
        <p className="font-body leading-relaxed mb-8" style={{ color: '#8A8780' }}>
          Este proceso tarda entre <strong>24 y 48 horas hábiles</strong>. Te avisaremos por email cuando esté aprobado.
        </p>

        {/* Pasos */}
        <div className="text-left space-y-4 mb-8">
          {[
            { num: '1', label: 'Verificación de email',       ok: true  },
            { num: '2', label: 'Revisión del perfil y matrícula', ok: false },
            { num: '3', label: 'Aprobación y activación',     ok: false },
          ].map(({ num, label, ok }) => (
            <div key={num} className="flex items-center gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-body font-semibold text-sm"
                style={ok
                  ? { background: 'rgba(22,163,74,0.1)', color: '#16a34a' }
                  : { background: '#F0EFED', color: '#8A8780' }
                }
              >
                {ok ? '✓' : num}
              </div>
              <span className="font-body text-sm" style={{ color: ok ? '#16a34a' : '#56534A' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {/* Mientras espera puede completar su perfil */}
          <p className="font-body text-xs" style={{ color: '#8A8780' }}>
            Mientras tanto, podés preparar tu perfil para cuando sea aprobado.
          </p>
          <button
            onClick={logout}
            className="font-body text-sm transition-colors"
            style={{ color: '#8A8780' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pantalla: abogado rechazado
// ─────────────────────────────────────────────────────────────
function PantallaRechazado({ motivo }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFED' }}>
      <div className="card p-10 max-w-lg w-full text-center animate-slide-up">

        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(220,38,38,0.08)' }}>
          <div className="text-5xl">❌</div>
        </div>

        <h1 className="font-display text-3xl font-bold mb-3" style={{ color: '#1C1B18' }}>
          Perfil no aprobado
        </h1>
        <p className="font-body leading-relaxed mb-6" style={{ color: '#56534A' }}>
          Lamentablemente tu perfil no fue aprobado por nuestro equipo.
        </p>

        {motivo && (
          <div className="rounded-2xl p-5 mb-6 text-left"
            style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <p className="font-body text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: '#dc2626' }}>
              Motivo indicado
            </p>
            <p className="font-body text-sm leading-relaxed" style={{ color: '#3A3832' }}>
              {motivo}
            </p>
          </div>
        )}

        <p className="font-body text-sm mb-8" style={{ color: '#8A8780' }}>
          Si creés que hubo un error o querés apelar la decisión, escribinos a{' '}
          <a href="mailto:info@conexionlegal.com.ar" className="hover:underline" style={{ color: '#B86030' }}>
            info@conexionlegal.com.ar
          </a>
        </p>

        <button
          onClick={logout}
          className="btn-secondary w-full"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function RutaProtegida({ children, rolesPermitidos }) {
  const { estaAutenticado, usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0EFED' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#2C2B27', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!estaAutenticado) return <Navigate to="/login" replace />;

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    const destinos = { abogado: '/abogado/dashboard', cliente: '/mis-consultas', admin: '/admin/dashboard' };
    return <Navigate to={destinos[usuario.rol] || '/'} replace />;
  }

  // ── Si es abogado, verificar estado de aprobación ──────────
  if (usuario.rol === 'abogado') {
    const estado = usuario.perfil_abogado?.estado_aprobacion;

    if (estado === 'pendiente') {
      return <PantallaPendienteAprobacion />;
    }

    if (estado === 'rechazado') {
      return <PantallaRechazado motivo={usuario.perfil_abogado?.motivo_rechazo} />;
    }
  }

  return children;
}

// Rutas solo para no autenticados (login, registro)
function RutaPublicaSolo({ children }) {
  const { estaAutenticado, usuario, cargando } = useAuth();
  if (cargando) return null;
  if (estaAutenticado) {
    const destinos = { abogado: '/abogado/dashboard', cliente: '/cliente/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={destinos[usuario?.rol] || '/'} replace />;
  }
  return children;
}

// ─────────────────────────────────────────────────────────────
// Componente con todas las rutas
// ─────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)]">
        <Routes>
          {/* ── Públicas ──────────────────────────────────── */}
          <Route path="/"                     element={<Inicio />} />
          <Route path="/clientes"             element={<PortalClientes />} />
          <Route path="/para-abogados"        element={<PortalAbogados />} />
          <Route path="/abogados"             element={<PortalClientes />} />  {/* alias */}
          <Route path="/abogados/:id"         element={<PerfilAbogado />} />
          <Route path="/planes"               element={<Planes />} />
          <Route path="/verificar-email"      element={<VerificarEmail />} />
          <Route path="/reset-password"       element={<ResetPassword />} />
          <Route path="/pago/exitoso"         element={<PagoExitoso />} />

          {/* ── Solo no autenticados ──────────────────────── */}
          <Route path="/login"    element={<RutaPublicaSolo><Login /></RutaPublicaSolo>} />
          <Route path="/registro" element={<RutaPublicaSolo><Registro /></RutaPublicaSolo>} />

          {/* ── Abogado ───────────────────────────────────── */}
          <Route path="/abogado/dashboard"   element={<RutaProtegida rolesPermitidos={['abogado']}><DashboardAbogado /></RutaProtegida>} />
          <Route path="/abogado/perfil"          element={<RutaProtegida rolesPermitidos={['abogado']}><PerfilEditar /></RutaProtegida>} />
          <Route path="/abogado/disponibilidad"  element={<RutaProtegida rolesPermitidos={['abogado']}><Disponibilidad /></RutaProtegida>} />
          <Route path="/abogado/consultas"      element={<RutaProtegida rolesPermitidos={['abogado']}><ConsultasAbogado /></RutaProtegida>} />
          <Route path="/abogado/consultas/:id"  element={<RutaProtegida rolesPermitidos={['abogado']}><DetalleConsulta /></RutaProtegida>} />
          <Route path="/abogado/campus"      element={<RutaProtegida rolesPermitidos={['abogado']}><Campus /></RutaProtegida>} />
          <Route path="/abogado/agenda"      element={<RutaProtegida rolesPermitidos={['abogado']}><Agenda /></RutaProtegida>} />
          <Route path="/abogado/foro"        element={<RutaProtegida rolesPermitidos={['abogado']}><Foro /></RutaProtegida>} />
          <Route path="/abogado/foro/:categoriaId" element={<RutaProtegida rolesPermitidos={['abogado']}><ForoCategoria /></RutaProtegida>} />
          <Route path="/abogado/foro/:categoriaId/:hiloId" element={<RutaProtegida rolesPermitidos={['abogado']}><ForoHilo /></RutaProtegida>} />
          <Route path="/abogado/beneficios"  element={<RutaProtegida rolesPermitidos={['abogado']}><Beneficios /></RutaProtegida>} />
          <Route path="/abogado/credencial"  element={<RutaProtegida rolesPermitidos={['abogado']}><Credencial /></RutaProtegida>} />
          <Route path="/abogado/suscripcion" element={<RutaProtegida rolesPermitidos={['abogado']}><Suscripcion /></RutaProtegida>} />

          {/* ── Cliente ───────────────────────────────────── */}
          <Route path="/cliente/dashboard"        element={<RutaProtegida rolesPermitidos={['cliente']}><DashboardCliente /></RutaProtegida>} />
          <Route path="/mis-consultas"      element={<RutaProtegida rolesPermitidos={['cliente']}><MisConsultas /></RutaProtegida>} />
          <Route path="/mis-consultas/:id"  element={<RutaProtegida rolesPermitidos={['cliente']}><DetalleConsultaCliente /></RutaProtegida>} />
          <Route path="/nueva-consulta/:abogadoId" element={<RutaProtegida rolesPermitidos={['cliente']}><NuevaConsulta /></RutaProtegida>} />

          {/* ── Admin ─────────────────────────────────────── */}
          <Route path="/admin/dashboard" element={<RutaProtegida rolesPermitidos={['admin']}><AdminDashboard /></RutaProtegida>} />
          <Route path="/admin/abogados"  element={<RutaProtegida rolesPermitidos={['admin']}><AdminAbogados /></RutaProtegida>} />
          <Route path="/admin/usuarios"  element={<RutaProtegida rolesPermitidos={['admin']}><AdminUsuarios /></RutaProtegida>} />
          <Route path="/admin/eventos"   element={<RutaProtegida rolesPermitidos={['admin']}><AdminEventos /></RutaProtegida>} />
          <Route path="/admin/planes"       element={<RutaProtegida rolesPermitidos={['admin']}><AdminPlanes /></RutaProtegida>} />
          <Route path="/admin/comunicado"   element={<RutaProtegida rolesPermitidos={['admin']}><AdminComunicado /></RutaProtegida>} />
          <Route path="/admin/campus"    element={<RutaProtegida rolesPermitidos={['admin']}><AdminCampus /></RutaProtegida>} />
          <Route path="/admin/links"     element={<RutaProtegida rolesPermitidos={['admin']}><AdminLinks /></RutaProtegida>} />

          {/* ── 404 ───────────────────────────────────────── */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <h1 className="font-display text-6xl font-bold text-navy-900 mb-4">404</h1>
              <p className="text-slate-500 mb-8">La página que buscás no existe.</p>
              <a href="/" className="btn-primary">Volver al inicio</a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: '"DM Sans", sans-serif', fontSize: '14px', borderRadius: '12px' },
            success: { iconTheme: { primary: '#1a2e5a', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
