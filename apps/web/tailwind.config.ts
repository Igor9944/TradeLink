import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colour chapters tokens (from direction sheet)
        chapter: {
          ground: '#191919',
          surface: '#242424',
          ink: '#ffffff',
          muted: '#9a9a9a',
          accent: '#0c7866',
          'accent-ink': '#ffffff',
          rule: '#333333',
          // Chapter fields - one per section
          'field-1': '#d71e1e',
          'field-1-ink': '#ffffff',
          'field-2': '#1e4bd7',
          'field-2-ink': '#ffffff',
          'field-3': '#0c7866',
          'field-3-ink': '#ffffff',
          'field-4': '#ffe927',
          'field-4-ink': '#111111',
        },
        // Semantic aliases for backwards compatibility
        primary: {
          DEFAULT: '#0c7866',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#0c7866',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#ffe927',
          foreground: '#111111',
        },
        danger: {
          DEFAULT: '#d71e1e',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-jost)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jost)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'step-small': ['clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)', { lineHeight: '1.5' }],
        'step-body': ['clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)', { lineHeight: '1.5' }],
        'step-lead': ['clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)', { lineHeight: '1.4' }],
        'step-head': ['clamp(2rem, 1.3rem + 3.2vw, 4rem)', { lineHeight: '0.9', letterSpacing: '-0.03em', fontWeight: '700' }],
        'hero-statement': ['clamp(110px, 14vw, 220px)', { lineHeight: '0.82', letterSpacing: '-0.03em', fontWeight: '700' }],
        'section-heading': ['clamp(40px, 5vw, 80px)', { lineHeight: '0.9', letterSpacing: '-0.03em', fontWeight: '700' }],
      },
      spacing: {
        'gap': '12px',
        'gap-sm': '8px',
        'pad': '24px',
        'pad-lg': '40px',
        'section-gap': 'clamp(120px, 8vw, 240px)',
        'page-margin': 'clamp(24px, 4vw, 64px)',
      },
      borderRadius: {
        'card': '8px',
        'control': '6px',
      },
      animation: {
        'entrance': 'entrance 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'drift': 'drift 20s ease-in-out infinite alternate',
        'shutter': 'shutter-open 1100ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'section-enter': 'section-enter 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
      keyframes: {
        entrance: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.02) translate(1%, 1%)' },
        },
        'shutter-open': {
          '0%': { clipPath: 'inset(100% 0 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        'section-enter': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        'fast': '160ms',
        'base': '240ms',
        'slow': '400ms',
        'shutter': '1100ms',
        'stagger': '60ms',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}
export default config