import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { Sparkles, Target, Briefcase, MapPin } from '../atoms/Icon';

const meta = {
  title: 'Glass Demos/Composite Examples',
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
          name: 'gradient-aurora',
          value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffd140 100%)',
        },
        {
          name: 'gradient-ocean',
          value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #43e97b 100%)',
        },
        {
          name: 'complex-pattern',
          value: `radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.5) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.5) 0%, transparent 50%),
                  radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
                  linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`,
        },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Job Card with Glass Effect
export const JobCard: Story = {
  render: () => (
    <div style={{ padding: '60px', maxWidth: '500px' }}>
      <GlassCard variant="frosted">
        <div style={{ display: 'flex', alignItems: 'start', gap: '16px', marginBottom: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Briefcase size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600' }}>
              Senior Product Designer
            </h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
              Airbnb • San Francisco, CA
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.6 }}>
            We're looking for a senior product designer to help shape the future of travel.
            You'll work on high-impact projects with cross-functional teams.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              fontSize: '12px',
              color: 'rgba(34, 197, 94, 1)',
            }}
          >
            Full-time
          </span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              fontSize: '12px',
              color: 'rgba(139, 92, 246, 1)',
            }}
          >
            Remote
          </span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: '12px',
              color: 'rgba(59, 130, 246, 1)',
            }}
          >
            $160k-$220k
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <GlassButton variant="glass-glow" style={{ flex: 1 }}>
            Apply Now
          </GlassButton>
          <GlassButton variant="glass-border">Save</GlassButton>
        </div>
      </GlassCard>
    </div>
  ),
};

// Dashboard Stats Cards
export const DashboardStats: Story = {
  render: () => (
    <div style={{ padding: '60px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <GlassCard variant="medium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Target size={20} color="white" />
            </div>
            <h4 style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Applications</h4>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>24</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            <span style={{ color: '#22c55e' }}>↑ 12%</span> from last week
          </div>
        </GlassCard>

        <GlassCard variant="medium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} color="white" />
            </div>
            <h4 style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Interviews</h4>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>8</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            <span style={{ color: '#22c55e' }}>↑ 4</span> scheduled this week
          </div>
        </GlassCard>

        <GlassCard variant="medium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={20} color="white" />
            </div>
            <h4 style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Offers</h4>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>3</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            <span style={{ color: '#f59e0b' }}>→</span> 2 pending decisions
          </div>
        </GlassCard>
      </div>
    </div>
  ),
};

// Layered Modal/Dialog
export const LayeredModal: Story = {
  render: () => (
    <div style={{ padding: '60px', minHeight: '600px', position: 'relative' }}>
      {/* Background overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          maxWidth: '500px',
          margin: '100px auto',
        }}
      >
        <GlassCard variant="frosted" style={{ padding: '32px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>
            Generate AI Cover Letter
          </h2>
          <p style={{ margin: '0 0 24px 0', opacity: 0.8 }}>
            Our AI will analyze the job description and create a personalized cover letter for you.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Job Title
            </label>
            <input
              type="text"
              placeholder="Senior Product Designer"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                backdropFilter: 'blur(8px)',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Company
            </label>
            <input
              type="text"
              placeholder="Airbnb"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                backdropFilter: 'blur(8px)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <GlassButton variant="glass-border">Cancel</GlassButton>
            <GlassButton variant="glass-glow">
              <Sparkles size={16} style={{ marginRight: '8px' }} />
              Generate
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </div>
  ),
};

// Hero Section
export const HeroSection: Story = {
  render: () => (
    <div style={{ padding: '80px 60px', minHeight: '600px', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <GlassCard variant="transparent" style={{ padding: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1
              style={{
                margin: '0 0 16px 0',
                fontSize: '56px',
                fontWeight: '800',
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Your AI Job Application Assistant
            </h1>
            <p style={{ margin: '0 auto', fontSize: '20px', opacity: 0.9, maxWidth: '600px' }}>
              Automate your job search with AI-powered cover letters, resume matching, and application tracking.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <GlassButton variant="glass-glow" size="lg">
              <Sparkles size={20} style={{ marginRight: '8px' }} />
              Get Started Free
            </GlassButton>
            <GlassButton variant="glass-border" size="lg">
              Watch Demo
            </GlassButton>
          </div>

          <div
            style={{
              marginTop: '48px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: '700', marginBottom: '8px' }}>10,000+</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Applications Sent</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: '700', marginBottom: '8px' }}>95%</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>Success Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', fontWeight: '700', marginBottom: '8px' }}>24/7</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>AI Assistance</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  ),
};

// Side-by-Side Dark/Light Comparison
export const DarkLightFull: Story = {
  render: () => (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Dark Mode */}
        <div
          data-theme="dark"
          style={{
            padding: '40px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          }}
        >
          <h3 style={{ color: 'white', marginTop: 0, marginBottom: '24px' }}>Dark Mode</h3>
          <GlassCard variant="frosted">
            <h4 style={{ margin: '0 0 12px 0' }}>Glassmorphism Effect</h4>
            <p style={{ margin: '0 0 16px 0', opacity: 0.9 }}>
              Glass effects work beautifully in dark mode with proper transparency and blur settings.
            </p>
            <GlassButton variant="glass-glow" style={{ width: '100%' }}>
              Learn More
            </GlassButton>
          </GlassCard>
        </div>

        {/* Light Mode */}
        <div
          data-theme="light"
          style={{
            padding: '40px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          }}
        >
          <h3 style={{ color: '#1e293b', marginTop: 0, marginBottom: '24px' }}>Light Mode</h3>
          <GlassCard variant="frosted">
            <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Glassmorphism Effect</h4>
            <p style={{ margin: '0 0 16px 0', opacity: 0.9, color: '#1e293b' }}>
              In light mode, glass effects use higher opacity and saturation for better visibility.
            </p>
            <GlassButton variant="glass-glow" style={{ width: '100%' }}>
              Learn More
            </GlassButton>
          </GlassCard>
        </div>
      </div>
    </div>
  ),
};
