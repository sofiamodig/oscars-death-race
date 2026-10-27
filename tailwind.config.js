/** @type {import('tailwindcss').Config} */
module.exports = {
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
      colors: {
        primary: {
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          500: "var(--color-primary-500)",
          700: "var(--color-primary-700)",
        },
        secondary: {
          500: "var(--color-secondary-500)",
          700: "var(--color-secondary-700)",
        },
        neutral: {
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
          1000: "var(--color-neutral-1000)",
          0: "var(--color-neutral-0)",
        },
        ui: {
          green: "var(--color-ui-green)",
          "light-green": "var(--color-ui-light-green)",
          red: "var(--color-ui-red)",
          "red-darker": "var(--color-ui-red-darker)",
          yellow: "var(--color-ui-yellow)",
          blue: "var(--color-ui-blue)",
          "blue-lighter": "var(--color-ui-blue-lighter)",
        },
        info: "var(--color-info)",
        error: "var(--color-error)",
        success: "var(--color-success)",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "16px",
        md: "24px",
        lg: "32px",
        xl: "40px",
        xxl: "48px",
        xxxl: "64px",
      },
      fontFamily: { sans: ["NotoSans", "sans-serif"] },
    },
  },
  plugins: [],
};
