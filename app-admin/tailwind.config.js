/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // AQUI ADICIONAMOS A SUA PALETA DINÂMICA
      colors: {
        carvao: '#343434',
        'off-white': '#F5F5F5',
        dourado: 'var(--brand-primary, #D4AF37)', // Mapeado dinamicamente para a cor primária da loja
        brand: {
          primary: 'var(--brand-primary, #D4AF37)',
          'primary-contrast': 'var(--brand-primary-contrast, #18181b)',
          secondary: 'var(--brand-secondary, #343434)',
          'secondary-contrast': 'var(--brand-secondary-contrast, #ffffff)',
        },
        prata: '#BFC0C0', // O seu Cinza Prata
      },
    },
  },
  plugins: [],
};
