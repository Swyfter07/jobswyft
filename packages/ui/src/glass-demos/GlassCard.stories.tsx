import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from './GlassCard';

const meta = {
  title: 'Glass Demos/GlassCard',
  component: GlassCard,
  parameters: {
    layout: 'fullscreen',
    // Custom backgrounds for glassmorphism visibility
    backgrounds: {
      default: 'gradient-dark',
      values: [
        {
          name: 'gradient-dark',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        },
        {
          name: 'gradient-blue',
          value: 'linear-gradient(135deg, #667eea 0%, #3b82f6 50%, #60a5fa 100%)',
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
          name: 'image-pattern',
          value: `url('data:image/svg+xml,${encodeURIComponent(`
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(102,126,234);stop-opacity:1" />
                  <stop offset="50%" style="stop-color:rgb(118,75,162);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:rgb(240,147,251);stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect fill="url(#grad)" width="100" height="100"/>
              <circle cx="20" cy="20" r="15" fill="rgba(255,255,255,0.1)"/>
              <circle cx="80" cy="40" r="20" fill="rgba(255,255,255,0.05)"/>
              <circle cx="50" cy="80" r="25" fill="rgba(255,255,255,0.08)"/>
            </svg>
          `)}')`,
        },
        {
          name: 'black',
          value: '#000000',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['subtle', 'medium', 'strong', 'frosted', 'transparent'],
      description: 'Glass effect intensity',
    },
    border: {
      control: 'boolean',
      description: 'Show border',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '40px', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GlassCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample content for cards
const SampleContent = () => (
  <div>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600' }}>
      Glass Card Effect
    </h3>
    <p style={{ margin: '0 0 16px 0', opacity: 0.9 }}>
      This card demonstrates glassmorphism with varying levels of transparency and blur.
      Try switching between variants and backgrounds to see the effect.
    </p>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.15)',
          fontSize: '12px',
        }}
      >
        Glassmorphism
      </span>
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.15)',
          fontSize: '12px',
        }}
      >
        Backdrop Blur
      </span>
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.15)',
          fontSize: '12px',
        }}
      >
        Transparency
      </span>
    </div>
  </div>
);

// Individual Variants
export const Subtle: Story = {
  args: {
    variant: 'subtle',
    children: <SampleContent />,
  },
};

export const Medium: Story = {
  args: {
    variant: 'medium',
    children: <SampleContent />,
  },
};

export const Strong: Story = {
  args: {
    variant: 'strong',
    children: <SampleContent />,
  },
};

export const Frosted: Story = {
  args: {
    variant: 'frosted',
    children: <SampleContent />,
  },
};

export const Transparent: Story = {
  args: {
    variant: 'transparent',
    children: <SampleContent />,
  },
};

// Comparison View
export const AllVariants: Story = {
  args: { children: '' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
      <GlassCard variant="subtle">
        <h4 style={{ margin: '0 0 8px 0' }}>Subtle</h4>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
          Just transparency, no blur. Lightest effect.
        </p>
      </GlassCard>

      <GlassCard variant="medium">
        <h4 style={{ margin: '0 0 8px 0' }}>Medium</h4>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
          Light blur (8px) with transparency. Balanced look.
        </p>
      </GlassCard>

      <GlassCard variant="strong">
        <h4 style={{ margin: '0 0 8px 0' }}>Strong</h4>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
          Heavy blur (16px), more transparency. Prominent effect.
        </p>
      </GlassCard>

      <GlassCard variant="frosted">
        <h4 style={{ margin: '0 0 8px 0' }}>Frosted</h4>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
          Maximum blur (24px) with saturation. iOS-style.
        </p>
      </GlassCard>

      <GlassCard variant="transparent">
        <h4 style={{ margin: '0 0 8px 0' }}>Transparent</h4>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
          Nearly invisible (32px blur). Extreme glass.
        </p>
      </GlassCard>
    </div>
  ),
};

// Stacked Cards Demo
export const StackedCards: Story = {
  args: { children: '' },
  render: () => (
    <div style={{ position: 'relative', height: '500px' }}>
      <GlassCard
        variant="transparent"
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '400px',
          transform: 'rotate(-2deg)',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0' }}>Background Layer</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>Extreme transparency with 32px blur</p>
      </GlassCard>

      <GlassCard
        variant="medium"
        style={{
          position: 'absolute',
          top: '60px',
          left: '40px',
          width: '400px',
          transform: 'rotate(1deg)',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0' }}>Middle Layer</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>Medium glass effect with 8px blur</p>
      </GlassCard>

      <GlassCard
        variant="strong"
        style={{
          position: 'absolute',
          top: '120px',
          left: '80px',
          width: '400px',
          transform: 'rotate(-1deg)',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0' }}>Top Layer</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>Strong glass effect with 16px blur</p>
      </GlassCard>
    </div>
  ),
};

// Dark Mode vs Light Mode Comparison
export const DarkLightComparison: Story = {
  args: { children: '' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
      <div data-theme="dark" style={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>Dark Mode</h3>
        <GlassCard variant="frosted">
          <SampleContent />
        </GlassCard>
      </div>

      <div data-theme="light" style={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <h3 style={{ color: '#1e293b', marginBottom: '20px' }}>Light Mode</h3>
        <GlassCard variant="frosted">
          <SampleContent />
        </GlassCard>
      </div>
    </div>
  ),
};
