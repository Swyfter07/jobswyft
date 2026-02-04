import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Sparkles } from '../atoms/Icon';

const meta = {
  title: 'Glass Demos/Three-Way Comparison',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'gradient-vibrant',
      values: [
        {
          name: 'gradient-vibrant',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        },
        {
          name: 'gradient-ocean',
          value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%)',
        },
        {
          name: 'gradient-sunset',
          value: 'linear-gradient(135deg, #ff6b6b 0%, #f59e0b 50%, #fbbf24 100%)',
        },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Button Comparison
export const ButtonComparison: Story = {
  render: () => (
    <div style={{ padding: '60px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
        {/* Custom Pure CSS Glass */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '32px 24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
              Custom Pure CSS
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', opacity: 0.8 }}>
              Hand-crafted CSS Modules with backdrop-filter
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <GlassButton variant="glass">Glass</GlassButton>
              <GlassButton variant="glass-border">Border</GlassButton>
              <GlassButton variant="glass-glow">
                <Sparkles size={16} style={{ marginRight: '8px' }} />
                Glow
              </GlassButton>
              <GlassButton variant="glass-solid">Solid</GlassButton>
            </div>
          </div>
        </div>

        {/* shadcn/ui with Custom Glass */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '32px 24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
              shadcn/ui + Custom Glass
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', opacity: 0.8 }}>
              shadcn components with glass Tailwind classes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button
                className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20"
                variant="outline"
              >
                Glass
              </Button>
              <Button
                className="bg-white/5 backdrop-blur-md border-2 border-white/30 hover:border-white/50"
                variant="outline"
              >
                Border
              </Button>
              <Button
                className="bg-white/15 backdrop-blur-md border border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
                variant="outline"
              >
                <Sparkles size={16} style={{ marginRight: '8px' }} />
                Glow
              </Button>
              <Button
                className="bg-white/90 backdrop-blur-md text-gray-900 hover:bg-white"
                variant="outline"
              >
                Solid
              </Button>
            </div>
          </div>
        </div>

        {/* glasscn-ui Library */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '32px 24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
              glasscn-ui Library
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', opacity: 0.8 }}>
              Pre-built glassmorphism component library
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button className="glass" variant="outline">
                Glass
              </Button>
              <Button className="glass-border" variant="outline">
                Border
              </Button>
              <Button className="glass-glow" variant="outline">
                <Sparkles size={16} style={{ marginRight: '8px' }} />
                Glow
              </Button>
              <Button className="glass-solid" variant="outline">
                Solid
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.9 }}>
        <p style={{ fontSize: '14px', margin: 0 }}>
          💡 <strong>Tip:</strong> Try switching backgrounds from the toolbar to see how each approach handles
          different gradients
        </p>
      </div>
    </div>
  ),
};

// Card Comparison
export const CardComparison: Story = {
  render: () => (
    <div style={{ padding: '60px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
        {/* Custom Pure CSS Glass */}
        <div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
              Custom Pure CSS
            </h3>
          </div>

          <GlassCard variant="frosted">
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>Product Designer</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', opacity: 0.8 }}>Airbnb • Remote</p>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', lineHeight: 1.6, opacity: 0.9 }}>
              Join our design team to shape the future of travel experiences.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <GlassButton variant="glass-glow" style={{ flex: 1 }}>
                Apply
              </GlassButton>
              <GlassButton variant="glass-border">Save</GlassButton>
            </div>
          </GlassCard>
        </div>

        {/* shadcn/ui with Custom Glass */}
        <div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
              shadcn/ui + Custom Glass
            </h3>
          </div>

          <Card className="bg-white/12 backdrop-blur-[24px] border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Product Designer</CardTitle>
              <CardDescription className="text-white/80">Airbnb • Remote</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-sm mb-4 leading-relaxed">
                Join our design team to shape the future of travel experiences.
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-white/15 backdrop-blur-md border border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  variant="outline"
                >
                  Apply
                </Button>
                <Button
                  className="bg-white/5 backdrop-blur-md border-2 border-white/30"
                  variant="outline"
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* glasscn-ui Library */}
        <div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
              glasscn-ui Library
            </h3>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Product Designer</CardTitle>
              <CardDescription className="text-white/80">Airbnb • Remote</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 text-sm mb-4 leading-relaxed">
                Join our design team to shape the future of travel experiences.
              </p>
              <div className="flex gap-2">
                <Button className="flex-1 glass-glow" variant="outline">
                  Apply
                </Button>
                <Button className="glass-border" variant="outline">
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center', opacity: 0.9 }}>
        <p style={{ fontSize: '14px', margin: 0 }}>
          💡 <strong>All three approaches use backdrop-filter</strong> - choose based on your project needs
        </p>
      </div>
    </div>
  ),
};

// Variants Showcase (Custom Glass Only)
export const VariantsShowcase: Story = {
  render: () => (
    <div style={{ padding: '60px' }}>
      <h2 style={{ margin: '0 0 32px 0', textAlign: 'center', fontSize: '32px', fontWeight: '700' }}>
        Glass Effect Variants
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <GlassCard variant="subtle">
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Subtle</h4>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
            blur: 0px • opacity: 5%
            <br />
            Minimal glass effect
          </p>
        </GlassCard>

        <GlassCard variant="medium">
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Medium</h4>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
            blur: 8px • opacity: 10%
            <br />
            Balanced glass effect
          </p>
        </GlassCard>

        <GlassCard variant="strong">
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Strong</h4>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
            blur: 16px • opacity: 15%
            <br />
            Prominent glass effect
          </p>
        </GlassCard>

        <GlassCard variant="frosted">
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Frosted</h4>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
            blur: 24px • saturate: 180%
            <br />
            iOS-style glass
          </p>
        </GlassCard>

        <GlassCard variant="transparent">
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Transparent</h4>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
            blur: 32px • opacity: 5%
            <br />
            Maximum transparency
          </p>
        </GlassCard>
      </div>

      <div style={{ marginTop: '48px', textAlign: 'center' }}>
        <GlassCard variant="frosted" style={{ display: 'inline-block', padding: '24px 32px' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Pro Tip:</strong> Use <code style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '13px'
            }}>frosted</code> variant for most UI elements
          </p>
        </GlassCard>
      </div>
    </div>
  ),
};

// Implementation Comparison
export const ImplementationGuide: Story = {
  render: () => (
    <div style={{ padding: '60px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 40px 0', textAlign: 'center', fontSize: '32px', fontWeight: '700' }}>
        Implementation Comparison
      </h2>

      <div style={{ display: 'grid', gap: '32px' }}>
        {/* Custom Pure CSS */}
        <GlassCard variant="medium">
          <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              🎨
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600' }}>
                Custom Pure CSS
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', lineHeight: 1.6, opacity: 0.9 }}>
                Hand-crafted CSS Modules with full control over every aspect of the glass effect.
              </p>
              <div style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.8 }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#22c55e' }}>✓ Pros:</strong> Maximum control, no dependencies, custom variants, optimized bundle size
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#ef4444' }}>✗ Cons:</strong> More code to maintain, manual dark/light mode handling
                </div>
                <div>
                  <strong>Best for:</strong> Projects needing unique glass effects or minimal dependencies
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* shadcn/ui + Custom */}
        <GlassCard variant="medium">
          <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              ⚡
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600' }}>
                shadcn/ui + Custom Glass
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', lineHeight: 1.6, opacity: 0.9 }}>
                Use shadcn components with custom Tailwind glass classes for flexibility.
              </p>
              <div style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.8 }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#22c55e' }}>✓ Pros:</strong> Tailwind utilities, component flexibility, easy customization, shadcn ecosystem
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#ef4444' }}>✗ Cons:</strong> Need to create glass variants manually
                </div>
                <div>
                  <strong>Best for:</strong> Projects already using shadcn/ui wanting custom glass effects
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* glasscn-ui */}
        <GlassCard variant="medium">
          <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              📦
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600' }}>
                glasscn-ui Library
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', lineHeight: 1.6, opacity: 0.9 }}>
                Pre-built glassmorphism library with ready-to-use components and Tailwind utilities.
              </p>
              <div style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.8 }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#22c55e' }}>✓ Pros:</strong> Instant setup, pre-made variants, consistent styling, Tailwind preset
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: '#ef4444' }}>✗ Cons:</strong> Additional dependency, less customization control
                </div>
                <div>
                  <strong>Best for:</strong> Projects wanting quick glassmorphism without custom CSS
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div style={{ marginTop: '48px', textAlign: 'center' }}>
        <GlassCard variant="frosted" style={{ display: 'inline-block', padding: '24px 40px' }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
            🎯 <strong>Recommendation:</strong> Start with <strong>shadcn/ui + custom glass</strong> for best flexibility
          </p>
        </GlassCard>
      </div>
    </div>
  ),
};
