import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';

/**
 * Theme Demo Component
 *
 * Demonstrates the design token system and theme switching capability.
 * Use the theme toggle in the Storybook toolbar to switch between light and dark modes.
 */
function ThemeDemo() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{
        fontSize: 'var(--font-size-4xl)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--theme-text-primary)',
        marginBottom: 'var(--space-6)'
      }}>
        Design Tokens Demo
      </h1>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ color: 'var(--theme-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Current theme: <strong>{theme}</strong>
        </p>
        <button
          onClick={toggleTheme}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            backgroundColor: 'var(--color-primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
            boxShadow: 'var(--shadow-md)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-500)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Toggle Theme
        </button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <section>
          <h2 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--theme-text-primary)',
            marginBottom: 'var(--space-3)'
          }}>
            Color Palette
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {[
              { name: 'Primary', color: 'var(--color-primary-500)' },
              { name: 'Purple', color: 'var(--color-purple-500)' },
              { name: 'Blue', color: 'var(--color-blue-500)' },
              { name: 'Success', color: 'var(--color-success-500)' },
              { name: 'Warning', color: 'var(--color-warning-500)' },
              { name: 'Danger', color: 'var(--color-danger-500)' },
            ].map(({ name, color }) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: color,
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--space-2)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--theme-text-secondary)' }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--theme-text-primary)',
            marginBottom: 'var(--space-3)'
          }}>
            Typography Scale
          </h2>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--theme-text-secondary)' }}>
              Extra Small (11px) - var(--font-size-xs)
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--theme-text-secondary)' }}>
              Small (12px) - var(--font-size-sm)
            </p>
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--theme-text-secondary)' }}>
              Base (13px) - var(--font-size-base)
            </p>
            <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--theme-text-primary)' }}>
              Medium (14px) - var(--font-size-md)
            </p>
            <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--theme-text-primary)' }}>
              Large (15px) - var(--font-size-lg)
            </p>
            <p style={{ fontSize: 'var(--font-size-xl)', color: 'var(--theme-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
              Extra Large (16px) - var(--font-size-xl)
            </p>
          </div>
        </section>

        <section>
          <h2 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--theme-text-primary)',
            marginBottom: 'var(--space-3)'
          }}>
            Glassmorphism Effects
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div
              className="glass-bg"
              style={{
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-xl)',
                minWidth: '200px',
              }}
            >
              <p style={{ color: 'var(--theme-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                Glass Background
              </p>
              <p style={{ color: 'var(--theme-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
                Uses backdrop-filter for frosted glass effect
              </p>
            </div>
            <div
              className="section-glass"
              style={{
                padding: 'var(--space-6)',
                borderRadius: 'var(--radius-xl)',
                minWidth: '200px',
              }}
            >
              <p style={{ color: 'var(--theme-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                Section Glass
              </p>
              <p style={{ color: 'var(--theme-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
                Slightly different opacity for content sections
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--theme-text-primary)',
            marginBottom: 'var(--space-3)'
          }}>
            Shadows & Elevations
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            {[
              { name: 'Small', shadow: 'var(--shadow-sm)' },
              { name: 'Medium', shadow: 'var(--shadow-md)' },
              { name: 'Large', shadow: 'var(--shadow-lg)' },
              { name: 'Extra Large', shadow: 'var(--shadow-xl)' },
            ].map(({ name, shadow }) => (
              <div
                key={name}
                style={{
                  padding: 'var(--space-6)',
                  backgroundColor: 'var(--theme-glass-bg)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: shadow,
                  minWidth: '120px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--theme-text-primary)' }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// Wrapper to provide theme context
function ThemeDemoWithProvider() {
  return (
    <ThemeProvider>
      <ThemeDemo />
    </ThemeProvider>
  );
}

const meta = {
  title: 'Foundation/Theme Demo',
  component: ThemeDemoWithProvider,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Design Tokens & Theme System

This demo showcases the complete design token system and theme switching capability.

## Features Demonstrated:
- **Color Palette**: Primary, Purple, Blue, Success, Warning, Danger
- **Typography Scale**: xs (11px) to 6xl (48px)
- **Glassmorphism Effects**: Backdrop filter with blur and saturation
- **Shadow System**: 4 elevation levels (sm, md, lg, xl)
- **Theme Switching**: Dark and Light modes via toolbar

## How to Test:
1. Use the **Theme** toggle in the Storybook toolbar to switch between Dark and Light modes
2. Try different **viewport presets** (Mobile, Tablet, Desktop, Extension Popup)
3. Observe how design tokens adapt across themes

## Token Structure:
- Base tokens: \`var(--color-primary-500)\`
- Theme-aware tokens: \`var(--theme-text-primary)\`
- Effect tokens: \`var(--shadow-md)\`, \`var(--radius-lg)\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeDemoWithProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DarkTheme: Story = {
  parameters: {
    globals: { theme: 'dark' },
  },
};

export const LightTheme: Story = {
  parameters: {
    globals: { theme: 'light' },
  },
};
