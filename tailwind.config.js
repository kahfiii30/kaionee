/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1e293b', // darker slate-800
          900: '#0f172a', // slate-900
        }
      }
    },
  },
  plugins: [],
}
