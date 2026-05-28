/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          2: '#2d2d2d',
          3: '#666666',
          4: '#999999',
        },
        paper: {
          DEFAULT: '#f8f7f4',
          2: '#f0ede8',
          3: '#e5e0d8',
        },
        beat: {
          red: '#d4380d',
          'red-light': '#fff1ee',
          green: '#1a6b3c',
          'green-light': '#eaf5ef',
          blue: '#1a3a8a',
          'blue-light': '#eef2fb',
        },
        border: {
          DEFAULT: '#ddd9d2',
          dark: '#c8c2b8',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
            h1: { fontFamily: 'Playfair Display, Georgia, serif' },
            h2: { fontFamily: 'Playfair Display, Georgia, serif' },
            h3: { fontFamily: 'Playfair Display, Georgia, serif' },
          },
        },
      },
    },
  },
  plugins: [],
}
