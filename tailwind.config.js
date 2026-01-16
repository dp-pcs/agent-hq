/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for the app
        'hq-bg': '#0f1419',
        'hq-surface': '#1a1f26',
        'hq-border': '#2d333b',
        'hq-text': '#e6edf3',
        'hq-text-muted': '#7d8590',
        'hq-accent': '#58a6ff',
        'hq-success': '#3fb950',
        'hq-warning': '#d29922',
        'hq-error': '#f85149',
      },
    },
  },
  plugins: [],
}
