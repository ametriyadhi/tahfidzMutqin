/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        quran: ['"Mushaf Madinah"', 'serif'],
      },
      colors: {
        jali: '#E53935',
        khafi: '#FB8C00',
        tark: '#616161'
      }
    },
  },
  plugins: [],
}
