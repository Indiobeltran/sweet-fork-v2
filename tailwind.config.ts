import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: "rgb(var(--color-ivory) / <alpha-value>)",
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        charcoal: "rgb(var(--color-charcoal) / <alpha-value>)",
        stone: "rgb(var(--color-stone) / <alpha-value>)",
        rose: "rgb(var(--color-rose) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["var(--font-display)", "serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px rgba(44, 36, 27, 0.075)",
      },
      backgroundImage: {
        paper:
          "radial-gradient(circle at 28% 0%, rgba(184, 150, 92, 0.13), transparent 34%), linear-gradient(180deg, rgba(255, 253, 249, 0.98), rgba(250, 246, 240, 0.98))",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translate3d(0, 24px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        shimmer: "shimmer 2.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
