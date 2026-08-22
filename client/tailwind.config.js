/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f6f3',
        panel: '#ffffff',
        line: '#e2e0da',
        ink: '#1c1e21',
        muted: '#6b7075',
        accent: '#1f5f8b',
        'accent-soft': '#e8f0f6',
        ok: '#2e7d4f',
        'ok-soft': '#e9f4ed',
        warn: '#a3670a',
        'warn-soft': '#fbf1de',
        bad: '#a83a32',
        'bad-soft': '#f9ebe9',
        graph: '#22262b'
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace']
      }
    }
  },
  plugins: []
};
