/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mindful Garden Palette (Headspace-inspired)
        canvas: {
          DEFAULT: '#FAF9F6', // Warm Paper / Off-White
          dark: '#F0EFE9',     // Slightly darker for cards/inputs
        },
        sage: {
          50: '#F4F7F5',
          100: '#E3EBE6',
          200: '#C5D6CD',
          300: '#A3BFB0',
          400: '#82A894',
          500: '#5D8C7B', // Primary Brand Color (Calming Green)
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
          400: '#EAA18C', // Soft Coral/Clay
          500: '#E59866', // Primary Accent (Warmth)
          600: '#B77A52',
          700: '#895B3D',
          800: '#6D462F', // Added darker shades for text
          900: '#422A1C',
        },
        sky: {
          50: '#F0F9FF', // Added lighter shade for backgrounds
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        // Semantic aliases (New System)
        primary: '#5D8C7B', // Sage 500
        secondary: '#E59866', // Clay 500
        background: '#FAF9F6', // Canvas
        surface: '#FFFFFF', // Pure white for cards on canvas
        text: {
          primary: '#374151', // Gray 700 - Soft Black
          secondary: '#6B7280', // Gray 500 - Muted
          light: '#9CA3AF',
        },

        // LEGACY PALETTE (Restored to prevent breakage in other screens)
        // These will be deprecated over time
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
          light: '#e6f4ea', // From old tw.ts
          dark: '#166534',  // From old tw.ts
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB', // Added common gray
          400: '#9CA3AF', // Added common gray
          500: '#6B7280',
          600: '#4B5563',
          800: '#1F2937',
          900: '#111827',
        },
        accent: {
          water: '#3B82F6',
          sun: '#F59E0B',
          danger: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['System'],
        serif: ['Georgia', 'Times New Roman', 'System'], // Enhanced serif support
      },
      borderRadius: {
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
