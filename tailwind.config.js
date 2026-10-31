/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/styles/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      keyframes: {
        "loader-dots": {
          "20%": { backgroundPosition: "0% 0%, 50% 50%, 100% 50%" },
          "40%": { backgroundPosition: "0% 100%, 50% 0%, 100% 50%" },
          "60%": { backgroundPosition: "0% 50%, 50% 100%, 100% 0%" },
          "80%": { backgroundPosition: "0% 50%, 50% 50%, 100% 100%" },
        },
        spinner: {
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
      },
      animation: {
        "loader-dots": "loader-dots 1s infinite linear",
        spinner: "spinner 0.8s ease infinite",
        shimmer: "shimmer 1.5s infinite linear",
      },
      fontFamily: { sans: ["NotoSans", "sans-serif"] },
    },
  },
  plugins: [],
};
