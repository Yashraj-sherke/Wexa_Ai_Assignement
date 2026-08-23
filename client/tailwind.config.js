/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        panel: '#FFFFFF',
        line: '#E2E8F0',
        ink: '#0F172A',
        muted: '#64748B',
        accent: '#4F46E5',
        'accent-soft': '#EEF2FF',
        ok: '#059669',
        'ok-soft': '#ECFDF5',
        warn: '#D97706',
        'warn-soft': '#FFFBEB',
        bad: '#E11D48',
        'bad-soft': '#FFF1F2',
        graph: '#1E293B'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'glass': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'glass-md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'glass-lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      }
    }
  },
  plugins: []
};
