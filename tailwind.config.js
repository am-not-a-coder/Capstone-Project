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
        zuccini: {
          600: '#3a5a40',
          700: '#2c4531',
          800: '#1e3022',
          900: '#101b13',
        },
        woodsmoke: {
          200: '#1c1c1c',
          300: '#2a2a2a',
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
