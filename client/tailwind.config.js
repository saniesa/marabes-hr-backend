/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // --- ADD THIS SECTION ---
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
      },
      // -----------------------
      colors: {
        mint: {
          50: '#f0fdfa',
          // ... your other mint colors
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate"),],
}