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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        app: {
          // Backgrounds
          bg: 'var(--color-bg-primary)',
          card: 'var(--color-bg-secondary)',
          elevated: 'var(--color-bg-elevated)',
          overlay: 'var(--color-bg-overlay)',

          // Brand Colors
          primary: 'var(--color-primary)',
          'primary-light': 'var(--color-primary-light)',
          'primary-dark': 'var(--color-primary-dark)',
          secondary: 'var(--color-secondary)',
          'secondary-light': 'var(--color-secondary-light)',
          accent: 'var(--color-accent)',
          'accent-light': 'var(--color-accent-light)',

          // Status Colors
          success: 'var(--color-success)',
          'success-light': 'var(--color-success-light)',
          danger: 'var(--color-danger)',
          'danger-light': 'var(--color-danger-light)',
          warning: 'var(--color-warning)',
          'warning-light': 'var(--color-warning-light)',

          // Text Colors
          text: 'var(--color-text-primary)',
          muted: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',

          // Borders & Dividers
          border: 'var(--color-border)',
          'border-light': 'var(--color-border-light)',
          divider: 'var(--color-divider)',
        }
      },
      boxShadow: {
        'premium': 'var(--shadow-lg)',
        'premium-xl': 'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
}
