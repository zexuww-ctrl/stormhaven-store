import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        storm: {
          900: '#050607',
          800: '#0D0F11',
          700: '#161A1D',
          emerald: '#10B981',
          glow: '#34D399'
        }
      },
      boxShadow: {
        neon: '0 0 25px rgba(52, 211, 153, 0.25)'
      }
    }
  },
  plugins: []
};

export default config;
