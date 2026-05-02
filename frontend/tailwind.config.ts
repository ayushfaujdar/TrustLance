import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          lt: "var(--color-primary-lt)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          lt: "var(--color-accent-lt)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          lt: "var(--color-danger-lt)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          2: "var(--color-ink-2)",
          3: "var(--color-ink-3)",
        },
        paper: "var(--color-paper)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      animation: {
        "fade-up": "fade-up 0.4s ease forwards",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
