/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // AQUI ADICIONAMOS A SUA PALETA
      colors: {
        'carvao': '#343434',
        'off-white': '#F5F5F5',
        'dourado': '#D4AF37',   // O seu Ocre Dourado
        'prata': '#BFC0C0',     // O seu Cinza Prata
      }
    },
  },
  plugins: [],
}
