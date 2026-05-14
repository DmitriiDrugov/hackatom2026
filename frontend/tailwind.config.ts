import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          elevated: "var(--surface-elevated)",
          border: "var(--border)",
          muted: "var(--muted)",
          text: "var(--text)",
          cyan: "var(--cyan)",
          emerald: "var(--emerald)",
          amber: "var(--amber)",
          rose: "var(--rose)",
          purple: "var(--purple)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        flow: {
          to: { strokeDashoffset: "-26" },
        },
      },
      animation: {
        blink: "blink 1.4s step-end infinite",
        flow: "flow 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
