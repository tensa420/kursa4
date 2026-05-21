/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        moss: { DEFAULT: "#3d6b4f", dark: "#2d4f3a", light: "#5a8f6a" },
        soil: { DEFAULT: "#5c4033", light: "#8b6914" },
        cream: { DEFAULT: "#f5f0e6", dark: "#e8dfd0" },
        wheat: { DEFAULT: "#d4a574" },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
