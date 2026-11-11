/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#04070f',
          900: '#060b18',
          850: '#0a1224',
          800: '#0e1830',
          700: '#16233f',
          600: '#1f3154',
          500: '#2c4370',
        },
        cyan: {
          DEFAULT: '#22d3ee',
          soft: '#67e8f9',
          dim: '#0e7490',
        },
        glow: '#3ee9ff',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(62, 233, 255, 0.25)',
        glow: '0 0 24px rgba(62, 233, 255, 0.35)',
        'glow-lg': '0 0 48px rgba(62, 233, 255, 0.4)',
        panel: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'float-y': 'floatY 6s ease-in-out infinite',
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
