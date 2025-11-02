/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Paleta de Cores Personalizada
      colors: {
        'carvao': '#343434',
        'off-white': '#F5F5F5',
        'dourado': '#D4AF37',   
        'prata': '#BFC0C0',     
      }
    },
  },
  plugins: [],
}
