/** Colores y tipografía tomados del Design System de Stitch (DESIGN.md) */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        marino: { DEFAULT: '#1E3A8A', oscuro: '#00236f', claro: '#dce1ff' },
        electrico: { DEFAULT: '#3B82F6', oscuro: '#2563EB' },
        libre: { DEFAULT: '#22C55E', oscuro: '#16A34A', claro: '#DCFCE7' },
        ocupado: { DEFAULT: '#EF4444', oscuro: '#DC2626', claro: '#FEE2E2' },
        inhabilitado: { DEFAULT: '#9CA3AF', oscuro: '#64748B', claro: '#F1F5F9' },
        alerta: { DEFAULT: '#F59E0B', oscuro: '#D97706', claro: '#FEF3C7' },
        lienzo: '#F8FAFC',
        tinta: '#0b1c30',
      },
      boxShadow: { suave: '0 1px 3px rgba(15,23,42,.06), 0 4px 12px rgba(15,23,42,.04)' },
      borderRadius: { xl2: '1rem' },
    },
  },
  plugins: [],
};
