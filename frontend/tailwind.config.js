/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
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
