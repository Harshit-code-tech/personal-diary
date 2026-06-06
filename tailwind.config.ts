import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      colors: {
        // Light mode — Vintage Journal: warm parchment & ink
        parchment: {
          DEFAULT: '#F4E8D1',
          light: '#FAF3E8',
          dark: '#E8D5B8',
        },
        ink: '#2C1810',
        sepia: {
          DEFAULT: '#8B5E3C',
          light: '#A67B5B',
          dark: '#6B4423',
        },
        wax: '#A0522D',
        burgundy: '#722F37',
        
        // Dark mode — Leather & Candlelight
        leather: {
          DEFAULT: '#1A110A',
          card: '#2A1F15',
          hover: '#3D2E20',
        },
        amber: {
          DEFAULT: '#D4A44F',
          glow: '#E8B84D',
          dim: '#B8892E',
        },
        
        // Grey mode ("I'm Tired...")
        tired: {
          bg: '#6B7280',
          card: '#4B5563',
          text: '#F3F4F6',
          accent: '#9CA3AF',
        },

        // Legacy aliases for gradual migration
        paper: '#F4E8D1',
        cream: '#FAF3E8',
        charcoal: '#2C1810',
        gold: '#8B5E3C',
        midnight: '#1A110A',
        graphite: '#2A1F15',
        navy: '#3D2E20',
        teal: '#D4A44F',
        cyan: '#E8B84D',
      },
      fontFamily: {
        // Premium Vintage Typography System
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['"Lora"', '"Crimson Pro"', 'Georgia', 'serif'],
        sans: ['"Source Serif 4"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        ui: ['Inter', '"SF Pro Display"', '-apple-system', 'system-ui', 'sans-serif'],
        script: ['var(--font-caveat)', '"Caveat"', '"Brush Script MT"', 'cursive'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
      },
      fontSize: {
        // Responsive, harmonious scale
        'display-xl': 'clamp(3rem, 5vw, 4.5rem)',
        'display-lg': 'clamp(2.5rem, 4vw, 3.5rem)',
        'display-md': 'clamp(2rem, 3.5vw, 3rem)',
        'h1': 'clamp(1.75rem, 3vw, 2.5rem)',
        'h2': 'clamp(1.5rem, 2.5vw, 2rem)',
        'h3': 'clamp(1.25rem, 2vw, 1.75rem)',
        'h4': 'clamp(1.125rem, 1.5vw, 1.5rem)',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      backgroundImage: {
        'paper-texture': "url('/textures/paper.png')",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
      scale: {
        '98': '0.98',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
