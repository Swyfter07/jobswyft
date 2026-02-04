import type { Meta, StoryObj } from '@storybook/react';
import { GlassButton } from './GlassButton';

const meta = {
  title: 'Glass Demos/GlassButton',
  component: GlassButton,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'gradient-purple',
      values: [
        {
          name: 'gradient-purple',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        {
          name: 'gradient-blue',
          value: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        },
        {
          name: 'gradient-pink',
          value: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
        },
        {
          name: 'black',
          value: '#000000',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['glass', 'glass-border', 'glass-solid', 'glass-glow'],
      description: 'Button glass variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
} satisfies Meta<typeof GlassButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Individual Variants
export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass Button',
  },
};

export const GlassBorder: Story = {
  args: {
    variant: 'glass-border',
    children: 'Glass Border',
  },
};

export const GlassSolid: Story = {
  args: {
    variant: 'glass-solid',
    children: 'Glass Solid',
  },
};

export const GlassGlow: Story = {
  args: {
    variant: 'glass-glow',
    children: 'Glass Glow',
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    variant: 'glass',
    disabled: true,
    children: 'Disabled Button',
  },
};

// All Variants Showcase
export const AllVariants: Story = {
  args: { children: '' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '40px' }}>
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: 'white' }}>Glass Variants</h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <GlassButton variant="glass">Glass</GlassButton>
          <GlassButton variant="glass-border">Border</GlassButton>
          <GlassButton variant="glass-solid">Solid</GlassButton>
          <GlassButton variant="glass-glow">Glow</GlassButton>
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px 0', color: 'white' }}>Sizes</h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <GlassButton size="sm">Small</GlassButton>
          <GlassButton size="md">Medium</GlassButton>
          <GlassButton size="lg">Large</GlassButton>
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px 0', color: 'white' }}>States</h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          <GlassButton>Normal</GlassButton>
          <GlassButton disabled>Disabled</GlassButton>
        </div>
      </div>
    </div>
  ),
};

// Button Group Demo
export const ButtonGroup: Story = {
  args: { children: '' },
  render: () => (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'inline-flex', gap: '1px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '4px' }}>
        <GlassButton variant="glass-solid" size="sm">
          Day
        </GlassButton>
        <GlassButton variant="glass" size="sm">
          Week
        </GlassButton>
        <GlassButton variant="glass" size="sm">
          Month
        </GlassButton>
        <GlassButton variant="glass" size="sm">
          Year
        </GlassButton>
      </div>
    </div>
  ),
};

// Dark vs Light Comparison
export const DarkLightComparison: Story = {
  args: { children: '' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', padding: '40px' }}>
      <div
        data-theme="dark"
        style={{
          padding: '30px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        }}
      >
        <h3 style={{ color: 'white', marginBottom: '20px', marginTop: 0 }}>Dark Mode</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <GlassButton variant="glass">Glass</GlassButton>
          <GlassButton variant="glass-border">Border</GlassButton>
          <GlassButton variant="glass-solid">Solid</GlassButton>
          <GlassButton variant="glass-glow">Glow</GlassButton>
        </div>
      </div>

      <div
        data-theme="light"
        style={{
          padding: '30px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        }}
      >
        <h3 style={{ color: '#1e293b', marginBottom: '20px', marginTop: 0 }}>Light Mode</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <GlassButton variant="glass">Glass</GlassButton>
          <GlassButton variant="glass-border">Border</GlassButton>
          <GlassButton variant="glass-solid">Solid</GlassButton>
          <GlassButton variant="glass-glow">Glow</GlassButton>
        </div>
      </div>
    </div>
  ),
};
