import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from './Typography';

const meta = {
  title: 'Atoms/Typography',
  component: Typography,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'body', 'bodyLarge', 'small', 'xs'],
      description: 'Typography variant',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'muted', 'success', 'danger', 'warning'],
      description: 'Text color',
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
      description: 'Font weight',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Text alignment',
    },
  },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

// Headings
export const Heading1: Story = {
  args: {
    variant: 'h1',
    children: 'Heading 1',
  },
};

export const Heading2: Story = {
  args: {
    variant: 'h2',
    children: 'Heading 2',
  },
};

export const Heading3: Story = {
  args: {
    variant: 'h3',
    children: 'Heading 3',
  },
};

export const Heading4: Story = {
  args: {
    variant: 'h4',
    children: 'Heading 4',
  },
};

// Body Text
export const BodyLarge: Story = {
  args: {
    variant: 'bodyLarge',
    children: 'This is large body text for important content.',
  },
};

export const Body: Story = {
  args: {
    variant: 'body',
    children: 'This is regular body text for standard content.',
  },
};

export const Small: Story = {
  args: {
    variant: 'small',
    children: 'This is small text for secondary content.',
  },
};

export const ExtraSmall: Story = {
  args: {
    variant: 'xs',
    children: 'This is extra small text for labels and captions.',
  },
};

// Colors
export const Primary: Story = {
  args: {
    color: 'primary',
    children: 'Primary text color',
  },
};

export const Secondary: Story = {
  args: {
    color: 'secondary',
    children: 'Secondary text color',
  },
};

export const Tertiary: Story = {
  args: {
    color: 'tertiary',
    children: 'Tertiary text color',
  },
};

export const Muted: Story = {
  args: {
    color: 'muted',
    children: 'Muted text color',
  },
};

export const Success: Story = {
  args: {
    color: 'success',
    children: 'Success text color',
  },
};

export const Danger: Story = {
  args: {
    color: 'danger',
    children: 'Danger text color',
  },
};

export const Warning: Story = {
  args: {
    color: 'warning',
    children: 'Warning text color',
  },
};

// Weights
export const WeightNormal: Story = {
  args: {
    weight: 'normal',
    children: 'Normal weight text',
  },
};

export const WeightMedium: Story = {
  args: {
    weight: 'medium',
    children: 'Medium weight text',
  },
};

export const WeightSemibold: Story = {
  args: {
    weight: 'semibold',
    children: 'Semibold weight text',
  },
};

export const WeightBold: Story = {
  args: {
    weight: 'bold',
    children: 'Bold weight text',
  },
};

// Alignment
export const AlignLeft: Story = {
  args: {
    align: 'left',
    children: 'Left aligned text',
  },
};

export const AlignCenter: Story = {
  args: {
    align: 'center',
    children: 'Center aligned text',
  },
};

export const AlignRight: Story = {
  args: {
    align: 'right',
    children: 'Right aligned text',
  },
};

// Typography Scale Showcase
export const TypographyScale: Story = {
  args: { children: '' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '600px' }}>
      <Typography variant="h1">Heading 1 - 48px Bold</Typography>
      <Typography variant="h2">Heading 2 - 28px Semibold</Typography>
      <Typography variant="h3">Heading 3 - 24px Semibold</Typography>
      <Typography variant="h4">Heading 4 - 20px Semibold</Typography>
      <Typography variant="bodyLarge">Body Large - 15px Regular</Typography>
      <Typography variant="body">Body - 13px Regular</Typography>
      <Typography variant="small">Small - 12px Regular</Typography>
      <Typography variant="xs">Extra Small - 11px Regular</Typography>
    </div>
  ),
};

// Color Palette Showcase
export const ColorPalette: Story = {
  args: { children: '' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Typography color="primary">Primary text color</Typography>
      <Typography color="secondary">Secondary text color</Typography>
      <Typography color="tertiary">Tertiary text color</Typography>
      <Typography color="muted">Muted text color</Typography>
      <Typography color="success">Success text color</Typography>
      <Typography color="danger">Danger text color</Typography>
      <Typography color="warning">Warning text color</Typography>
    </div>
  ),
};

// Real World Example
export const JobCardExample: Story = {
  args: { children: '' },
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <Typography variant="h3" as="h2">
        Senior Software Engineer
      </Typography>
      <Typography variant="body" color="secondary" style={{ marginTop: '0.5rem' }}>
        Google • Mountain View, CA
      </Typography>
      <Typography variant="body" color="tertiary" style={{ marginTop: '1rem' }}>
        We're looking for an experienced software engineer to join our team and work on
        cutting-edge projects that impact millions of users worldwide.
      </Typography>
      <Typography variant="xs" color="muted" style={{ marginTop: '1rem' }}>
        Posted 2 days ago
      </Typography>
    </div>
  ),
};
