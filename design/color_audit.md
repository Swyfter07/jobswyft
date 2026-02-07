# JobSwyft Design System - Color Audit

This document details the current color usage across the JobSwyft application. It is intended to be used as a dataset for refining the color scheme.

## 1. Global Theme Mapping

The application uses color coding to distinguish between different functional areas (Agents/Tools):

| Functional Area | Primary Color Family | Usage Context |
| :--- | :--- | :--- |
| **Job Scanning & Analysis** | **Blue** (`blue-*`) | Job titles, analysis buttons, salary badges. |
| **AI Studio (Generation)** | **Violet** (`violet-*`) | Cover letter generation, AI tools, Studio header. |
| **Autofill (Data)** | **Emerald** (`emerald-*`) | Status indicators, autofill actions, readiness scores. |
| **Career Coach (Chat)** | **Orange** (`orange-*`) | Chat interface, coach actions, user messages. |
| **Credits & Premium** | **Amber/Orange** | Credit balance, upgrade incentives (gradient). |
| **Match Score** | **Green/Yellow/Red** | Traffic light system for compatibility scores (>80, >50, <50). |

---

## 2. Gradient Patterns

### Primary Action Buttons
All primary action buttons use a high-contrast, 3-stop linear gradient with a top border highlight and a colored glow on hover.

**Formula:**
- **Background:** `bg-gradient-to-br from-[color]-600 via-[color]-500 to-[color]-400`
- **Hover:** `hover:from-[color]-700 hover:via-[color]-600 hover:to-[color]-500`
- **Border:** `border-t border-white/20` (creates a 3D glass edge effect)
- **Shadow:** `shadow-md` (base) -> `shadow-lg shadow-[color]-500/40` (hover glow)
- **Transition:** `transition-all duration-300`

**Specific Implementations:**
- **Scan/Analyze:** Blue Gradient
- **Dive Deeper (Studio):** Violet Gradient
- **Talk to Coach:** Orange Gradient
- **Auto-Fill:** Emerald Gradient

### Headers
Component headers use a very subtle, transparent solid color to tint the area without being overwhelming.

- **Formula:** `bg-[color]-50/50 dark:bg-[color]-950/20`
- **Border:** `border-[color]-100 dark:border-[color]-900`

---

## 3. Element-Specific Colors

### Job Card (`job-card.tsx`)
- **Job Title:** `text-blue-700 dark:text-blue-400`
- **Salary Badge:** `text-blue-600 dark:text-blue-400` (for the dollar sign)
- **Match Score Ring:**
    - High (>80%): `from-green-50 to-green-100` (bg), `from-green-200 via-green-100 to-green-200` (ring)
    - Med (>50%): `from-yellow-50 to-yellow-100` (bg), `from-yellow-200 via-yellow-100 to-yellow-200` (ring)
    - Low (<50%): `from-red-50 to-red-100` (bg), `from-red-200 via-red-100 to-red-200` (ring)
- **Skill Pills:**
    - Matched: `bg-green-100 text-green-800 border-green-200`
    - Missing: `text-muted-foreground border-dashed` (Gray)

### AI Studio (`ai-studio.tsx`)
- **Tabs (Active State):**
    - Match: `data-[state=active]:bg-violet-50 text-violet-700 border-violet-500`
    - Cover Letter: `data-[state=active]:bg-blue-50 text-blue-700 border-blue-500`
    - Answer: `data-[state=active]:bg-emerald-50 text-emerald-700 border-emerald-500`
    - Outreach: `data-[state=active]:bg-orange-50 text-orange-700 border-orange-500`
- **Selection Chips (Active):**
    - Matches the tab color (e.g., `bg-blue-50 text-blue-700 border-blue-500` for Cover Letter).

### Autofill (`autofill.tsx`)
- **Progress Circle:** `bg-emerald-100 text-emerald-600`
- **Status Icons:**
    - Ready: `text-emerald-600`
    - Missing: `text-destructive` (Red)
    - Filled: `text-muted-foreground` (Gray)
- **Main Button:** Emerald Gradient (see section 2).

### Coach (`coach.tsx`)
- **Header Icon:** `bg-orange-100 text-orange-600`
- **User Message Bubble:** `bg-orange-600 text-white`
- **Assistant Message Bubble:** `bg-muted text-foreground` (Gray/Black)
- **Send Button:** Orange Gradient (see section 2).

### Credit Bar (`credit-bar.tsx`)
- **Icon Container:** `bg-gradient-to-br from-amber-400 to-orange-500` (Vibrant "pop")
- **Low Credits Warning:** `from-red-400 to-red-600`
- **Text:** `text-secondary-foreground` (Default), `text-red-600` (Low).

---

## 4. Dark Mode Considerations
- All custom colors have dark mode variatns (`dark:`) specified.
- **Backgrounds:** Typically `dark:bg-[color]-950` or `dark:bg-card`.
- **Text:** Typically `dark:text-[color]-400` (lighter shade for readability on dark backgrounds).
- **Borders:** `dark:border-[color]-900` (subtle integration).

## 5. Tailwind Configuration Reference
The project relies on standard Tailwind CSS colors (`slate`, `gray`, `zinc`, `neutral`, `stone`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`).

Custom utility classes (like `bg-background`, `text-primary`) are derived from Shadcn UI variables defined in `globals.css`:
- `primary`: HSL based (foreground/background)
- `secondary`: HSL based
- `muted`: HSL based
- `accent`: HSL based
- `destructive`: HSL based
