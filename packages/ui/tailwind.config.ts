import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
        },
        purple: {
          500: 'var(--color-purple-500)',
          600: 'var(--color-purple-600)',
          700: 'var(--color-purple-700)',
        },
        blue: {
          400: 'var(--color-blue-400)',
          500: 'var(--color-blue-500)',
          600: 'var(--color-blue-600)',
        },
        success: {
          400: 'var(--color-success-400)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600)',
        },
        warning: {
          400: 'var(--color-warning-400)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
        },
        danger: {
          400: 'var(--color-danger-400)',
          500: 'var(--color-danger-500)',
          600: 'var(--color-danger-600)',
        },
        gray: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)',
          400: 'var(--color-gray-400)',
          500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
        },
        glass: {
          bg: 'var(--color-glass-bg)',
          border: 'var(--color-glass-border)',
          hover: 'var(--color-glass-hover)',
        },
        theme: {
          'text-primary': 'var(--theme-text-primary)',
          'text-secondary': 'var(--theme-text-secondary)',
          'text-tertiary': 'var(--theme-text-tertiary)',
          'text-muted': 'var(--theme-text-muted)',
          'bg-primary': 'var(--theme-background-primary)',
          'bg-secondary': 'var(--theme-background-secondary)',
          'glass-bg': 'var(--theme-glass-bg)',
          'glass-border': 'var(--theme-glass-border)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family-base)'],
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        md: 'var(--font-size-md)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        '5xl': 'var(--font-size-5xl)',
        '6xl': 'var(--font-size-6xl)',
      },
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      lineHeight: {
        tight: 'var(--font-lineHeight-tight)',
        normal: 'var(--font-lineHeight-normal)',
        relaxed: 'var(--font-lineHeight-relaxed)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-background': 'var(--gradient-background)',
        'gradient-purple-blue': 'var(--gradient-purple-blue)',
        'gradient-success': 'var(--gradient-success)',
        'theme-gradient': 'var(--theme-gradient-background)',
      },
    },
  },
  plugins: [],
};

export default config;
