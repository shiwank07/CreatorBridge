import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Inter", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        bridge: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          border: "var(--border)",
          accent: "var(--accent)",
          "accent-light": "var(--accent-light)",
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          green: "var(--green)",
          red: "var(--red)",
          yellow: "var(--yellow)",
        },
      },
      boxShadow: {
        glow: "0 0 30px var(--accent-glow)",
      },
    },
  },
  plugins: [],
};

export default config;
