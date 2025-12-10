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
          tertiary: 'var(--color-bg-tertiary)',
          hover: 'var(--color-bg-hover)',
          active: 'var(--color-bg-active)',

          // Brand Colors
          primary: 'var(--color-primary)',
          'primary-light': 'var(--color-primary-light)',
          'primary-dark': 'var(--color-primary-dark)',
          'primary-glow': 'var(--color-primary-glow)',
          secondary: 'var(--color-secondary)',
          'secondary-light': 'var(--color-secondary-light)',
          'secondary-glow': 'var(--color-secondary-glow)',
          accent: 'var(--color-accent)',
          'accent-light': 'var(--color-accent-light)',
          'accent-glow': 'var(--color-accent-glow)',

          // Status Colors
          success: 'var(--color-success)',
          'success-light': 'var(--color-success-light)',
          'success-bg': 'var(--color-success-bg)',
          danger: 'var(--color-danger)',
          'danger-light': 'var(--color-danger-light)',
          'danger-bg': 'var(--color-danger-bg)',
          warning: 'var(--color-warning)',
          'warning-light': 'var(--color-warning-light)',
          'warning-bg': 'var(--color-warning-bg)',
          info: 'var(--color-info)',
          'info-light': 'var(--color-info-light)',
          'info-bg': 'var(--color-info-bg)',

          // Text Colors
          text: 'var(--color-text-primary)',
          muted: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          quaternary: 'var(--color-text-quaternary)',
          inverted: 'var(--color-text-inverted)',

          // Borders & Dividers
          border: 'var(--color-border)',
          'border-light': 'var(--color-border-light)',
          'border-medium': 'var(--color-border-medium)',
          'border-strong': 'var(--color-border-strong)',
        }
      },
      boxShadow: {
        'premium': 'var(--shadow-lg)',
        'premium-xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow-md)',
        'glow-sm': 'var(--shadow-glow-sm)',
        'glow-lg': 'var(--shadow-glow-lg)',
      },
    },
  },
  plugins: [],
}
