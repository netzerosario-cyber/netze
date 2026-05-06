/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ← toggle via clase 'dark' en <html>
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0042cd',
          light:   '#0062fa',
          50:      '#eff6ff',
          100:     '#dbeafe',
          500:     '#0099f7',
          600:     '#0062fa',
          700:     '#0042cd',
          800:     '#000d36',
          cyan:    '#01d3f7',
          gray:    '#bac5d1',
        },
      },
    },
  },
  plugins: [],
};
