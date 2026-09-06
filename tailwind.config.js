/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./models/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./constants/**/*.{js,ts,jsx,tsx}",
    "./content/**/*.mdx",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#e9eae5",
        ink: "#202421",
        accent: "#a34526",
        slate: {
          50: "#f4f5f0",
          100: "#e1e3dc",
          200: "#cdd0c7",
          300: "#b0b6ac",
          400: "#80897e",
          500: "#626e62",
          600: "#4b574d",
          700: "#37433a",
          800: "#29332b",
          900: "#202421",
        },
        sky: {
          50: "#f6f2eb",
          100: "#e8e5db",
          500: "#92784c",
          600: "#795631",
          700: "#754c32",
          900: "#37291d",
        },
        gray: {
          200: "#D5DAE1",
        },
        black: {
          DEFAULT: "#000",
          500: "#1D2235",
        },
        blue: {
          50: "#f1ede4",
          100: "#e9e3d5",
          300: "#c4bba5",
          400: "#98866d",
          500: "#8a5940",
          600: "#805039",
          700: "#633c2b",
        },
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "sans-serif"],
        display: ["var(--font-barlow)", "sans-serif"],
        worksans: ["var(--font-archivo)", "sans-serif"],
        poppins: ["var(--font-barlow)", "sans-serif"],
      },
      boxShadow: {
        card: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(10px) translateX(-50%)",
          },
          "100%": { opacity: "1", transform: "translateY(0) translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(-50%)" },
          "50%": { transform: "translateY(-10px) translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
