/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tons mais naturais baseados nas referencias
        green: {
          50: '#F2FCF5',  // Fundo muito suave
          100: '#DDF7E3', // Highlights
          200: '#B8EAC4',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D', // Verde floresta para textos
          800: '#166534',
          900: '#14532D',
        },
        gray: {
          50: '#F9FAFB', // Off-white para background geral
          100: '#F3F4F6', // Cards backgrounds
          800: '#1F2937', // Texto principal (quase preto, mas suave)
        },
        // Cores de destaque para tarefas (Rega, Adubo, etc)
        accent: {
          water: '#3B82F6',
          sun: '#F59E0B',
          danger: '#EF4444',
        }
      }
    },
  },
  plugins: [],
}