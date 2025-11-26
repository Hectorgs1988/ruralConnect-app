/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#fce500',        // Amarillo principal (trigo)
        primaryStrong: '#F4C400',  // Hover / énfasis
        primarySoft: '#FFF5C2',    // Fondos suaves cercanos al amarillo
        background: '#f5f2e9',     // Fondo general (beige campos)
        surface: '#FFFFFF',        // Tarjetas / paneles
        surfaceMuted: '#f5f2e9',   // Fondos suaves / bloques secundarios
        muted: '#6B7280',          // Texto secundario
        borderSoft: '#F3E8C9',     // Bordes sutiles
        dark: '#1b1b1b',           // Texto principal / negro rural
        error: '#B91C1C',          // Errores (rojo más oscuro para mejor contraste)
        success: '#22C55E',        // Éxito / confirmaciones
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
