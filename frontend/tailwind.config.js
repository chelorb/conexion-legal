/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ─── Paleta de colores de Conexión Legal ───────────────
      colors: {
        // Azul marino oscuro — color principal (confianza, profesionalismo)
        navy: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c2d0ff',
          300: '#9db1ff',
          400: '#7589ff',
          500: '#4f63f7',
          600: '#3344ec',
          700: '#2630d9',
          800: '#2228b0',
          900: '#1a2e5a',  // ← Color principal de la marca
          950: '#0f1a3d',
        },
        // Dorado — acento premium
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#c9a227',  // ← Acento premium
          600: '#a78220',
        },
        // Grises neutros para textos y fondos
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },

      // ─── Tipografía ─────────────────────────────────────────
      fontFamily: {
        // Títulos: serio, clásico, con carácter legal
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        // Cuerpo: legible, moderno, profesional
        body:    ['"DM Sans"', '"Helvetica Neue"', 'sans-serif'],
        // Monoespaciado para códigos, credenciales
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      // ─── Sombras personalizadas ─────────────────────────────
      boxShadow: {
        'card':    '0 2px 16px 0 rgba(26, 46, 90, 0.08)',
        'card-hover': '0 8px 32px 0 rgba(26, 46, 90, 0.16)',
        'nav':     '0 1px 0 0 rgba(26, 46, 90, 0.08)',
        'button':  '0 4px 12px 0 rgba(26, 46, 90, 0.24)',
      },

      // ─── Animaciones ────────────────────────────────────────
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // ─── Border radius ──────────────────────────────────────
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
