/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        "outline": "#7b7486",
        "inverse-surface": "#342f2b",
        "on-primary-container": "#e5d5ff",
        "surface-container": "#1c1924",
        "surface-container-low": "#16131c",
        "surface-container-lowest": "#0e0c12",
        "surface-container-high": "#24202d",
        "surface-container-highest": "#2e2938",
        "primary": "#8455ef",
        "primary-container": "#6d28d9",
        "on-primary": "#ffffff",
        "on-surface": "#eae1da",
        "on-surface-variant": "#c4bcce",
        "surface": "#121016",
        "background": "#121016",
        "error": "#ef4444",
        "error-container": "#450a0a",
        "on-error": "#ffffff",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
