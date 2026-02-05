# Resume Card Design System
**Version 1.1** | **Theme: Compact, Gradient & Outlined**

This document outlines the aesthetic and functional decisions for the `ResumeCard` component overhaul.

## 1. Core Philosophy
- **Density First**: Maximize vertical screen real estate without sacrificing readability.
- **Subtle Depth**: Use gradients and outlines instead of heavy solid backgrounds to create "lift" and "airiness".
- **Focus**: Content should be scan-able; interactive elements should be discoverable but not distracting.

## 2. Visual Architecture

### A. Compact Mode (Spacing)
- **Container Padding**: Reduced from `p-3` (12px) to `p-2` (8px).
- **Element Spacing**:
  - Vertical stack: `space-y-0.5` (2px).
  - Separator margins: `my-0.5`.
- **Goal**: Allow users to see more resume sections "above the fold".

### B. Color Strategy & Gradients
1.  **"Resume Blocks" Header (Primary)**
    -   **Background**: `bg-transparent`.
    -   **Hover**: Standard `bg-muted/50`.
    -   **Outline**: Persistent `border` (e.g., `border-orange-400`) in both expanded and collapsed states to clearly define the container.

2.  **Content Cards (Secondary)**
    -   *Applies to: Experience, Education, Projects, Certifications*
    -   **Background**: `bg-gradient-to-r from-gray-50/60 to-transparent`.
    -   **Border**: `border-border`.
    -   **Effect**: Creates a subtle differentiation from the white card background, grouping related details together.

### C. Typography
- **Font Family**: Inherited `Inter` (shadcn default).
- **Weights**:
    -   **Headers**: `font-semibold` (Primary navigation).
    -   **Metadata**: `font-medium` (Companies, Durations).
    -   **Body**: `text-muted-foreground` for descriptions.

## 3. Component Styling

### A. Badges & Chips
-   **Count Badges**: Accented (Orange/Primary) for visibility.
-   **Copy Chips** (Tech Stack/Skills):
    -   **Style**: *Outline* (`border-input`).
    -   **Background**: `bg-transparent`.
    -   **Hover**: Standard `hover:bg-accent`.
    -   **Why**: Reduces visual clutter compared to solid gray chips.

### B. Icons
-   **Size**: Standardized to `size-4` (16px) for headers, `size-3.5` for sub-items.
-   **Color**: `text-primary/70` or `text-muted-foreground` depending on hierarchy.

## 4. Interaction Patterns

### A. Accordion Behavior (Exclusive Expansion)
-   **Rule**: Only **one** major section (Personal Info, Experience, etc.) can be open at a time.
-   **UX Goal**: Prevents the card from becoming overwhelmingly long and keeps the user focused on one context.

### B. Copy Actions
-   **Primary**: "Copy All" button in section headers.
-   **Granular**: Individual copy buttons for specific fields/entries.
-   **Feedback**: Tooltips + checkmark icon transitions.
