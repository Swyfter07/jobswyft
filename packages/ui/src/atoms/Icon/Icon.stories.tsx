import type { Meta, StoryObj } from '@storybook/react';
import * as Icons from './index';

const meta = {
  title: 'Atoms/Icon',
  component: Icons.Icon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'number',
      description: 'Icon size in pixels',
    },
    color: {
      control: 'color',
      description: 'Icon color',
    },
    strokeWidth: {
      control: { type: 'range', min: 1, max: 4, step: 0.5 },
      description: 'Stroke width',
    },
  },
} satisfies Meta<typeof Icons.Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

// Single Icon Example
export const Default: Story = {
  render: () => <Icons.Zap size={24} />,
};

// All Standard Icons
export const AllIcons: Story = {
  render: () => {
    // Get all icon components except the base Icon
    const iconComponents = Object.entries(Icons).filter(
      ([name]) => name !== 'Icon' && name !== 'IconProps'
    );

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '24px',
          padding: '20px',
          maxWidth: '1200px',
        }}
      >
        {iconComponents.map(([name, IconComponent]) => (
          <div
            key={name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--theme-glass-bg)',
                border: '1px solid var(--theme-glass-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--theme-text-primary)',
              }}
            >
              <IconComponent size={24} />
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--theme-text-muted)',
                textAlign: 'center',
              }}
            >
              {name}
            </div>
          </div>
        ))}
      </div>
    );
  },
};

// Icon Sizes
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <Icons.Star size={16} />
        <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '8px' }}>
          16px
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icons.Star size={20} />
        <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '8px' }}>
          20px
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icons.Star size={24} />
        <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '8px' }}>
          24px
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icons.Star size={32} />
        <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '8px' }}>
          32px
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Icons.Star size={48} />
        <div style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '8px' }}>
          48px
        </div>
      </div>
    </div>
  ),
};

// Icon Colors
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Icons.Heart size={32} color="var(--color-primary-500)" />
      <Icons.Heart size={32} color="var(--color-danger-500)" />
      <Icons.Heart size={32} color="var(--color-success-500)" />
      <Icons.Heart size={32} color="var(--color-warning-500)" />
      <Icons.Heart size={32} color="var(--color-purple-500)" />
    </div>
  ),
};

// Navigation Icons
export const NavigationIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icons.Home size={24} />
      <Icons.Search size={24} />
      <Icons.Bell size={24} />
      <Icons.User size={24} />
      <Icons.Settings size={24} />
      <Icons.Menu size={24} />
    </div>
  ),
};

// Action Icons
export const ActionIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icons.Plus size={24} />
      <Icons.Edit size={24} />
      <Icons.Trash size={24} />
      <Icons.Copy size={24} />
      <Icons.Save size={24} />
      <Icons.Share size={24} />
      <Icons.Download size={24} />
      <Icons.Upload size={24} />
    </div>
  ),
};

// Status Icons
export const StatusIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icons.CheckCircle size={24} color="var(--color-success-500)" />
      <Icons.XCircle size={24} color="var(--color-danger-500)" />
      <Icons.AlertCircle size={24} color="var(--color-warning-500)" />
      <Icons.AlertTriangle size={24} color="var(--color-warning-500)" />
      <Icons.Info size={24} color="var(--color-blue-500)" />
    </div>
  ),
};

// AI Feature Icons
export const AIFeatureIcons: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '24px',
        maxWidth: '800px',
      }}
    >
      {/* AI Sparkle */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Icons.Sparkles size={28} color="white" />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          AI Sparkle
        </div>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>AI Studio</div>
      </div>

      {/* Brain */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
          }}
        >
          <Icons.Brain size={28} color="white" />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          AI Brain
        </div>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>Intelligence</div>
      </div>

      {/* Target */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
          }}
        >
          <Icons.Target size={28} color="white" />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          Match
        </div>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>Resume Match</div>
      </div>

      {/* Cover Letter */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
          }}
        >
          <Icons.FileText size={28} color="white" />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          Cover Letter
        </div>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>Generate</div>
      </div>

      {/* Message / Answer */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
          }}
        >
          <Icons.MessageSquare size={28} color="white" />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          Answer
        </div>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>Questions</div>
      </div>

      {/* Mail / Outreach */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(236, 72, 153, 0.3)',
          }}
        >
          <Icons.Mail size={28} color="white" />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          Outreach
        </div>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>Email</div>
      </div>

      {/* Wand / Magic */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(20, 184, 166, 0.3)',
          }}
        >
          <Icons.Wand size={28} color="white" />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          Magic
        </div>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>Autofill</div>
      </div>

      {/* Bot / AI Assistant */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Icons.Bot size={28} color="white" />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          AI Bot
        </div>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>Assistant</div>
      </div>

      {/* Scan / Analyze */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
          }}
        >
          <Icons.Scan size={28} color="white" />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--theme-text-primary)' }}>
          Scan
        </div>
        <div style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>Page Scan</div>
      </div>
    </div>
  ),
};

// Business Icons
export const BusinessIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icons.Briefcase size={24} />
      <Icons.Building size={24} />
      <Icons.MapPin size={24} />
      <Icons.Calendar size={24} />
      <Icons.Clock size={24} />
      <Icons.DollarSign size={24} />
    </div>
  ),
};

// Social Icons
export const SocialIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icons.Linkedin size={24} color="var(--color-blue-500)" />
      <Icons.Github size={24} />
      <Icons.Mail size={24} />
    </div>
  ),
};
