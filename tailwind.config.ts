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
        bg: {
          DEFAULT: "#05090c",
          soft: "#0a1117",
          card: "#0e161e",
          panel: "#111c25",
          line: "#1b2a36",
        },
        eco: {
          50: "#ecfff5",
          100: "#d2ffe7",
          200: "#a4ffd0",
          300: "#67ffb1",
          400: "#2ef191",
          500: "#0ed373",
          600: "#01a85a",
          700: "#02844a",
          800: "#06683d",
          900: "#0a5634",
        },
        ocean: {
          400: "#3eb3ff",
          500: "#0c92ff",
          600: "#0073db",
          700: "#0058a7",
        },
        warn: {
          400: "#ffb454",
          500: "#ff8a1f",
          600: "#e96a00",
        },
        danger: {
          400: "#ff6c6c",
          500: "#ff3838",
          600: "#cc1f1f",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 30px -5px rgba(46, 241, 145, 0.35)",
        "glow-lg": "0 0 70px -10px rgba(46, 241, 145, 0.45)",
        card: "0 4px 20px -4px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "grid-eco":
          "linear-gradient(to right, rgba(46,241,145,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(46,241,145,0.06) 1px, transparent 1px)",
        "radial-eco":
          "radial-gradient(circle at 50% 0%, rgba(46,241,145,0.18), transparent 60%)",
      },
      animation: {
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease-out both",
        scan: "scan 2.4s linear infinite",
        spin8: "spin 8s linear infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%,100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
