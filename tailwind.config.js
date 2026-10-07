// Single source of truth for every consumer's color token map — see
// lyra-ui/tailwind-tokens.cjs's own doc comment. Never hand-copy this list:
// an unconfigured `bg-lyra-*`/`text-lyra-*`/`border-lyra-*` class generates
// zero CSS with no error.
const lyraColors = require("../lyra-ui/tailwind-tokens.cjs");

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "../lyra-ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...lyraColors,
      },
      borderRadius: {
        "lyra-none":  "var(--lyra-radius-none)",
        "lyra-xs":    "var(--lyra-radius-xs)",
        "lyra-sm":    "var(--lyra-radius-sm)",
        "lyra-md":    "var(--lyra-radius-md)",
        "lyra-lg":    "var(--lyra-radius-lg)",
        "lyra-xl":    "var(--lyra-radius-xl)",
        "lyra-round": "var(--lyra-radius-round)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      // Accordion height animation (lyra-ui's Accordion is built on
      // @radix-ui/react-accordion) — mirrors lyra-ui/tailwind.config.js.
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms ease-in-out",
        "accordion-up": "accordion-up 200ms ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
