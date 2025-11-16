/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFD940',        // Amarillo principal
        primaryStrong: '#F4C400',  // Hover / énfasis
        primarySoft: '#FFF5C2',    // Fondos suaves
        background: '#FFFBEA',     // Fondo general suave
        surface: '#FFFFFF',        // Tarjetas / paneles
        surfaceMuted: '#FFFDF5',   // Variación más suave
        muted: '#6B7280',          // Texto secundario
        borderSoft: '#F3E8C9',     // Bordes sutiles
        dark: '#222222',           // Texto principal
        error: '#E74C3C',          // Errores
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
