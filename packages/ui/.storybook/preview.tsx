import type { Preview } from '@storybook/react';
import { useEffect } from 'react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'gradient-purple',
      values: [
        {
          name: 'gradient-purple',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        },
        {
          name: 'gradient-blue',
          value: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #60a5fa 100%)',
        },
        {
          name: 'gradient-sunset',
          value: 'linear-gradient(135deg, #ff6b6b 0%, #f59e0b 50%, #fbbf24 100%)',
        },
        {
          name: 'gradient-ocean',
          value: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 50%, #3b82f6 100%)',
        },
        {
          name: 'gradient-green',
          value: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #34d399 100%)',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'light',
          value: '#f8fafc',
        },
        {
          name: 'black',
          value: '#000000',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' },
        },
        extensionPopup: {
          name: 'Extension Popup',
          styles: { width: '400px', height: '600px' },
        },
      },
    },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'dark';

      useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
      }, [theme]);

      return (
        <div style={{ padding: '2rem' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
