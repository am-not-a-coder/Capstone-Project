const { keyframes } = require('styled-components');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      keyframes:{
        fadeIn: {
          '0%': {opacity: '0', transform: 'scale(0.95)'},
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      
      animation:{
        'fadeIn': 'fadeIn 0.3s ease-out forwards'
      },

        transitionDuration:{
            500: '500ms'
        },
        
      spacing: {
        70: '17.5rem',
        145: '36.25rem',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
