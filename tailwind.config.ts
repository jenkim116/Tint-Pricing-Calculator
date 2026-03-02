import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          dark: "#23575E",
          DEFAULT: "#17A147",
          light: "#8BD0A3",
          white: "#FFFFFF",
          // for hover states and focus
          50: "#e8f7ed",
          100: "#c8edd4",
          200: "#8BD0A3",
          500: "#17A147",
          600: "#128a3d",
          800: "#23575E",
        },
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)",
        card: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
