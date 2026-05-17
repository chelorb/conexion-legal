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
import ConsultasAbogado from './pages/abogado/Consultas';
import Campus           from './pages/abogado/Campus';
import Agenda           from './pages/abogado/Agenda';       // ← NUEVA
import Beneficios       from './pages/abogado/Beneficios';
import Credencial       from './pages/abogado/Credencial';
import Suscripcion      from './pages/abogado/Suscripcion';

// ── Páginas del cliente (requieren auth + rol cliente) ───────
import DashboardCliente from './pages/cliente/Dashboard';
import MisConsultas     from './pages/cliente/MisConsultas';
import NuevaConsulta    from './pages/cliente/NuevaConsulta';

// ── Panel admin (requiere auth + rol admin) ──────────────────
import AdminDashboard   from './pages/admin/Dashboard';
import AdminAbogados    from './pages/admin/Abogados';
import AdminUsuarios    from './pages/admin/Usuarios';
import AdminEventos     from './pages/admin/Eventos';
import AdminCampus     from './pages/admin/Campus';

// ─────────────────────────────────────────────────────────────
// Protección de rutas por autenticación y rol
// ─────────────────────────────────────────────────────────────
function RutaProtegida({ children, rolesPermitidos }) {
  const { estaAutenticado, usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!estaAutenticado) return <Navigate to="/login" replace />;

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    const destinos = { abogado: '/abogado/dashboard', cliente: '/cliente/dashboard', admin: '/admin/dashboard' };
    return <Navigate to={destinos[usuario.rol] || '/'} replace />;
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
          <Route path="/abogado/perfil"      element={<RutaProtegida rolesPermitidos={['abogado']}><PerfilEditar /></RutaProtegida>} />
          <Route path="/abogado/consultas"   element={<RutaProtegida rolesPermitidos={['abogado']}><ConsultasAbogado /></RutaProtegida>} />
          <Route path="/abogado/campus"      element={<RutaProtegida rolesPermitidos={['abogado']}><Campus /></RutaProtegida>} />
          <Route path="/abogado/agenda"      element={<RutaProtegida rolesPermitidos={['abogado']}><Agenda /></RutaProtegida>} />
          <Route path="/abogado/beneficios"  element={<RutaProtegida rolesPermitidos={['abogado']}><Beneficios /></RutaProtegida>} />
          <Route path="/abogado/credencial"  element={<RutaProtegida rolesPermitidos={['abogado']}><Credencial /></RutaProtegida>} />
          <Route path="/abogado/suscripcion" element={<RutaProtegida rolesPermitidos={['abogado']}><Suscripcion /></RutaProtegida>} />

          {/* ── Cliente ───────────────────────────────────── */}
          <Route path="/cliente/dashboard"        element={<RutaProtegida rolesPermitidos={['cliente']}><DashboardCliente /></RutaProtegida>} />
          <Route path="/mis-consultas"            element={<RutaProtegida rolesPermitidos={['cliente']}><MisConsultas /></RutaProtegida>} />
          <Route path="/nueva-consulta/:abogadoId" element={<RutaProtegida rolesPermitidos={['cliente']}><NuevaConsulta /></RutaProtegida>} />

          {/* ── Admin ─────────────────────────────────────── */}
          <Route path="/admin/dashboard" element={<RutaProtegida rolesPermitidos={['admin']}><AdminDashboard /></RutaProtegida>} />
          <Route path="/admin/abogados"  element={<RutaProtegida rolesPermitidos={['admin']}><AdminAbogados /></RutaProtegida>} />
          <Route path="/admin/usuarios"  element={<RutaProtegida rolesPermitidos={['admin']}><AdminUsuarios /></RutaProtegida>} />
          <Route path="/admin/eventos"   element={<RutaProtegida rolesPermitidos={['admin']}><AdminEventos /></RutaProtegida>} />
          <Route path="/admin/campus"    element={<RutaProtegida rolesPermitidos={['admin']}><AdminCampus /></RutaProtegida>} />

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
