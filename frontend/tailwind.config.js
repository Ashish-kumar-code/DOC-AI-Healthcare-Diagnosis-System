/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ============================================================
           🎨 Color Palette: ColorHunt — Earthy Sage & Cream
           #F8EDE3 · #BDD2B6 · #A2B29F · #798777
           ============================================================ */

        background: {
          DEFAULT: '#FBF5EF',   // warm cream (tinted from #F8EDE3)
          50: '#FFFFFF',
          100: '#FBF5EF',
          200: '#F8EDE3',       // palette color 1
          300: '#EFE0D1',
          400: '#E4D0BC',
        },
        card: {
          DEFAULT: '#FFFFFF',
          hover: '#FBF5EF',
          active: '#F8EDE3',
        },
        surface: {
          DEFAULT: '#F8EDE3',
          light: '#FEFAF6',
        },

        // Primary — Built from #798777 (Dark Sage)
        primary: {
          DEFAULT: '#798777',
          50:  '#F2F4F1',
          100: '#E4E8E2',
          200: '#C9D1C6',
          300: '#ADBAA9',
          400: '#92A38D',
          500: '#798777',       // palette color 4
          600: '#6B7969',
          700: '#5C695B',
          800: '#4D584D',
          900: '#3E473E',
        },

        // Secondary — Built from #BDD2B6 (Soft Sage Green)
        secondary: {
          DEFAULT: '#BDD2B6',
          50:  '#F4F8F3',
          100: '#E8F1E6',
          200: '#D2E3CE',
          300: '#BDD2B6',       // palette color 2
          400: '#A5C29D',
          500: '#8DB284',
          600: '#79A06F',
          700: '#658A5C',
          800: '#53724C',
          900: '#425B3D',
        },

        // Accent — Built from #A2B29F (Olive Sage)
        accent: {
          DEFAULT: '#A2B29F',
          50:  '#F2F5F1',
          100: '#E5EAE3',
          200: '#CCD5C9',
          300: '#B3C0AF',
          400: '#A2B29F',       // palette color 3
          500: '#8D9E89',
          600: '#7A8B76',
          700: '#677764',
          800: '#556353',
          900: '#445043',
        },

        // Warm Cream — Built from #F8EDE3 (Lightest palette color)
        cream: {
          DEFAULT: '#F8EDE3',
          50:  '#FEFBF8',
          100: '#FDF7F1',
          200: '#F8EDE3',       // palette color 1
          300: '#F0DCC8',
          400: '#E6C9AB',
          500: '#DBBA96',
          600: '#C9A47A',
          700: '#B08C61',
          800: '#8F7250',
          900: '#6E5940',
        },

        // Status colors — harmonised with sage palette
        success: {
          DEFAULT: '#6B9E5E',
          50:  '#F0F7EE',
          100: '#DDEFD8',
          200: '#BBDFB2',
          300: '#99CF8B',
          400: '#82BF72',
          500: '#6B9E5E',
          600: '#578A4B',
          700: '#477640',
          800: '#3A6135',
          900: '#2E4E2B',
        },
        warning: {
          DEFAULT: '#D4A843',
          50:  '#FDF8EC',
          100: '#FAF0D3',
          200: '#F5E0A8',
          300: '#EFCF7D',
          400: '#E4BC5D',
          500: '#D4A843',
          600: '#B58C32',
          700: '#96742A',
          800: '#785D23',
          900: '#5F4A1D',
        },
        danger: {
          DEFAULT: '#C26050',
          50:  '#FDF2F0',
          100: '#F9E0DB',
          200: '#F2C0B7',
          300: '#E99D90',
          400: '#D67E6E',
          500: '#C26050',
          600: '#A84D3F',
          700: '#8E4035',
          800: '#74342C',
          900: '#5B2923',
        },

        'text-primary':   '#3E3E3B',   // warm near-black
        'text-secondary': '#6B6B66',   // warm grey
        'text-tertiary':  '#A2A29A',   // muted warm grey
        'text-muted':     '#C9C5BD',   // light warm grey

        border: {
          DEFAULT: '#E4DDD4',         // warm border
          hover:   '#CEC5B8',
          active:  '#A2B29F',         // palette olive
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'display': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-sm': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading-sm': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(121, 135, 119, 0.1)',
        'glow': '0 0 20px rgba(121, 135, 119, 0.15)',
        'glow-lg': '0 0 40px rgba(121, 135, 119, 0.2)',
        'glow-xl': '0 0 60px rgba(121, 135, 119, 0.15)',
        'glow-primary': '0 0 20px rgba(121, 135, 119, 0.25)',
        'glow-secondary': '0 0 20px rgba(189, 210, 182, 0.3)',
        'glow-success': '0 0 20px rgba(107, 158, 94, 0.25)',
        'glow-danger': '0 0 20px rgba(194, 96, 80, 0.25)',
        'soft': '0 4px 6px -1px rgba(62, 62, 59, 0.04), 0 2px 4px -2px rgba(62, 62, 59, 0.04)',
        'soft-lg': '0 10px 15px -3px rgba(62, 62, 59, 0.05), 0 4px 6px -4px rgba(62, 62, 59, 0.04)',
        'soft-xl': '0 20px 25px -5px rgba(62, 62, 59, 0.06), 0 8px 10px -6px rgba(62, 62, 59, 0.04)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'card': '0 1px 3px 0 rgba(62, 62, 59, 0.06), 0 1px 2px -1px rgba(62, 62, 59, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(62, 62, 59, 0.08), 0 4px 6px -4px rgba(62, 62, 59, 0.04)',
        'button': '0 1px 2px 0 rgba(62, 62, 59, 0.05)',
        'button-hover': '0 4px 6px -1px rgba(62, 62, 59, 0.08), 0 2px 4px -2px rgba(62, 62, 59, 0.06)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'gradient': 'gradient 8s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'progress': 'progress 1.5s ease-in-out infinite',
        'ripple': 'ripple 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(121, 135, 119, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(121, 135, 119, 0.3)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        progress: {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      backgroundSize: {
        '200%': '200%',
        '300%': '300%',
        '400%': '400%',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
