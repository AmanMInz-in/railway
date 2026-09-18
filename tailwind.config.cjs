/** @type {import('tailwindcss').Config} */
const animate = require('tailwindcss-animate')

module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: { '2xl': '1600px' },
    },
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          '"Segoe UI"',
          'system-ui',
          '-apple-system',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Cascadia Code"',
          'ui-monospace',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        canvas: '#070C16',
        panel: {
          DEFAULT: '#0C1424',
          soft: '#0A1120',
          edge: '#111C30',
          raised: '#16233C',
          hover: '#1B2A46',
        },
        line: {
          DEFAULT: '#1C2A44',
          soft: '#14203A',
          bright: '#2A3E63',
        },
        ink: {
          DEFAULT: '#E6EDF9',
          dim: '#A3B3CF',
          faint: '#6C7E9E',
          muted: '#4E5F7E',
        },
        accent: {
          DEFAULT: '#3B82F6',
          bright: '#60A5FA',
          deep: '#2563EB',
          soft: '#16294F',
        },
        signal: {
          green: '#2AC76F',
          amber: '#F2B53D',
          red: '#F0506E',
          violet: '#9B7BFF',
          cyan: '#29C5E0',
          blank: '#4A5568',
        },
        warn: '#F2B53D',
        danger: '#F0506E',
        success: '#2AC76F',
        info: '#29C5E0',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 10px 30px -12px rgba(0,0,0,0.6)',
        glow:
          '0 0 0 1px rgba(59,130,246,0.35), 0 0 24px -4px rgba(59,130,246,0.45)',
        glowGreen:
          '0 0 0 1px rgba(42,199,111,0.3), 0 0 20px -6px rgba(42,199,111,0.4)',
        glowRed:
          '0 0 0 1px rgba(240,80,110,0.35), 0 0 24px -6px rgba(240,80,110,0.5)',
        glowAmber:
          '0 0 0 1px rgba(242,181,61,0.3), 0 0 20px -6px rgba(242,181,61,0.4)',
        card: '0 1px 2px rgba(0,0,0,0.35), 0 8px 24px -16px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'control-grid':
          'linear-gradient(rgba(74,96,138,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(74,96,138,0.055) 1px, transparent 1px)',
        'control-grid-lg':
          'linear-gradient(rgba(74,96,138,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(74,96,138,0.04) 1px, transparent 1px)',
        'scanline': 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px)',
        'vignette':
          'radial-gradient(1200px 600px at 50% -10%, rgba(38,64,120,0.18), transparent 60%)',
      },
      keyframes: {
        'signal-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.9' },
          '80%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'dash-move': {
          to: { strokeDashoffset: '-16' },
        },
        'scan': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'signal-blink': 'signal-blink 1.6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite',
        'dash-move': 'dash-move 0.9s linear infinite',
        'scan': 'scan 2.4s ease-in-out infinite',
        'fade-up': 'fade-up 0.3s ease-out both',
      },
    },
  },
  plugins: [animate],
}