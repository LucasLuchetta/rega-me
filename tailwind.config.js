/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          light: '#e6f4ea',
          DEFAULT: '#4ade80',
          dark: '#166534',
        }
      }
    },
  },
  plugins: [],
}
