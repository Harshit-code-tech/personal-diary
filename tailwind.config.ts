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
      colors: {
        // Light mode colors
        paper: '#F7F2E8',
        charcoal: '#1C1C1C',
        gold: '#D4A44F',
        
        // Dark mode colors
        midnight: '#121212',
        graphite: '#1A1A1A',
        teal: '#5EEAD4',
        
        // Grey mode ("I'm Tired...")
        tired: {
          bg: '#6B7280',
          card: '#4B5563',
          text: '#F3F4F6',
          accent: '#9CA3AF',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
        body: ['Lora', 'serif'],
      },
      backgroundImage: {
        'paper-texture': "url('/textures/paper.png')",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
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
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
