import { create } from 'twrnc';

// Criamos uma instância do twrnc já com suas cores personalizadas
const tw = create({
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
});

export default tw;