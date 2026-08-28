import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        cream: "var(--cream)",
        paper: "var(--paper)",
        ultramarine: "var(--ultramarine)",
        "ultramarine-hover": "var(--ultramarine-hover)",
        "ultramarine-pressed": "var(--ultramarine-pressed)",
        "ultramarine-soft": "var(--ultramarine-soft)",
        "muted-ink": "var(--muted-ink)",
        border: "var(--border)",
        success: "var(--quiet-success)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      borderRadius: {
        stage: "var(--stage-radius)",
        small: "var(--small-radius)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        stage: "var(--shadow-stage)",
      },
    },
  },
  plugins: [],
};

export default config;
