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
          bg: "#0b1120",
          surface: "#111827",
          elevated: "#1a2540",
          border: "#1f2d45",
          muted: "#64748b",
          text: "#e2e8f0",
          cyan: "#38bdf8",
          emerald: "#34d399",
          amber: "#fbbf24",
          rose: "#fb7185",
          purple: "#c084fc",
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
