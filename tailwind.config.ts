import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1F3864",
          50: "#E8EDF5",
          100: "#C5D0E5",
          200: "#9AAFD1",
          300: "#6F8EBD",
          400: "#4D74AF",
          500: "#2E5A9B",
          600: "#1F3864",
          700: "#172B4E",
          800: "#0F1E38",
          900: "#080F1C",
        },
        accent: {
          DEFAULT: "#2E75B6",
          50: "#EBF3FB",
          100: "#C5DCF1",
          200: "#9DC5E7",
          300: "#74ADDC",
          400: "#4E97D2",
          500: "#2E75B6",
          600: "#235C91",
          700: "#1A446B",
          800: "#112C46",
          900: "#081623",
        },
        surface: {
          DEFAULT: "#D6E4F0",
          light: "#EBF3FB",
          dark: "#B8D0E5",
        },
        dark: "#0A0F1E",
        gold: "#C9A84C",
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
        body: ["DM Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern":
          "linear-gradient(135deg, #0A0F1E 0%, #1F3864 50%, #2E75B6 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      boxShadow: {
        card: "0 4px 20px rgba(31, 56, 100, 0.08)",
        "card-hover": "0 8px 40px rgba(31, 56, 100, 0.15)",
        glow: "0 0 40px rgba(46, 117, 182, 0.3)",
        "glow-sm": "0 0 20px rgba(46, 117, 182, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
