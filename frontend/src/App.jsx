// ============================================================
// src/App.jsx — Router principal de la aplicación
// Define todas las rutas y protege las que requieren autenticación
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Navbar     from './components/layout/Navbar';
import Footer     from './components/layout/Footer';

// Páginas públicas
import Inicio       from './pages/Inicio';
import Abogados     from './pages/Abogados';
import PerfilAbogado from './pages/PerfilAbogado';
import Planes       from './pages/Planes';
import Login        from './pages/Login';
import Registro     from './pages/Registro';
import VerificarEmail from './pages/VerificarEmail';
import ResetPassword  from './pages/ResetPassword';
import PagoExitoso    from './pages/PagoExitoso';

// Páginas del abogado (requieren auth + rol abogado)
import DashboardAbogado   from './pages/abogado/Dashboard';
import PerfilEditar       from './pages/abogado/PerfilEditar';
import ConsultasAbogado   from './pages/abogado/Consultas';
import Campus             from './pages/abogado/Campus';
import Beneficios         from './pages/abogado/Beneficios';
import Credencial         from './pages/abogado/Credencial';
import Suscripcion        from './pages/abogado/Suscripcion';

// Páginas del cliente (requieren auth + rol cliente)
import DashboardCliente   from './pages/cliente/Dashboard';
import MisConsultas       from './pages/cliente/MisConsultas';
import NuevaConsulta      from './pages/cliente/NuevaConsulta';

// Panel de administración (requiere auth + rol admin)
import AdminDashboard     from './pages/admin/Dashboard';
import AdminAbogados      from './pages/admin/Abogados';
import AdminUsuarios      from './pages/admin/Usuarios';

// ─────────────────────────────────────────────────────────────
// Componentes de protección de rutas
// ─────────────────────────────────────────────────────────────

/**
 * Ruta que requiere estar autenticado con un rol específico
 * Si no está autenticado → redirige al login
 * Si no tiene el rol → redirige a su dashboard correspondiente
 */
function RutaProtegida({ children, rolesPermitidos }) {
  const { estaAutenticado, usuario, cargando } = useAuth();

  // Mientras se verifica el token, no renderizar nada
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    // Redirigir a su dashboard según su rol
    const dashboards = {
      abogado: '/abogado/dashboard',
      cliente: '/cliente/dashboard',
      admin:   '/admin/dashboard',
    };
    return <Navigate to={dashboards[usuario.rol] || '/'} replace />;
  }

  return children;
}

/**
 * Ruta solo accesible si NO está autenticado (login, registro)
 * Si ya está logueado, redirige al dashboard correspondiente
 */
function RutaPublicaSolo({ children }) {
  const { estaAutenticado, usuario, cargando } = useAuth();

  if (cargando) return null;

  if (estaAutenticado) {
    const dashboards = {
      abogado: '/abogado/dashboard',
      cliente: '/cliente/dashboard',
      admin:   '/admin/dashboard',
    };
    return <Navigate to={dashboards[usuario?.rol] || '/'} replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────
// Componente con las rutas
// ─────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)]">
        <Routes>
          {/* ── Rutas públicas ────────────────────────────── */}
          <Route path="/"                element={<Inicio />} />
          <Route path="/abogados"        element={<Abogados />} />
          <Route path="/abogados/:id"    element={<PerfilAbogado />} />
          <Route path="/planes"          element={<Planes />} />
          <Route path="/verificar-email" element={<VerificarEmail />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/pago/exitoso"    element={<PagoExitoso />} />

          {/* ── Solo para no autenticados ─────────────────── */}
          <Route path="/login"    element={<RutaPublicaSolo><Login /></RutaPublicaSolo>} />
          <Route path="/registro" element={<RutaPublicaSolo><Registro /></RutaPublicaSolo>} />

          {/* ── Dashboard del Abogado ─────────────────────── */}
          <Route path="/abogado/dashboard"   element={<RutaProtegida rolesPermitidos={['abogado']}><DashboardAbogado /></RutaProtegida>} />
          <Route path="/abogado/perfil"      element={<RutaProtegida rolesPermitidos={['abogado']}><PerfilEditar /></RutaProtegida>} />
          <Route path="/abogado/consultas"   element={<RutaProtegida rolesPermitidos={['abogado']}><ConsultasAbogado /></RutaProtegida>} />
          <Route path="/abogado/campus"      element={<RutaProtegida rolesPermitidos={['abogado']}><Campus /></RutaProtegida>} />
          <Route path="/abogado/beneficios"  element={<RutaProtegida rolesPermitidos={['abogado']}><Beneficios /></RutaProtegida>} />
          <Route path="/abogado/credencial"  element={<RutaProtegida rolesPermitidos={['abogado']}><Credencial /></RutaProtegida>} />
          <Route path="/abogado/suscripcion" element={<RutaProtegida rolesPermitidos={['abogado']}><Suscripcion /></RutaProtegida>} />

          {/* ── Dashboard del Cliente ─────────────────────── */}
          <Route path="/cliente/dashboard"   element={<RutaProtegida rolesPermitidos={['cliente']}><DashboardCliente /></RutaProtegida>} />
          <Route path="/mis-consultas"       element={<RutaProtegida rolesPermitidos={['cliente']}><MisConsultas /></RutaProtegida>} />
          <Route path="/nueva-consulta/:abogadoId" element={<RutaProtegida rolesPermitidos={['cliente']}><NuevaConsulta /></RutaProtegida>} />

          {/* ── Panel de Administración ───────────────────── */}
          <Route path="/admin/dashboard" element={<RutaProtegida rolesPermitidos={['admin']}><AdminDashboard /></RutaProtegida>} />
          <Route path="/admin/abogados"  element={<RutaProtegida rolesPermitidos={['admin']}><AdminAbogados /></RutaProtegida>} />
          <Route path="/admin/usuarios"  element={<RutaProtegida rolesPermitidos={['admin']}><AdminUsuarios /></RutaProtegida>} />

          {/* ── 404 ──────────────────────────────────────── */}
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

// ─────────────────────────────────────────────────────────────
// App raíz — envuelve todo en los providers
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Sistema de notificaciones toast (éxito, error, etc.) */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: '"DM Sans", sans-serif',
              fontSize:   '14px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#1a2e5a', secondary: '#fff' }
            },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
