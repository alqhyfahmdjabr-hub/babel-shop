import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF9F1',
          100: '#F5F0DC',
          200: '#EAD8A0',
          300: '#DFC06B',
          400: '#D4AF37',
          500: '#B4942B',
          600: '#8C701D',
          700: '#695313',
          800: '#48380C',
          900: '#2A2005'
        },
        dark: {
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
          950: '#020202'
        },
        babil: {
          black: '#020202',
          dark: '#080808',
          card: '#0D0D0D',
          glass: 'rgba(13, 13, 13, 0.7)'
        }
      },
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'],
        serif: ['Amiri', 'serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'scale-up': 'scaleUp 0.6s ease-out forwards',
        shimmer: 'shimmer 1.5s infinite linear',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'flash-green': 'flashGreen 1.2s ease-out',
        'flash-red': 'flashRed 1.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        flashGreen: {
          '0%': { backgroundColor: 'rgba(34, 197, 94, 0.16)' },
          '100%': { backgroundColor: 'transparent' }
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.16)' },
          '100%': { backgroundColor: 'transparent' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        gold: '0 4px 14px 0 rgba(212, 175, 55, 0.39)',
        'gold-lg': '0 10px 25px -5px rgba(212, 175, 55, 0.4)',
        'inner-gold': 'inset 0 2px 4px 0 rgba(212, 175, 55, 0.06)',
        luxury: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        glow: '0 0 40px rgba(212, 175, 55, 0.1)',
        'glow-strong': '0 0 20px rgba(212, 175, 55, 0.3)'
      }
    }
  },
  plugins: [forms, typography]
};
