/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        app: {
          bg: 'var(--color-bg-primary)',
          card: 'var(--color-bg-secondary)',
          elevated: 'var(--color-bg-elevated)',
          primary: 'var(--color-primary)',
          'primary-light': 'var(--color-primary-light)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          success: 'var(--color-success)',
          danger: 'var(--color-danger)',
          warning: 'var(--color-warning)',
          muted: 'var(--color-text-secondary)',
          border: 'var(--color-border)',
          text: 'var(--color-text-primary)'
        }
      }
    },
  },
  plugins: [],
}
