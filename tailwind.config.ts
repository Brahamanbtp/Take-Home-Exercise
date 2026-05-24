import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101828',
        sand: '#f8f2e8',
        moss: '#1f4d3a',
        coral: '#d85d3a',
      },
      boxShadow: {
        soft: '0 20px 50px rgba(16, 24, 40, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;