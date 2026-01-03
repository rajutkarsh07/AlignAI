/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecf4fb',
          100: '#d9e9f7',
          200: '#b3d3ef',
          300: '#8dbce7',
          400: '#3e8fdb',
          500: '#0353A4',
          600: '#034b94',
          700: '#023e7b',
          800: '#023262',
          900: '#012950',
        },
        secondary: {
          50: '#f9f1f0',
          100: '#f2e2e1',
          200: '#ead3d0',
          300: '#e3c4c0',
          400: '#d4a6a1',
          500: '#C58882',
          600: '#b17a75',
          700: '#8E3B46',
          800: '#722f38',
          900: '#55232a',
        },
        accent: {
          DEFAULT: '#FB3640',
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c8',
          300: '#ffa1a3',
          400: '#ff6b6e',
          500: '#FB3640',
          600: '#e2313a',
          700: '#bc2930',
          800: '#962126',
          900: '#7a1b1f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
