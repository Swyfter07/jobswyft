# Credit Balance Component Design

## Overview
A compact, persistent card component that displays the user's remaining AI credits and provides a quick way to purchase more.

## Visual Design
- **Container**: `Card` component from Shadcn UI.
- **Size**: Small, distinct from the main Job/Resume cards. width ~200-250px.
- **Theme**: Uses standard system colors but with semantic coloring for status.

## UI Structure
### Header
- **Left**: `Zap` icon (size-4, muted-foreground) + "AI Credits" Label (Item-center).
- **Right**: "Buy More" action button (Ghost variant, icon-only `Plus` button).

### Body
- **Balance**: Large, bold number (e.g., "55") + Total (e.g., "/ 100").
- **Visualizer**: Shadcn `Progress` bar.
  - **Logic**: 
    - > 50%: Primary Color (Green/Brand)
    - 20-50%: Warning (Yellow/Amber)
    - < 20%: Danger (Red)
- **Percentage**: Small text helper showing percentage remaining.

## Interactions
- **Buy More**: Clicking the "+" icon triggers the purchasing flow (or callback).
- **Status Colors**: Progress bar changes color dynamically based on usage.

## Component API
```tsx
interface CreditBalanceProps {
  total: number;
  used: number;
  onBuyMore?: () => void;
  className?: string; // For positioning
}
```
