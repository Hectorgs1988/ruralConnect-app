/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFED00',       // Amarillo del botón
        background: '#F8F8F0',    // Color de fondo general
        dark: '#222222',          // Texto oscuro
        error: '#E74C3C',         // Para mensajes de error
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
