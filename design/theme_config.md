# Theme Presets Configuration
**Trickle-Down Design System**

To change your app's entire look, copy the **CSS Variables** block from your chosen theme below and paste it into `packages/ui/src/styles/globals.css`, replacing the values inside the `:root` block.

## 1. Professional Blue (Trust & Corporate)
*Best for: Enterprise apps, minimal SaaS*

```css
    --primary: oklch(0.488 0.243 264.376); /* Deep Blue */
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0.01 254.6);
    --secondary-foreground: oklch(0.21 0.03 264);
    --accent: oklch(0.488 0.243 264.376);
    --accent-foreground: oklch(0.985 0 0);
    --radius: 0.5rem;
```

## 2. Energetic Orange (Modern & Startup)
*Best for: Consumer apps, creative tools (Current)*

```css
    --primary: oklch(0.67 0.16 58); /* Vibrant Orange */
    --primary-foreground: oklch(0.99 0.02 95);
    --secondary: oklch(0.967 0.001 286.375);
    --secondary-foreground: oklch(0.21 0.006 285.885);
    --accent: oklch(0.67 0.16 58);
    --accent-foreground: oklch(0.99 0.02 95);
    --radius: 0.625rem;
```

## 3. Nature Green (Calm & Eco)
*Best for: Finance, health, wellness*

```css
    --primary: oklch(0.623 0.188 145.42); /* Fresh Green */
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.975 0.01 150);
    --secondary-foreground: oklch(0.25 0.05 145);
    --accent: oklch(0.623 0.188 145.42);
    --accent-foreground: oklch(0.985 0 0);
    --radius: 0.75rem;
```

## 4. Neo-Dark (Cyber & Dev Tools)
*Best for: Developer tools, dashboard-heavy apps*

```css
    --primary: oklch(0.7 0.18 280); /* Electric Violet */
    --primary-foreground: oklch(0.1 0.05 280);
    --secondary: oklch(0.2 0.05 280);
    --secondary-foreground: oklch(0.9 0.05 280);
    --accent: oklch(0.7 0.18 280);
    --accent-foreground: oklch(0.1 0.05 280);
    --radius: 0.25rem; /* Sharp edges */
```

## How to Apply
1. Open `packages/ui/src/styles/globals.css`.
2. Locate the `:root { ... }` block.
3. Replace the `--primary`, `--secondary`, and `--radius` lines with your chosen block above.
4. Changes will apply immediately to Buttons, Inputs, Dialogs, and Badges.
