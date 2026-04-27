/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        pet: {
          warm: '#FFF5F0',
          peach: '#FFD4C4',
          blush: '#FFB4A0'
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      backdropBlur: {
        md: '12px',
        xl: '20px'
      }
    }
  },
  plugins: []
}
