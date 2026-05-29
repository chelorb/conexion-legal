/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ── Paleta C: Gris carbón + Cobre ──────────────────
      colors: {
        // Carbón — color principal
        carbon: {
          950: '#0A0908',
          900: '#1C1B18',
          800: '#2C2B27',
          700: '#3A3832',
          600: '#56534A',
          100: '#F0EFED',
          50:  '#F7F6F4',
        },
        // Cobre — acento
        copper: {
          700: '#8B4A1E',
          600: '#9B3D22',
          500: '#B86030',
          400: '#C4522E',
          50:  '#F8EDE8',
        },
        // Mantener navy y gold para compatibilidad con badges existentes
        navy: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          700: '#2630d9',
          800: '#2228b0',
          900: '#1a2e5a',
          950: '#0f1a3d',
        },
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#c9a227',
        },
      },

      // ── Tipografía ──────────────────────────────────────
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', '"Helvetica Neue"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      // ── Sombras ─────────────────────────────────────────
      boxShadow: {
        'card':       '0 1px 8px 0 rgba(28,27,24,0.06)',
        'card-hover': '0 6px 24px 0 rgba(28,27,24,0.12)',
        'nav':        '0 1px 0 0 rgba(28,27,24,0.06)',
        'button':     '0 4px 12px 0 rgba(28,27,24,0.20)',
      },

      // ── Border radius ───────────────────────────────────
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
