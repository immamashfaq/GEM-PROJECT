import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Navy base palette
        navy: {
          950: '#04060f',
          900: '#080d1a',
          800: '#0c1325',
          700: '#121c35',
          600: '#1a2747',
          500: '#243460',
          400: '#2f4280',
          300: '#4a619e',
        },
        // Gold accent palette
        gold: {
          50:  '#fdf9ec',
          100: '#faf1cc',
          200: '#f4e09b',
          300: '#ecc75d',
          400: '#e4ad2e',
          500: '#C9A84C',   // primary gold
          600: '#b08930',
          700: '#8a6a24',
          800: '#6f5320',
          900: '#5c4520',
          950: '#352510',
        },
        // Semantic
        gem: {
          bg:     '#080d1a',
          card:   '#0e1628',
          border: '#1e2d4e',
          muted:  '#4a5568',
          accent: '#C9A84C',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gem-radial': 'radial-gradient(ellipse at top, #1a2747 0%, #080d1a 70%)',
        'gold-shine': 'linear-gradient(135deg, #C9A84C 0%, #e4c46a 50%, #C9A84C 100%)',
        'card-glass': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      },
      boxShadow: {
        'gem': '0 0 0 1px rgba(201,168,76,0.15), 0 4px 24px rgba(0,0,0,0.4)',
        'gem-hover': '0 0 0 1px rgba(201,168,76,0.35), 0 8px 32px rgba(0,0,0,0.5)',
        'gold-glow': '0 0 20px rgba(201,168,76,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(201,168,76,0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
