/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf6ee',
          100: '#f9e8d0',
          200: '#f3ce9e',
          300: '#ecae65',
          400: '#e68e35',
          500: '#d97519',
          600: '#c05d12',
          700: '#9e4412',
          800: '#7f3716',
          900: '#682e15',
        },
        surface: {
          50:  '#fafaf8',
          100: '#f4f3ef',
          200: '#e8e6df',
          300: '#d6d3c8',
        }
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  },
  plugins: []
}
