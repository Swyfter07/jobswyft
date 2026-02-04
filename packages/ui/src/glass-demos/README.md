# Glass Effects Demo Collection

> Three approaches to glassmorphism: Custom CSS, shadcn/ui + Glass, and glasscn-ui library

## 🎨 What's Included

This demo collection showcases **three different approaches** to implementing glassmorphism effects in React:

1. **Custom Pure CSS** - Hand-crafted CSS Modules with backdrop-filter
2. **shadcn/ui + Custom Glass** - shadcn components with Tailwind glass utilities
3. **glasscn-ui Library** - Pre-built glassmorphism component library

### Components

1. **GlassCard** - 5 variants (subtle → transparent) [Custom CSS]
2. **GlassButton** - 4 variants (glass, border, solid, glow) [Custom CSS]
3. **Composite Demos** - Real-world examples
4. **Three-Way Comparison** - Side-by-side comparison of all approaches

---

## 📦 Glass Card Variants

| Variant | Blur | Opacity | Best For |
|---------|------|---------|----------|
| `subtle` | 0px | 5% | Minimal effect |
| `medium` | 8px | 10% | Balanced look |
| `strong` | 16px | 15% | Prominent glass |
| `frosted` | 24px | 12% + saturate | iOS-style |
| `transparent` | 32px | 5% | Extreme glass |

---

## 🎬 View in Storybook

```bash
cd packages/ui && pnpm storybook
```

**Stories:**
- **Glass Demos > Three-Way Comparison** - Compare all three approaches
  - Button Comparison
  - Card Comparison
  - Variants Showcase
  - Implementation Guide
- Glass Demos > GlassCard - All card variants (Custom CSS)
- Glass Demos > GlassButton - All button variants (Custom CSS)
- Glass Demos > Composite Examples - Real-world demos (Custom CSS)

**Try:**
- Switch backgrounds (toolbar) to see effects on different gradients
- Toggle dark/light themes
- Hover interactions

---

## 🎨 Key CSS Techniques

### Backdrop Filter (The Magic!)
```css
backdrop-filter: blur(16px) saturate(180%);
```

### Light Mode Adaptation
```css
[data-theme="light"] .glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px) saturate(200%);
}
```

### Glow Effect
```css
box-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
```

---

## 🚀 Three Implementation Approaches

### 1️⃣ Custom Pure CSS (Maximum Control)

**Best for:** Projects needing unique glass effects or minimal dependencies

```tsx
import { GlassCard, GlassButton } from '@jobswyft/ui';

<GlassCard variant="frosted">
  <h3>Product Designer</h3>
  <GlassButton variant="glass-glow">Apply Now</GlassButton>
</GlassCard>
```

**Pros:**
- ✅ Maximum control over every aspect
- ✅ No external dependencies
- ✅ Custom variants tailored to your design
- ✅ Optimized bundle size

**Cons:**
- ❌ More code to maintain
- ❌ Manual dark/light mode handling

---

### 2️⃣ shadcn/ui + Custom Glass (Recommended)

**Best for:** Projects already using shadcn/ui wanting custom glass effects

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

<Card className="bg-white/12 backdrop-blur-[24px] border-white/20">
  <Button className="bg-white/15 backdrop-blur-md border border-white/30
                     shadow-[0_0_40px_rgba(255,255,255,0.3)]">
    Apply Now
  </Button>
</Card>
```

**Pros:**
- ✅ Tailwind utilities for quick customization
- ✅ Component flexibility
- ✅ shadcn ecosystem benefits
- ✅ Easy to customize

**Cons:**
- ❌ Need to create glass variants manually
- ❌ Longer className strings

---

### 3️⃣ glasscn-ui Library (Quick Setup)

**Best for:** Projects wanting quick glassmorphism without custom CSS

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

<Card className="glass-card">
  <Button className="glass-glow">Apply Now</Button>
</Card>
```

**Pros:**
- ✅ Instant setup with pre-made variants
- ✅ Consistent styling out of the box
- ✅ Tailwind preset included
- ✅ Ready-to-use utility classes

**Cons:**
- ❌ Additional dependency
- ❌ Less customization control

---

## 📖 Quick Start

### Install glasscn-ui (Optional)

```bash
pnpm add glasscn-ui
```

Update `tailwind.config.ts`:
```ts
import { createTailwindPreset } from 'glasscn-ui';

export default {
  presets: [createTailwindPreset()],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/glasscn-ui/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest of config
};
```

Use glasscn-ui classes:
```tsx
<div className="glass">Glass effect</div>
<div className="glass-border">With border</div>
<div className="glass-glow">With glow</div>
```

---

## 🎯 Recommendation

For most projects: **shadcn/ui + Custom Glass**
- Gives you the flexibility of Tailwind utilities
- Works with existing shadcn components
- Easy to customize and iterate

---

**Created:** 2026-02-03
**Updated:** 2026-02-03
