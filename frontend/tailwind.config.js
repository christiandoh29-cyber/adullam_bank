// /** @type {import('tailwindcss').Config} */
// export default {
//   darkMode: ['class'],
//   content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
//   theme: {
//     extend: {
//       fontFamily: {
//         sans: ['Poppins', 'system-ui', 'sans-serif'],
//       },
//       colors: {
//         // Adullam brand palette — deep navy + electric purple accent
//         brand: {
//           50:  '#f3f0ff',
//           100: '#e9e3ff',
//           200: '#d4c9ff',
//           300: '#b8a3ff',
//           400: '#9470ff',
//           500: '#6C3CE1',  // primary
//           600: '#5a2cc7',
//           700: '#4a21a8',
//           800: '#3d1b8a',
//           900: '#2d136b',
//           950: '#1a0a45',
//         },
//         surface: {
//           DEFAULT: '#0d0d14',
//           50:  '#f8f8fc',
//           100: '#eeeef6',
//           200: '#d5d5e9',
//           300: '#ababc9',
//           400: '#7a7a9b',
//           500: '#555578',
//           600: '#3e3e5e',
//           700: '#2a2a44',
//           800: '#16162a',
//           900: '#0d0d1e',
//           950: '#07070f',
//         },
//         accent: {
//           purple: '#A855F7',
//           violet: '#6C3CE1',
//           teal:   '#14B8A6',
//           amber:  '#F59E0B',
//           rose:   '#F43F5E',
//           green:  '#22C55E',
//         },
//       },
//       backgroundImage: {
//         'brand-gradient': 'linear-gradient(135deg, #6C3CE1 0%, #A855F7 100%)',
//         'card-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
//         'dark-gradient': 'linear-gradient(180deg, #0d0d1e 0%, #07070f 100%)',
//         'purple-glow': 'radial-gradient(ellipse at 50% 0%, rgba(108,60,225,0.3) 0%, transparent 70%)',
//       },
//       boxShadow: {
//         'brand': '0 0 30px rgba(108,60,225,0.3)',
//         'brand-sm': '0 0 10px rgba(108,60,225,0.2)',
//         'card': '0 4px 40px rgba(0,0,0,0.4)',
//         'glass': 'inset 0 1px 0 rgba(255,255,255,0.06)',
//       },
//       borderRadius: {
//         lg: '0.75rem',
//         xl: '1rem',
//         '2xl': '1.5rem',
//       },
//       animation: {
//         'fade-in': 'fadeIn 0.3s ease-in-out',
//         'slide-up': 'slideUp 0.4s ease-out',
//         'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
//         'shimmer': 'shimmer 2s linear infinite',
//       },
//       keyframes: {
//         fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
//         slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
//         pulseGlow: {
//           '0%, 100%': { boxShadow: '0 0 20px rgba(108,60,225,0.3)' },
//           '50%': { boxShadow: '0 0 40px rgba(168,85,247,0.5)' },
//         },
//         shimmer: {
//           '0%': { backgroundPosition: '-200% 0' },
//           '100%': { backgroundPosition: '200% 0' },
//         },
//       },
//     },
//   },
//   plugins: [require('tailwindcss-animate')],
// }

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4c9ff',
          300: '#b8a3ff',
          400: '#9470ff',
          500: '#6C3CE1',
          600: '#5a2cc7',
          700: '#4a21a8',
          800: '#3d1b8a',
          900: '#2d136b',
          950: '#1a0a45',
        },
        surface: {
          50:  'var(--surface-50)',
          100: 'var(--surface-100)',
          200: 'var(--surface-200)',
          300: 'var(--surface-300)',
          400: 'var(--surface-400)',
          500: 'var(--surface-500)',
          600: 'var(--surface-600)',
          700: 'var(--surface-700)',
          800: 'var(--surface-800)',
          900: 'var(--surface-900)',
          950: 'var(--surface-950)',
        },
        accent: {
          purple: 'var(--purple)',
          violet: '#6C3CE1',
          teal:   '#14B8A6',
          amber:  '#F59E0B',
          rose:   '#F43F5E',
          green:  '#22C55E',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6C3CE1 0%, #A855F7 100%)',
        'card-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0b1120 0%, #050816 100%)',
        'purple-glow': 'radial-gradient(ellipse at 50% 0%, rgba(108,60,225,0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'brand': '0 0 30px rgba(108,60,225,0.3)',
        'brand-sm': '0 0 10px rgba(108,60,225,0.2)',
        'card': '0 4px 40px rgba(0,0,0,0.15)',
        'glass': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-down': 'slideDown 0.5s ease-out forwards',
        'slide-down-bounce': 'slideDownBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-error': 'pulseError 2s ease-in-out infinite',
        'scale-up': 'scaleUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: { 
          from: { opacity: '0' }, 
          to: { opacity: '1' } 
        },
        slideUp: { 
          from: { opacity: '0', transform: 'translateY(20px)' }, 
          to: { opacity: '1', transform: 'translateY(0)' } 
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(108,60,225,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(168,85,247,0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDownBounce: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '60%': { opacity: '1', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        pulseError: {
          '0%': { borderColor: 'rgb(220 38 38 / 0.5)' },
          '50%': { borderColor: 'rgb(220 38 38 / 0.3)' },
          '100%': { borderColor: 'rgb(220 38 38 / 0.5)' },
        },
        scaleUp: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
