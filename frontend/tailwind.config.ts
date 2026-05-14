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
          bg: "#070a0f",
          surface: "#101722",
          elevated: "#182231",
          border: "#2a3648",
          muted: "#8fa1b8",
          text: "#f2f6fb",
          cyan: "#4cc9f0",
          emerald: "#3ddc97",
          amber: "#f5c451",
          rose: "#ff6b7a",
          purple: "#b78cff",
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
