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
          sunken: "var(--surface-sunken)",
          border: "var(--border)",
          "border-strong": "var(--border-strong)",
          muted: "var(--muted)",
          "muted-strong": "var(--muted-strong)",
          text: "var(--text)",
          "text-soft": "var(--text-soft)",
          cyan: "var(--cyan)",
          blue: "var(--blue)",
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
      boxShadow: {
        "panel-card":
          "0 1px 1px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06), 0 24px 60px -28px rgba(15,23,42,0.18)",
        "soft-pop":
          "0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.10)",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
        flow: {
          to: { strokeDashoffset: "-26" },
        },
        "soft-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.4)", opacity: "0" },
        },
      },
      animation: {
        blink: "blink 1.4s ease-in-out infinite",
        flow: "flow 1.8s linear infinite",
        "soft-pulse": "soft-pulse 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
