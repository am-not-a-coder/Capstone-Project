/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
        transitionDuration:{
            500: '500ms'
        },
      colors: {
        'zuccini': {
    '50': '#eefff5',
    '100': '#d8ffeb',
    '200': '#b4fed8',
    '300': '#79fcba',
    '400': '#38f094',
    '500': '#0ed975',
    '600': '#05b45d',
    '700': '#088d4c',
    '800': '#0c6f3f',
    '900': '#0c5b36',
    '950': '#004526',
  },

        'woodsmoke': {
    '50': '#f7f7f8',
    '100': '#ededf1',
    '200': '#d7d8e0',
    '300': '#b5b6c4',
    '400': '#8c8ea4',
    '500': '#6e7189',
    '600': '#595a70',
    '700': '#48495c',
    '800': '#3e3e4e',
    '900': '#373843',
    '950': '#0e0e11',
    },

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
