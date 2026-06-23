// ============================================================
// src/context/AuthContext.jsx
// Estado global de autenticación accesible desde cualquier componente
// Usa React Context + localStorage para persistir la sesión
//
// SEGURIDAD — Cierre automático por inactividad:
//   - El JWT dura 8h (configurado en el backend con JWT_EXPIRES_IN=8h)
//   - Si el usuario no interactúa durante TIEMPO_INACTIVIDAD_MS (30 min),
//     se muestra un modal de aviso con TIEMPO_AVISO_MS (2 min) para extender
//   - Si no responde en esos 2 minutos, se cierra la sesión automáticamente
//   - Cualquier evento del mouse/teclado/scroll reinicia el contador
//
// NOTA: AuthProvider está montado FUERA del BrowserRouter (ver App.jsx),
// por eso se usa window.location.href para los redirects en lugar de useNavigate.
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import api from '../services/api';

// ── Constantes de tiempo (en milisegundos) ──────────────────
const TIEMPO_INACTIVIDAD_MS = 30 * 60 * 1000; // 30 minutos sin actividad → mostrar aviso
const TIEMPO_AVISO_MS       =  2 * 60 * 1000; //  2 minutos para responder antes de cerrar

// Crear el contexto de autenticación
const AuthContext = createContext(null);

