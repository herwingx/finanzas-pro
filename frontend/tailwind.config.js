/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Una fuente mono-espaciada numérica es vital para finanzas
        numbers: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem', // Revolut usa bordes muy redondos
        '4xl': '2rem',
      },
      colors: {
        // Mapeamos a tus variables existentes
        app: {
          bg: 'var(--bg-canvas)',
          surface: 'var(--bg-surface)',
          subtle: 'var(--bg-subtle)',
          border: 'var(--border-default)',
          text: 'var(--text-main)',
          muted: 'var(--text-muted)',
          primary: 'var(--brand-primary)',
          success: 'var(--semantic-success)',
          danger: 'var(--semantic-danger)',
        }
      },
      // Sombras estilo "Stripe/Linear"
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'float': '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}