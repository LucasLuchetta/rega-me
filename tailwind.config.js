/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Digital Sanctuary Palette
        sage: {
          50: '#F4F7F5',
          100: '#E3EBE6',
          200: '#C5D6CD',
          300: '#A3BFB0',
          400: '#82A894',
          500: '#5D8C7B', // Primary: Sage Green
          600: '#4A7062',
          700: '#38544A',
          800: '#263831',
          900: '#151F1B',
        },
        clay: {
          50: '#FDF8F5',
          100: '#FAEEE6',
          200: '#F5DAC8',
          300: '#EFC5AA',
          400: '#EAA18C',
          500: '#E59866', // Secondary: Terracotta
          600: '#B77A52',
          700: '#895B3D',
          800: '#6D462F',
          900: '#422A1C',
        },
        canvas: {
          DEFAULT: '#FAF9F6', // Off-white / Recycled Paper
          dark: '#F0EFE9',
        },
        charcoal: {
          DEFAULT: '#2E2E2E', // Deep warm gray for Dark Mode
          light: '#3E3E3E',
          dark: '#1E1E1E',
        },
        // Semantic aliases
        primary: '#5D8C7B',
        secondary: '#E59866',
        background: '#FAF9F6',
        surface: '#FFFFFF',
        text: {
          primary: '#2E2E2E', // Charcoal
          secondary: '#6B7280',
        },

        // Keep existing colors for backward compatibility
        green: {
          50: '#F2FCF5',
          100: '#DDF7E3',
          200: '#B8EAC4',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          light: '#e6f4ea',
          dark: '#166534',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        accent: {
          water: '#3B82F6',
          sun: '#F59E0B',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        headline: ['PlayfairDisplay_700Bold', 'Georgia', 'serif'],
        subheadline: ['Montserrat_600SemiBold', 'sans-serif'],
        body: ['Lato_400Regular', 'sans-serif'],
        sans: ['Lato_400Regular', 'System', 'sans-serif'], // Default to Lato
        serif: ['PlayfairDisplay_400Regular', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