/**
 * Provider que envuelve toda la app y provee el estado de auth
 * Uso: <AuthProvider><App /></AuthProvider>
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario]           = useState(null);
  const [cargando, setCargando]         = useState(true);  // true mientras verifica el token guardado
  const [mostrarAviso, setMostrarAviso] = useState(false); // controla el modal de aviso de expiración
  const [segundosAviso, setSegundosAviso] = useState(TIEMPO_AVISO_MS / 1000);

  // Referencias a los timers para poder cancelarlos/reiniciarlos
  const timerInactividad  = useRef(null);
  const timerCierre       = useRef(null);
  const timerIntervalo    = useRef(null); // intervalo de la cuenta regresiva visual
  const segundosRef       = useRef(TIEMPO_AVISO_MS / 1000); // copia en ref para el intervalo

  // ── Cierre de sesión ────────────────────────────────────────
  /**
   * Limpia todos los timers, el estado y el localStorage,
   * y redirige al login con el motivo del cierre.
   * @param {string} motivo - 'inactividad' | 'expirado' | 'manual'
   */
  const cerrarSesion = useCallback((motivo = 'manual') => {
    // Cancelar todos los timers pendientes
    clearTimeout(timerInactividad.current);
    clearTimeout(timerCierre.current);
    clearInterval(timerIntervalo.current);

    // Limpiar estado y storage
    localStorage.removeItem('cl_token');
    localStorage.removeItem('cl_usuario');
    setUsuario(null);
    setMostrarAviso(false);

    // Redirigir con el motivo para mostrar el mensaje correcto en Login.jsx
    // Usamos window.location porque AuthProvider está fuera del BrowserRouter
    if (motivo === 'inactividad') {
      window.location.href = '/login?sesion_cerrada=inactividad';
    } else if (motivo === 'expirado') {
      window.location.href = '/login?sesion_expirada=1';
    } else {
      window.location.href = '/login';
    }
  }, []);

  // ── Lógica de inactividad ───────────────────────────────────
  /**
   * Cancela los timers actuales y los reinicia desde cero.
   * Se llama al montar el efecto de actividad y cada vez que el usuario hace algo.
   */
  const reiniciarTimers = useCallback(() => {
    // Solo activar si hay sesión abierta
    if (!localStorage.getItem('cl_token')) return;

    clearTimeout(timerInactividad.current);
    clearTimeout(timerCierre.current);
    clearInterval(timerIntervalo.current);
    setMostrarAviso(false);

    // Timer 1: después de 30 min sin actividad, mostrar el modal de aviso
    timerInactividad.current = setTimeout(() => {
      // Inicializar la cuenta regresiva
      segundosRef.current = TIEMPO_AVISO_MS / 1000;
      setSegundosAviso(TIEMPO_AVISO_MS / 1000);
      setMostrarAviso(true);

      // Actualizar la cuenta regresiva cada segundo
      timerIntervalo.current = setInterval(() => {
        segundosRef.current -= 1;
        setSegundosAviso(segundosRef.current);
        if (segundosRef.current <= 0) {
          clearInterval(timerIntervalo.current);
        }
      }, 1000);

      // Timer 2: si no responde en 2 min, cerrar la sesión por inactividad
      timerCierre.current = setTimeout(() => {
        cerrarSesion('inactividad');
      }, TIEMPO_AVISO_MS);

    }, TIEMPO_INACTIVIDAD_MS);
  }, [cerrarSesion]);

  /**
   * El usuario hizo click en "Seguir conectado" en el modal de aviso.
   * Cancela el cierre inminente y reinicia los timers.
   */
  const extenderSesion = useCallback(() => {
    clearTimeout(timerCierre.current);
    clearInterval(timerIntervalo.current);
    setMostrarAviso(false);
    reiniciarTimers();
  }, [reiniciarTimers]);

  // ── Registro de eventos de actividad del usuario ────────────
  useEffect(() => {
    if (!usuario) {
      // Si no hay sesión, cancelar todos los timers por las dudas
      clearTimeout(timerInactividad.current);
      clearTimeout(timerCierre.current);
      clearInterval(timerIntervalo.current);
      return;
    }

    // Eventos que demuestran que el usuario está activo
    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttle manual: reiniciar el timer como máximo una vez cada 10 segundos
    // Evita el costo de reiniciar en cada movimiento del mouse
    let ultimaActividad = 0;
    const manejarActividad = () => {
      const ahora = Date.now();
      if (ahora - ultimaActividad < 10_000) return;
      ultimaActividad = ahora;
      reiniciarTimers();
    };

    eventos.forEach(e => window.addEventListener(e, manejarActividad, { passive: true }));
    reiniciarTimers(); // Iniciar los timers al abrir sesión

    return () => {
      // Cleanup: remover listeners y cancelar timers al cerrar sesión o desmontar
      eventos.forEach(e => window.removeEventListener(e, manejarActividad));
      clearTimeout(timerInactividad.current);
      clearTimeout(timerCierre.current);
      clearInterval(timerIntervalo.current);
    };
  }, [usuario, reiniciarTimers]);

  // ── Verificación de token al iniciar la app ─────────────────
  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem('cl_token');

      if (!token) {
        setCargando(false);
        return;
      }

      try {
        // Verificar que el token siga siendo válido con el servidor
        const { data } = await api.get('/auth/me');
        setUsuario(data.usuario);
      } catch {
        // Token inválido o expirado: limpiar localStorage
        localStorage.removeItem('cl_token');
        localStorage.removeItem('cl_usuario');
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, []);

  // ── Funciones de autenticación ──────────────────────────────
  /**
   * Inicia sesión: guarda token y datos del usuario en localStorage
   */
  const login = useCallback((token, datosUsuario) => {
    localStorage.setItem('cl_token', token);
    localStorage.setItem('cl_usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  }, []);

  /**
   * Cierra sesión manualmente (botón "Cerrar sesión" del Navbar)
   */
  const logout = useCallback(() => {
    cerrarSesion('manual');
  }, [cerrarSesion]);

  /**
   * Actualiza datos del usuario sin hacer logout
   * Útil cuando el usuario actualiza su perfil
   */
  const actualizarUsuario = useCallback((nuevosDatos) => {
    const usuarioActualizado = { ...usuario, ...nuevosDatos };
    localStorage.setItem('cl_usuario', JSON.stringify(usuarioActualizado));
    setUsuario(usuarioActualizado);
  }, [usuario]);

  // Helpers de rol para simplificar las condiciones en los componentes
  const esAdmin         = usuario?.rol === 'admin';
  const esAbogado       = usuario?.rol === 'abogado';
  const esCliente       = usuario?.rol === 'cliente';
  const estaAutenticado = !!usuario;

  const valor = {
    usuario,
    cargando,
    estaAutenticado,
    esAdmin,
    esAbogado,
    esCliente,
    login,
    logout,
    actualizarUsuario,
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}

      {/* ── Modal de aviso de inactividad ──────────────────────
          Se muestra 2 minutos antes de cerrar la sesión.
          Overlay oscuro + card centrada con cuenta regresiva.
          z-[9999] para estar por encima de cualquier modal de la app.
      ────────────────────────────────────────────────────── */}
      {mostrarAviso && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          aria-modal="true"
          role="alertdialog"
          aria-label="Aviso: tu sesión está por cerrarse"
        >
          <div
            className="w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center animate-slide-up"
            style={{ background: '#FAFAF8', border: '1px solid rgba(44,43,39,0.1)' }}
          >
            {/* Ícono de reloj */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(184,96,48,0.1)' }}
            >
              <svg
                width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#B86030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <h2
              className="font-display text-xl font-bold mb-2"
              style={{ color: '#1C1B18' }}
            >
              ¿Seguís ahí?
            </h2>

            <p className="font-body text-sm mb-1" style={{ color: '#56534A' }}>
              Por seguridad, tu sesión se cerrará en
            </p>

            {/* Cuenta regresiva minutos:segundos */}
            <p
              className="font-display text-5xl font-bold my-4 tabular-nums"
              style={{ color: '#B86030' }}
            >
              {String(Math.floor(segundosAviso / 60)).padStart(2, '0')}
              :
              {String(segundosAviso % 60).padStart(2, '0')}
            </p>

            <p className="font-body text-xs mb-6" style={{ color: '#8A8780' }}>
              Tu información está protegida. Hacé click abajo para seguir trabajando.
            </p>

            {/* Botones */}
            <div className="flex flex-col gap-3">
              <button
                onClick={extenderSesion}
                className="w-full py-3.5 rounded-xl font-body font-medium text-sm text-white transition-colors"
                style={{ background: '#2C2B27' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1C1B18'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2C2B27'; }}
              >
                Seguir conectado
              </button>

              <button
                onClick={() => cerrarSesion('manual')}
                className="w-full py-2 rounded-xl font-body text-sm transition-colors"
                style={{ color: '#8A8780' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1C1B18'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8A8780'; }}
              >
                Cerrar sesión ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar el contexto de autenticación en cualquier componente
 * Uso: const { usuario, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
