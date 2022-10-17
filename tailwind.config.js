/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  content: ["./src/**/*.{astro,html,js,jsx,svelte,ts,tsx,vue}"],
  theme: {
    fontMetrics: {
      sans: {
        capHeight: 715,
        ascent: 958,
        descent: -242,
        lineGap: 0,
        unitsPerEm: 1000,
      },
    },
    extend: {
      fontFamily: {
        sans: ["Neue Montreal", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("tailwindcss-capsize")],
};
