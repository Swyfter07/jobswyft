import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'info', 'purple', 'warning', 'danger'],
      description: 'Badge variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Badge size',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Full-time',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: '$150k-$200k',
  },
};

export const Purple: Story = {
  args: {
    variant: 'purple',
    children: 'Remote',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Pending',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Rejected',
  },
};

export const Small: Story = {
  args: {
    variant: 'info',
    size: 'sm',
    children: 'Small',
  },
};

export const Medium: Story = {
  args: {
    variant: 'info',
    size: 'md',
    children: 'Medium',
  },
};

// All Variants Showcase
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="success">Active</Badge>
      <Badge variant="info">742 / 1000</Badge>
      <Badge variant="purple">Premium</Badge>
      <Badge variant="warning">Low Credits</Badge>
      <Badge variant="danger">Expired</Badge>
    </div>
  ),
};

// All Sizes Showcase
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
};

// Job Status Example
export const JobStatusExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="info">Applied</Badge>
      <Badge variant="warning">Interview</Badge>
      <Badge variant="purple">Offer</Badge>
      <Badge variant="success">Accepted</Badge>
      <Badge variant="danger">Rejected</Badge>
    </div>
  ),
};

// Job Details Example
export const JobDetailsExample: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="success">Full-time</Badge>
      <Badge variant="info">$120k-$180k</Badge>
      <Badge variant="purple">Remote</Badge>
      <Badge variant="info">Senior Level</Badge>
    </div>
  ),
};
