/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Minimal Orgânico Palette — warm off-white, ink text, moss green accent
        sage: {
          50: '#FDFDFC',
          100: '#F5F5F4',
          200: '#EFEFEA',
          300: '#D6D6CC',
          400: '#A6A69E',
          500: '#8B9A7F',
          600: '#7C9B72', // Primary: Moss Green
          700: '#5F7C57',
          800: '#3F5238',
          900: '#232320', // Ink
        },
        clay: {
          50: '#FDF8F5',
          100: '#FBEEE3', // Terracotta task surface
          200: '#F5DAC8',
          300: '#EFC5AA',
          400: '#EAA18C',
          500: '#D98F5F', // Secondary: Terracotta
          600: '#B08A63',
          700: '#895B3D',
          800: '#3E2A1B',
          900: '#422A1C',
        },
        canvas: {
          DEFAULT: '#FDFDFC', // Off-white linen
          dark: '#F0EFE9',
        },
        charcoal: {
          DEFAULT: '#2E2E2E', // Deep warm gray for Dark Mode
          light: '#3E3E3E',
          dark: '#1E1E1E',
        },
        // Semantic aliases
        primary: '#7C9B72',
        secondary: '#D98F5F',
        background: '#FDFDFC',
        surface: '#FFFFFF',
        text: {
          primary: '#232320',
          secondary: '#A6A69E',
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
        // Editorial minimal headline weight used in the "Minimal Orgânico" redesign
        light: ['Lato_300Light', 'System', 'sans-serif'],
        label: ['Montserrat_600SemiBold', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
