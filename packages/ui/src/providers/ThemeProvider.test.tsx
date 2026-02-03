import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component that uses the theme
function ThemeConsumer() {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('provides default dark theme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('sets data-theme attribute on document root', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('allows setting custom default theme', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists theme to localStorage', () => {
    render(
      <ThemeProvider storageKey="test-theme">
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(localStorageMock.getItem('test-theme')).toBe('dark');
  });

  it('toggles between light and dark', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    const toggleButton = screen.getByText('Toggle');

    // Initially dark
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

    // Toggle to light
    act(() => {
      toggleButton.click();
    });
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    // Toggle back to dark
    act(() => {
      toggleButton.click();
    });
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<ThemeConsumer />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});
