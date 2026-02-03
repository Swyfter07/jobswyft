---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
workflowStatus: complete
completedAt: '2026-01-30'
lastEdited: '2026-02-02'
editHistory:
  - date: '2026-02-02'
    changes: |
      - Added Epic 0: UI Component Library Migration (6 consolidated stories)
      - Rapid migration epic from storybook-demo to @jobswyft/ui
      - Story 0.1: Foundation (Design Tokens + UI Scaffold)
      - Story 0.2: Core Atoms (Icons 60+, Typography, Badge, Button)
      - Story 0.3: Form Atoms (Input, Textarea, Select, ProgressBar, Logo)
      - Story 0.4: Molecules (Card, Modal)
      - Story 0.5: Organisms (Navbar, JobCard, Tabs, EmptyState)
      - Story 0.6: Compositions (ExtensionSidebar, FAB, ExtensionPopup)
      - One-to-one visual mapping with exact color/styling preservation
      - Removed Epic 8 (Component Library Foundation) - superseded by Epic 0
      - Total epics now 8, total stories now 20
  - date: '2026-02-01'
    changes: |
      - Added Epic 8: Component Library Foundation (10 stories)
      - Updated epic scope to include component library infrastructure
      - Total epics now 8, total stories now 24
  - date: '2026-01-31'
    changes: |
      - FR19: Updated to clarify ephemeral extraction (not persisted to database)
      - FR36: Updated to include extracted application questions as ephemeral
  - date: '2026-01-31'
    changes: |
      - FR8: Updated to specify AI-powered resume parsing
      - Epic 2: Updated goal to mention AI parsing
      - Story 2.1: Title and description updated for AI parsing
      - Story 2.1: Technical notes updated to specify AI provider usage
      - Story 2.1: Acceptance criteria updated to mention AI extraction
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
  - storybook-demo/packages (migration source)
workflowType: 'epics-and-stories'
project_name: 'Jobswyft'
user_name: 'jobswyft'
date: '2026-01-30'
implementationPriority: 'Epic 0 (UI Migration) → Backend API (Epics 1-7) → Extension/Dashboard UI'
epicScope: 'UI Migration (Epic 0) + Backend API (Epics 1-7)'
storySize: 'Fast-paced stories for rapid development'
totalEpics: 8
totalStories: 20
totalFRsCovered: 80
---

# Jobswyft - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Jobswyft, decomposing the requirements from the PRD and Architecture into implementable stories.

---

# RAPID MIGRATION EPIC

## Epic 0: UI Component Library Migration (PRIORITY)

**Goal:** Rapidly migrate all design tokens and components from storybook-demo to `@jobswyft/ui` using shadcn/Tailwind architecture while preserving exact visual appearance, feel, and UX.

**Source:** `/Users/enigma/Documents/Projects/storybook-demo/packages`
**Target:** `/Users/enigma/Documents/Projects/jobswyft/packages/`

**Approach:**
- One-to-one visual mapping from demo to new framework
- Use Tailwind utilities + CSS Modules for glassmorphism effects
- shadcn/ui primitives for accessible interactive components
- Storybook documentation for all components
- Fast-paced development with minimal overhead

**Total Stories:** 6 | **Focus:** Foundation + 9 Atoms + 2 Molecules + 4 Organisms + 4 Compositions

---

### Story 0.1: Foundation (Design Tokens + UI Scaffold)

**As a** developer,
**I want** design tokens and UI package infrastructure set up,
**So that** all components share a single source of truth and proper tooling.

**Acceptance Criteria:**

**Design Tokens Package (`packages/design-tokens/`):**

**Given** the storybook-demo design tokens exist
**When** I create the design-tokens package
**Then** the following token files are created:
- `tokens/colors.json` - Primary (#6366f1), purple (#8b5cf6), blue (#3b82f6), success (#22c55e), warning (#f59e0b), danger (#ef4444), grays, glass, gradients
- `tokens/typography.json` - Font family (system), sizes (xs 11px → 6xl 48px), weights (400-700), line heights (tight 1.2, normal 1.5, relaxed 1.6)
- `tokens/spacing.json` - 4px base unit scale (1-10: 4px → 40px)
- `tokens/shadows.json` - sm (0 2px 8px), md (0 4px 16px), lg (0 10px 40px), xl (0 20px 60px)
- `tokens/borders.json` - Border radii (sm 6px, md 8px, lg 10px, xl 12px, 2xl 16px, 3xl 20px)
- `tokens/transitions.json` - fast (0.15s ease), base (0.2s ease), slow (0.3s ease)
- `tokens/themes/dark.json` - Dark theme (bg #0f1419, secondary #1e3a5f, glass rgba(255,255,255,0.05), text primary rgba(255,255,255,1))
- `tokens/themes/light.json` - Light theme (bg #f8fafc, secondary #e0e7ff, glass rgba(255,255,255,0.7), text primary #0f172a)
**And** Style Dictionary builds to `dist/tokens.css`, `dist/themes.css`, `dist/tokens.js`
**And** CSS variables match exact values from demo

**UI Package Scaffold (`packages/ui/`):**

**Given** the design-tokens package exists
**When** I scaffold the UI package
**Then** the following structure exists:
```
packages/ui/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .storybook/main.ts, preview.tsx
├── src/
│   ├── index.ts
│   ├── styles/globals.css
│   ├── utils/cn.ts
│   ├── providers/ThemeProvider.tsx
│   ├── hooks/index.ts
│   └── test/setup.ts
```
**And** `cn()` utility combines clsx + tailwind-merge
**And** ThemeProvider supports dark/light via `data-theme` attribute
**And** Storybook runs with theme toggle decorator and viewport presets (Extension: 400x800, Dashboard: responsive)
**And** Tailwind config extends design-token CSS variables for colors, spacing, radii, fonts
**And** globals.css imports `@jobswyft/design-tokens/dist/tokens.css` and `themes.css`

**Tasks:**
- [ ] Create `packages/design-tokens/` structure with package.json, tsconfig.json
- [ ] Create all token JSON files with exact values from demo
- [ ] Create dark/light theme files
- [ ] Configure Style Dictionary build script
- [ ] Create `packages/ui/` structure with package.json, tsconfig.json, vite.config.ts
- [ ] Implement `cn()` utility (clsx + tailwind-merge)
- [ ] Create ThemeProvider with data-theme attribute switching
- [ ] Configure Tailwind to consume design-token CSS variables
- [ ] Set up Storybook with main.ts, preview.tsx (theme decorator, viewport presets)
- [ ] Create globals.css importing design tokens
- [ ] Verify Storybook launches at localhost:6006
- [ ] Verify theme toggle works in Storybook

---

### Story 0.2: Core Atoms (Icons, Typography, Badge, Button)

**As a** developer,
**I want** core atomic components migrated,
**So that** I have foundational building blocks for all UI.

**Acceptance Criteria:**

**Icon System (60+ icons):**

**Given** storybook-demo has 60+ icons
**When** I migrate the Icon system
**Then** all icons are available as named exports:
- Navigation: Home, Search, Bell, User, Settings, Menu
- Actions: Plus, Edit, Trash, Copy, Save, Share, Download, Upload, Wand, Scan
- Chevrons: ChevronDown, ChevronLeft, ChevronRight, ChevronUp
- Status: Check, CheckCircle, CheckSquare, AlertCircle, AlertTriangle, Info, X, XCircle
- Business: Briefcase, Building, MapPin, Calendar, Clock, DollarSign, Target, Bookmark, Eye, EyeOff, FileText, File, Filter, Folder, Lock, Mail, MessageSquare, MoreHorizontal, MoreVertical, Rocket, Zap, Heart
- AI/Tech: Bot, Brain, Sparkles
- Theme: Sun, Moon
- Social: Github, Linkedin
- Charts: BarChart
**And** each icon accepts `size`, `color`, `strokeWidth`, `className` props
**And** defaults: size=24, color=currentColor, strokeWidth=2
**And** Icon wrapper component exists for dynamic icon rendering by name

**Typography:**

**Given** the demo Typography component
**When** I migrate Typography
**Then** it supports:
- `variant`: h1, h2, h3, h4, body, bodyLarge, small, xs
- `color`: primary, secondary, tertiary, muted, success, danger, warning
- `weight`: normal (400), medium (500), semibold (600), bold (700)
- `align`: left, center, right
- `as`: polymorphic element type (default: h1→h1, h2→h2, body→p, small→small)
**And** font sizes match demo: h1=48px, h2=24px, h3=20px, h4=18px, body=14px, bodyLarge=15px, small=12px, xs=11px

**Badge:**

**Given** the demo Badge component
**When** I migrate Badge
**Then** it supports:
- `variant`: success (green #22c55e), info (blue #3b82f6), purple (#8b5cf6), warning (orange #f59e0b), danger (red #ef4444)
- `size`: sm, md
**And** styling matches demo exactly (border-radius, padding, font-size)

**Button:**

**Given** the demo Button component
**When** I migrate Button
**Then** it supports:
- `variant`: primary, secondary, tertiary, success, danger
- `size`: sm (8px 16px), md (12px 24px), lg (14px 28px)
- `loading`: boolean with spinner animation
- `leftIcon`, `rightIcon`: ReactNode
- `fullWidth`: boolean
- `disabled`: boolean
**And** primary variant has gradient background (`linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`)
**And** secondary variant has glassmorphism styling (glass-bg, glass-border, backdrop-filter blur)
**And** tertiary variant is transparent with hover background
**And** hover states: primary lifts with glow shadow, secondary brightens
**And** loading state shows spinner icon and disables interaction

**Tasks:**
- [ ] Create `src/atoms/Icon/` directory with all 60+ icon components
- [ ] Create Icon wrapper component with size/color/strokeWidth props
- [ ] Create Icon.stories.tsx showing all icons in grid
- [ ] Create Typography component with all variants
- [ ] Create Typography.module.css with font styles from tokens
- [ ] Create Typography.stories.tsx
- [ ] Create Badge component with all variants
- [ ] Create Badge.module.css
- [ ] Create Badge.stories.tsx
- [ ] Create Button component with all variants
- [ ] Create Button.module.css with gradient, glassmorphism, loading spinner
- [ ] Create Button.stories.tsx showing all variants, sizes, states
- [ ] Export all components from index.ts
- [ ] Verify visual match with demo for each component

---

### Story 0.3: Form Atoms (Input, Textarea, Select, ProgressBar, Logo)

**As a** developer,
**I want** form input atoms and utility atoms migrated,
**So that** forms and branding are consistent.

**Acceptance Criteria:**

**Input:**

**Given** the demo Input component
**When** I migrate Input
**Then** it supports:
- `size`: sm, md, lg
- `error`: boolean (red border styling)
- `fullWidth`: boolean
- `leftIcon`, `rightIcon`: ReactNode
- `placeholder`, `disabled`: standard input props
**And** styling uses glassmorphism background with subtle border
**And** focus state shows primary color ring
**And** error state shows danger color border

**Textarea:**

**Given** the demo Textarea component
**When** I migrate Textarea
**Then** it supports:
- `size`: sm, md, lg
- `error`: boolean
- `fullWidth`: boolean
- `resize`: 'none' | 'both' | 'horizontal' | 'vertical' (default: 'vertical')
- `disabled`: boolean
**And** styling matches Input (glassmorphism, focus ring, error state)

**Select:**

**Given** the demo Select component
**When** I migrate Select
**Then** it supports:
- `size`: sm, md, lg
- `error`: boolean
- `fullWidth`: boolean
- `leftIcon`: ReactNode
- `options`: array of {value, label, disabled}
- `placeholder`: string
- `disabled`: boolean
**And** has chevron down indicator
**And** styling matches Input (glassmorphism, focus ring)

**ProgressBar:**

**Given** the demo ProgressBar component
**When** I migrate ProgressBar
**Then** it supports:
- `value`: number (0-100, required)
- `max`: number (default 100)
- `size`: sm, md, lg
- `variant`: primary, blue, success, warning, danger (or auto-select by percentage)
- `showLabel`: boolean
- `label`: string (custom label text)
- `showPercentage`: boolean (shows % inside bar)
- `animated`: boolean (shimmer effect)
**And** auto-color selection: 100%=success, ≥70%=primary, ≥40%=blue, ≥20%=warning, <20%=danger
**And** animated variant has left-to-right shimmer effect

**Logo:**

**Given** the demo Logo component
**When** I migrate Logo
**Then** it supports:
- `variant`: 'full' (icon+text), 'icon', 'text'
- `size`: sm, md, lg, xl
**And** text displays "JobSwyft"
**And** icon is the Zap icon with gradient fill
**And** text has gradient styling matching primary colors

**Tasks:**
- [ ] Create Input component with all props
- [ ] Create Input.module.css with glassmorphism, focus, error states
- [ ] Create Input.stories.tsx
- [ ] Create Textarea component with resize options
- [ ] Create Textarea.module.css
- [ ] Create Textarea.stories.tsx
- [ ] Create Select component with options array
- [ ] Create Select.module.css with chevron indicator
- [ ] Create Select.stories.tsx
- [ ] Create ProgressBar component with auto-color logic
- [ ] Create ProgressBar.module.css with shimmer animation
- [ ] Create ProgressBar.stories.tsx showing all variants
- [ ] Create Logo component with icon SVG and gradient text
- [ ] Create Logo.module.css
- [ ] Create Logo.stories.tsx showing all variants/sizes
- [ ] Export all components from index.ts
- [ ] Verify visual match with demo

---

### Story 0.4: Molecules (Card, Modal)

**As a** developer,
**I want** Card and Modal molecules migrated,
**So that** content containers and dialogs are consistent.

**Acceptance Criteria:**

**Card:**

**Given** the demo Card component
**When** I migrate Card
**Then** it supports:
- `variant`: 'default' (glassmorphism), 'outlined' (border only), 'elevated' (shadow)
- `padding`: 'none', 'sm' (12px), 'md' (16px), 'lg' (24px)
- `interactive`: boolean (hover effects)
- `header`: ReactNode (optional header section)
- `footer`: ReactNode (optional footer section)
- `children`: ReactNode (content area, required)
**And** default variant has glassmorphism background (glass-bg, glass-border, backdrop-filter)
**And** interactive variant has hover lift effect (translateY, shadow increase)
**And** elevated variant has prominent shadow without glassmorphism
**And** header/footer sections have subtle dividers

**Modal:**

**Given** the demo Modal component
**When** I migrate Modal
**Then** it supports:
- `open`: boolean (required, controls visibility)
- `onClose`: () => void (required, close handler)
- `title`: string (optional header title)
- `description`: string (optional header description)
- `children`: ReactNode (required, content area)
- `footer`: ReactNode (optional footer for action buttons)
- `size`: 'sm' (320px), 'md' (480px), 'lg' (640px), 'xl' (800px)
- `showCloseButton`: boolean (default true)
- `closeOnBackdropClick`: boolean (default true)
- `closeOnEscape`: boolean (default true)
**And** renders via React Portal to document.body
**And** traps focus within modal (Tab cycles through focusable elements)
**And** locks body scroll when open (overflow: hidden on body)
**And** has ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` for title
**And** Escape key triggers onClose when closeOnEscape is true
**And** backdrop click triggers onClose when closeOnBackdropClick is true
**And** open/close animation: fade backdrop + scale content (200ms)

**Tasks:**
- [ ] Create Card component with header/footer slots
- [ ] Create Card.module.css with glassmorphism, outlined, elevated variants
- [ ] Implement interactive hover effect (lift + shadow)
- [ ] Create Card.stories.tsx showing all variant/padding combinations
- [ ] Create Modal component with React Portal
- [ ] Implement focus trap logic (cycle through focusable elements)
- [ ] Implement body scroll lock (add/remove overflow:hidden)
- [ ] Add all ARIA attributes for accessibility
- [ ] Implement Escape key and backdrop click handlers
- [ ] Create Modal.module.css with backdrop fade + content scale animations
- [ ] Create Modal.stories.tsx showing all sizes and states
- [ ] Export all components from index.ts
- [ ] Verify visual match with demo

---

### Story 0.5: Organisms (Navbar, JobCard, Tabs, EmptyState)

**As a** developer,
**I want** all organism components migrated,
**So that** complex UI sections are consistent.

**Acceptance Criteria:**

**Navbar:**

**Given** the demo Navbar component
**When** I migrate Navbar
**Then** it supports:
- `logo`: ReactNode (optional, displayed on left)
- `navItems`: array of {label, icon?, active?, onClick?, href?} (optional)
- `showThemeToggle`: boolean (default true)
- `theme`: 'light' | 'dark' (current theme)
- `onThemeToggle`: () => void (theme switch callback)
- `user`: {name, avatar?, email?} (optional, displays user button)
- `onUserMenuClick`: () => void (user button callback)
- `actions`: ReactNode (optional, custom actions on right)
**And** theme toggle shows Sun icon (light theme) or Moon icon (dark theme)
**And** user button shows avatar image if provided, else first initial of name
**And** active nav item has visual indicator (underline or background)
**And** layout: logo + nav items on left, actions + theme toggle + user on right

**JobCard:**

**Given** the demo JobCard component
**When** I migrate JobCard
**Then** it supports:
- `company`: string (required)
- `title`: string (required)
- `location`: string (optional, with MapPin icon)
- `salary`: string (optional, blue badge)
- `employmentType`: string (optional, green badge)
- `postedDate`: string (optional, with Clock icon)
- `logo`: string | ReactNode (optional, company logo)
- `description`: string (optional, excerpt text)
- `tags`: string[] (optional, skill tags)
- `bookmarked`: boolean (default false)
- `onBookmarkClick`: () => void (toggle callback)
- `onCardClick`: () => void (card click callback)
- `onApplyClick`: () => void (apply button callback)
- `showApplyButton`: boolean (default true)
**And** logo shows image if URL string, renders ReactNode if provided, else shows company initial fallback
**And** tags show first 3 with "+N more" badge if more than 3
**And** employment type badge is success (green) variant
**And** salary badge is info (blue) variant
**And** bookmark icon toggles between outline and filled states
**And** Quick Apply button has Zap icon
**And** card has interactive hover effect

**Tabs:**

**Given** the demo Tabs component
**When** I migrate Tabs
**Then** it supports:
- `tabs`: array of {value, label, icon?, content?, disabled?, badge?} (required)
- `value`: string (controlled mode - active tab value)
- `defaultValue`: string (uncontrolled mode - initial tab)
- `onChange`: (value: string) => void (tab change callback)
- `variant`: 'line' (underline style), 'pills' (button style)
- `fullWidth`: boolean (tabs stretch to fill width)
**And** Tab object badge shows count/text on tab
**And** disabled tabs are visually muted and not clickable
**And** has ARIA: `role="tablist"` on container, `role="tab"` on tabs, `role="tabpanel"` on content
**And** active tab has `aria-selected="true"`, disabled has `aria-disabled="true"`
**And** content renders based on active tab's `content` property

**EmptyState:**

**Given** the demo EmptyState component
**When** I migrate EmptyState
**Then** it supports:
- `icon`: ReactNode (optional illustration/icon)
- `title`: string (required)
- `description`: string (optional)
- `primaryAction`: {label, icon?, onClick} (optional primary button)
- `secondaryAction`: {label, icon?, onClick} (optional secondary button)
- `size`: 'sm', 'md', 'lg' (affects typography)
**And** centered layout
**And** size affects title: lg=h2, md=h3, sm=h4
**And** primary action uses primary Button variant
**And** secondary action uses secondary Button variant

**Tasks:**
- [ ] Create Navbar component with all slots
- [ ] Implement theme toggle with Sun/Moon icon swap
- [ ] Create user avatar with image/initial fallback
- [ ] Create Navbar.module.css
- [ ] Create Navbar.stories.tsx
- [ ] Create JobCard component with all features
- [ ] Implement logo fallback (image/node/initial)
- [ ] Implement tag overflow logic (first 3 + "+N more")
- [ ] Create bookmark toggle (outline/filled)
- [ ] Create JobCard.module.css with hover effects
- [ ] Create JobCard.stories.tsx
- [ ] Create Tabs component with controlled/uncontrolled modes
- [ ] Implement line and pills variants
- [ ] Add all ARIA attributes
- [ ] Create Tabs.module.css
- [ ] Create Tabs.stories.tsx with icons, badges, disabled tabs
- [ ] Create EmptyState component with action buttons
- [ ] Create EmptyState.module.css
- [ ] Create EmptyState.stories.tsx showing all sizes
- [ ] Export all components from index.ts
- [ ] Verify visual match with demo for each component

---

### Story 0.6: Compositions (ExtensionSidebar, FAB, ExtensionPopup)

**As a** developer,
**I want** all composition components migrated,
**So that** complete UI sections are ready for integration.

**Acceptance Criteria:**

**ExtensionSidebar:**

**Given** the demo ExtensionSidebar component
**When** I migrate ExtensionSidebar
**Then** it supports:
- `open`: boolean (default true)
- `onClose`: () => void (close button callback)
- `showQuickApply`: boolean (default false)
- `currentJob`: {title, company, location, salary?} (optional, current job context)
- `width`: number (default 400)
**And** structure includes:
  - **Header:** Logo (full variant) + close button (X icon)
  - **Resume Tray (expandable section):**
    - Resume file selector dropdown
    - Upload/Select buttons
    - Skills display (Badge components, collapsible)
    - Experience section (expandable/collapsible)
    - Education section (expandable/collapsible)
  - **Quick Apply section** (conditional on showQuickApply + currentJob)
  - **Main tabs:** Insights, AI Tools, Autofill, Jobs (using Tabs component)
  - **Footer:** AI Credits ProgressBar + usage text
**And** width defaults to 400px, full viewport height
**And** glassmorphism styling matches demo exactly (dark theme default)

**Insights Tab content:**
- Resume Match score card (percentage with ProgressBar)
- Match details with checkmark icons for matches
- Skills matched count
- Experience level match
- Warnings section for missing skills/requirements

**AI Tools Tab content:**
- Cover Letter card with Wand icon
- Resume Optimizer card with FileText icon
- Answer Helper card with MessageSquare icon
- Deep Match Analysis card with Target icon
- Chat with AI card with Bot icon
- Each card has gradient icon background

**Autofill Tab content:**
- Smart autofill status indicator
- Recent autofill history list

**Jobs Tab content:**
- Application progress tracker (Applied → Screening → Interview → Offer)
- Tracked jobs list with JobCard-like items

**FloatingActionButton:**

**Given** the demo FloatingActionButton component
**When** I migrate FloatingActionButton
**Then** it supports:
- `onClick`: () => void (click callback)
- `showBadge`: boolean (default false)
- `badgeCount`: number (optional, notification count)
- `position`: 'bottom-right' | 'bottom-left' (default 'bottom-right')
**And** uses Zap icon with gradient background
**And** fixed position floating in viewport corner
**And** badge shows count if showBadge=true and badgeCount provided
**And** hover effect: scale up slightly, glow shadow

**ExtensionPopup:**

**Given** the demo ExtensionPopup component
**When** I migrate ExtensionPopup
**Then** it supports:
- `open`: boolean (default true)
- `onClose`: () => void (close callback)
- `position`: 'top-right' | 'bottom-right' | 'center' (default 'bottom-right')
- `showQuickApply`: boolean (default false)
- `currentJob`: {title, company, location} (optional)
**And** structure includes:
  - **Header:** Logo + close button
  - **Quick Apply section** (conditional)
  - **Stats display:** Applications, Interviews, Offers (numeric counts)
  - **AI Credits:** ProgressBar showing remaining credits
  - **Tabs:** Dashboard, AI Studio
**And** Dashboard tab shows recent jobs list + "Add New Job" button
**And** AI Studio tab shows generation options (Cover Letter, Resume Match, Answer Questions) with gradient icons
**And** backdrop overlay with click-to-close

**Tasks:**
- [ ] Create ExtensionSidebar composition component
- [ ] Implement Resume Tray with expandable sections (Skills, Experience, Education)
- [ ] Implement all 4 tabs (Insights, AI Tools, Autofill, Jobs) with content
- [ ] Create glassmorphism styling for sidebar
- [ ] Create ExtensionSidebar.stories.tsx with all states (open/closed, with/without job)
- [ ] Create FloatingActionButton component
- [ ] Implement badge with count display
- [ ] Create hover effects (scale + glow)
- [ ] Create FloatingActionButton.module.css
- [ ] Create FloatingActionButton.stories.tsx
- [ ] Create ExtensionPopup component
- [ ] Implement stats display section
- [ ] Implement Dashboard and AI Studio tabs
- [ ] Create backdrop with click-to-close
- [ ] Create ExtensionPopup.module.css
- [ ] Create ExtensionPopup.stories.tsx
- [ ] Export all components from index.ts
- [ ] Verify visual match with demo for each composition
- [ ] Test all components at 400px width (extension viewport)

---

## Story Dependencies (Epic 0)

```
0.1 Foundation ──► 0.2 Core Atoms ──┬──► 0.4 Molecules
                                    │
                  0.3 Form Atoms ───┤
                                    │
                                    ▼
                              0.5 Organisms
                                    │
                                    ▼
                              0.6 Compositions
```

**Parallel Work Possible:**
- After 0.1: Stories 0.2 and 0.3 can run in parallel
- After 0.2 + 0.3: Story 0.4 can start
- After 0.4: Story 0.5 can start
- After 0.5: Story 0.6 can start

---

## Color Reference (Demo Exact Values)

| Token | Value |
|-------|-------|
| Primary 500 | `#6366f1` |
| Primary 600 | `#4f46e5` |
| Primary 700 | `#4338ca` |
| Purple 500 | `#8b5cf6` |
| Blue 500 | `#3b82f6` |
| Success 500 | `#22c55e` |
| Warning 500 | `#f59e0b` |
| Danger 500 | `#ef4444` |
| Background Dark Primary | `#0f1419` |
| Background Dark Secondary | `#1e3a5f` |
| Glass BG (Dark) | `rgba(255, 255, 255, 0.05)` |
| Glass Border (Dark) | `rgba(255, 255, 255, 0.1)` |
| Glass Hover (Dark) | `rgba(255, 255, 255, 0.08)` |
| Text Primary (Dark) | `rgba(255, 255, 255, 1)` |
| Text Secondary (Dark) | `rgba(255, 255, 255, 0.8)` |

**Gradients:**
- Primary: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`
- Background: `linear-gradient(135deg, #1e3a5f 0%, #0f1419 100%)`
- Purple-Blue: `linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)`

---

## Rapid Development Guidelines

1. **One-to-one mapping:** Copy exact colors, spacing, animations from demo
2. **CSS Modules for complex styling:** Glassmorphism, gradients, animations
3. **Tailwind for layout:** Flexbox, grid, spacing utilities
4. **shadcn/ui for accessibility:** Modal focus trap, Select keyboard nav
5. **Storybook-first:** Build each component with stories before integration
6. **Visual comparison:** Screenshot demo vs implementation for each component

---

## Requirements Inventory

### Functional Requirements

**Authentication & Account Management (FR1-FR6)**
- FR1: Users can sign in using Google OAuth
- FR2: Users can sign out from the extension
- FR3: Users can sign out from the dashboard
- FR4: System maintains authentication state across browser sessions
- FR5: Users can view their account profile information
- FR6: Users can delete their entire account and all associated data

**Resume Management (FR7-FR13)**
- FR7: Users can upload resume files (PDF format)
- FR8: System uses AI to parse uploaded resumes and extract structured data (skills, experience, education, contact information)
- FR9: Users can store up to 5 resumes in their account
- FR10: Users can select one resume as their active resume
- FR11: Users can view their list of uploaded resumes
- FR12: Users can delete individual resumes
- FR13: Users can switch between resumes when applying to jobs

**Job Page Scanning (FR14-FR22)**
- FR14: Users can trigger a scan of the current job posting page
- FR15: System extracts job title from job posting pages
- FR16: System extracts company name from job posting pages
- FR17: System extracts full job description from job posting pages
- FR18: System extracts optional fields (location, salary, employment type) when available
- FR19: System extracts application questions ephemerally when present on the page (not persisted to database)
- FR20: Users can manually correct extracted fields using an element picker
- FR21: Users can manually edit any extracted field directly
- FR22: System indicates which required fields are missing after a scan

**AI Generation Tools - Match Analysis (FR23-FR25)**
- FR23: Users can generate a resume-to-job match analysis
- FR24: Match analysis displays user's strengths relative to the job
- FR25: Match analysis displays skill gaps relative to the job

**AI Generation Tools - Cover Letter (FR26-FR30)**
- FR26: Users can generate a tailored cover letter
- FR27: Users can select a tone for cover letter generation (e.g., confident, friendly, enthusiastic)
- FR28: Users can provide custom instructions for cover letter generation
- FR29: Users can regenerate cover letter with feedback on what to change
- FR30: Users can export generated cover letters as PDF

**AI Generation Tools - Answer Generation (FR31-FR32)**
- FR31: Users can generate answers to application questions
- FR32: Users can regenerate answers with feedback on what to change

**AI Generation Tools - Outreach Messages (FR33-FR34)**
- FR33: Users can generate outreach messages for recruiters/hiring managers
- FR34: Users can regenerate outreach messages with feedback on what to change

**AI Generation Tools - Common Capabilities (FR35-FR38)**
- FR35: Users can edit any AI-generated output before using it
- FR36: AI outputs and extracted application questions are ephemeral and not stored on the server
- FR37: Users can copy any AI-generated output to clipboard with a single click
- FR38: System provides visual feedback when AI output is copied

**Form Autofill (FR39-FR44)**
- FR39: Users can autofill application form fields with their profile data
- FR40: System maps user data to appropriate form fields automatically
- FR41: System highlights fields that were autofilled
- FR42: Users can undo the last autofill action
- FR43: Autofill includes resume upload when a file upload field is detected
- FR44: Autofill includes generated cover letter when available

**Job Tracking (FR45-FR53)**
- FR45: Users can save a job from the extension via a dedicated "Save Job" button
- FR46: System automatically sets job status to "Applied" when saving from extension
- FR47: Users can view their list of saved/tracked jobs in the dashboard
- FR48: Users can update the status of a tracked job (applied, interviewed, offer, rejected)
- FR49: Users can view details of a saved job
- FR50: Users can delete a job from their tracked list
- FR51: Users can add notes to a saved job
- FR52: Users can edit notes on a saved job
- FR53: Users can view notes when reviewing a saved job

**Usage & Subscription Management (FR54-FR61)**
- FR54: Users can view their current AI generation balance
- FR55: Users can view their subscription tier and expiry date
- FR56: Users receive 5 free AI generations on signup (lifetime)
- FR57: Users can upgrade to a paid subscription tier
- FR58: Users can manage their subscription (upgrade, downgrade, cancel)
- FR59: Users earn additional free generations through referrals
- FR60: System blocks AI generation when user has no remaining balance
- FR61: System displays upgrade prompts when user is out of credits

**Extension Sidebar Experience (FR62-FR67)**
- FR62: Users can open the extension sidebar from any webpage
- FR63: Users can close the extension sidebar
- FR64: Sidebar displays appropriate state based on page type (job page vs non-job page)
- FR65: Sidebar displays resume tray for quick resume access
- FR66: AI Studio tools are locked until a successful scan is completed
- FR67: Users can navigate to the web dashboard from the sidebar

**Web Dashboard (FR68-FR72)**
- FR68: Users can access a dedicated jobs management page
- FR69: Users can access a dedicated resume management page
- FR70: Users can access an account and billing management page
- FR71: Users can access a data and privacy controls page
- FR72: Dashboard displays user's current usage and subscription status

**Data Privacy & Controls (FR73-FR77)**
- FR73: Users can view explanation of what data is stored and where
- FR74: Users can initiate complete data deletion with confirmation
- FR75: Data deletion requires email confirmation for security
- FR76: System clears local extension data on logout
- FR77: AI-generated outputs are never persisted to backend storage

**User Feedback (FR78-FR80)**
- FR78: Users can submit feedback about the product (UI placement TBD)
- FR79: System captures feedback with optional context (current page, feature used)
- FR80: Backend stores user feedback for analysis

### Non-Functional Requirements

**Performance (NFR1-NFR9)**
- NFR1: Page scan completes within 2 seconds on standard job boards
- NFR2: AI generation (cover letter, answers, outreach) completes within 5 seconds
- NFR3: Match analysis completes within 3 seconds
- NFR4: Autofill executes within 1 second
- NFR5: Sidebar opens within 500ms of user click
- NFR6: Resume parsing completes within 10 seconds of upload
- NFR7: Auto-scan successfully extracts required fields on 95%+ of top 50 job boards
- NFR8: Fallback AI scan succeeds on 85%+ of unknown job sites
- NFR9: Autofill correctly maps 90%+ of standard form fields

**Security (NFR10-NFR20)**
- NFR10: All data transmitted between extension and API is encrypted (TLS 1.3)
- NFR11: All data stored in database is encrypted at rest
- NFR12: Resume files are stored in encrypted blob storage
- NFR13: OAuth tokens are stored securely (not in plaintext)
- NFR14: AI-generated outputs are never persisted to backend storage
- NFR15: Users can only access their own data (row-level security)
- NFR16: API endpoints require valid authentication
- NFR17: Session tokens expire after reasonable inactivity period
- NFR18: System supports GDPR right-to-deletion requests
- NFR19: System supports CCPA data access requests
- NFR20: User consent is obtained before data collection

**Reliability (NFR21-NFR26)**
- NFR21: Backend API maintains 99.9% uptime (excluding planned maintenance)
- NFR22: Extension functions offline for cached data (resume selection, local state)
- NFR23: AI provider failures are handled gracefully with user notification
- NFR24: AI generation failures do not decrement user's usage balance
- NFR25: Scan failures display partial results with clear error indication
- NFR26: Network errors provide clear, actionable user feedback

**Scalability - Post-MVP (NFR27-NFR29)**
- NFR27: System supports 50,000 monthly active users at 3 months post-launch (Post-MVP)
- NFR28: System supports 150,000 monthly active users at 12 months post-launch (Post-MVP)
- NFR29: Architecture supports horizontal scaling without code changes (Post-MVP)

**Integration (NFR30-NFR35)**
- NFR30: System maintains compatibility with Chrome Manifest V3 requirements
- NFR31: AI provider abstraction allows switching between Claude and GPT
- NFR32: Supabase SDK handles auth, database, and storage operations
- NFR33: Stripe integration handles subscription lifecycle events
- NFR34: Extension functions on Chrome version 88+ (Manifest V3 baseline)
- NFR35: Dashboard supports modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)

**Maintainability (NFR36-NFR44)**
- NFR36: Codebase supports LLM-assisted development with clear module boundaries
- NFR37: API contract (OpenAPI spec) enables independent frontend/backend development
- NFR38: Each app (api, web, extension) is independently deployable
- NFR39: Minimal automated testing acceptable for MVP
- NFR40: Production code must be thorough with comprehensive error handling
- NFR41: Backend API must handle all edge cases and failure scenarios
- NFR42: Backend API includes comprehensive application logging
- NFR43: Logs viewable directly on Railway dashboard (no streaming required for MVP)
- NFR44: Log levels: ERROR, WARN, INFO for key operations

### Additional Requirements

**From Architecture Document:**

- **Starter Template**: Monorepo with WXT (extension), Next.js (web), FastAPI (api) - initialization required as Epic 1 Story 1
- **Implementation Priority**: Backend API + Database first, then Dashboard, then Extension
- **Database Schema**: 6 tables required (profiles, resumes, jobs, usage_events, global_config, feedback) with RLS policies
- **API Response Format**: Standardized envelope pattern with success/data or success/error structure
- **Error Codes**: 11 standardized error codes (AUTH_REQUIRED, CREDIT_EXHAUSTED, RESUME_LIMIT_REACHED, etc.)
- **AI Provider Architecture**: Claude 3.5 Sonnet primary, GPT-4o-mini fallback, user preference toggle
- **Deployment Tooling**: Railway CLI (API), Vercel CLI (Dashboard), Supabase CLI (migrations)
- **Logging Strategy**: Comprehensive structured logging (ERROR, WARN, INFO) viewable on Railway dashboard
- **State Management**: Zustand stores per domain with chrome.storage.local persistence (extension)
- **API Versioning**: All endpoints prefixed with `/v1/`

### FR Coverage Map

| FR Range | Epic | Description |
|----------|------|-------------|
| FR1-FR6 | Epic 1 | Authentication & Account API |
| FR7-FR13 | Epic 2 | Resume Management API |
| FR14-FR22 | Epic 3 | Job Scanning API (data storage) |
| FR23-FR25 | Epic 3 | Match Analysis AI endpoint |
| FR26-FR30 | Epic 4 | Cover Letter AI endpoint |
| FR31-FR32 | Epic 4 | Answer Generation AI endpoint |
| FR33-FR34 | Epic 4 | Outreach Message AI endpoint |
| FR35-FR38 | Epic 4 | Common AI capabilities (edit, copy, ephemeral) |
| FR39-FR44 | Epic 5 | Autofill data endpoint |
| FR45-FR53 | Epic 5 | Job Tracking API |
| FR54-FR61 | Epic 6 | Usage & Subscription API |
| FR62-FR67 | Epic 7 | Sidebar state endpoints (deferred to UI phase) |
| FR68-FR72 | Epic 7 | Dashboard data endpoints |
| FR73-FR77 | Epic 7 | Privacy & Data Deletion API |
| FR78-FR80 | Epic 7 | Feedback API |

**Note:** FR62-FR67 (Extension Sidebar) are primarily frontend concerns. Backend provides supporting endpoints only.

## Epic List

> **Epics 1-7:** Backend API - FastAPI endpoints, database tables, and business logic
> **Epic 8:** Component Library Foundation - Shared UI components with Storybook, blue theme, platform variants
> **Future Epics:** Extension UI and Dashboard UI implementation (after Epic 8 completion)

### Epic 1: User Authentication & Account Foundation API
**Goal:** Establish the authentication system and user profile management API.

**User Outcome (via API):** Users can authenticate via Google OAuth, maintain sessions, view/update profiles, and delete accounts through API endpoints.

**FRs Covered:** FR1, FR2, FR3, FR4, FR5, FR6

**Backend Deliverables:**
- Supabase project setup + profiles table + RLS policies
- `POST /v1/auth/login` - OAuth flow initiation
- `POST /v1/auth/callback` - OAuth callback handling
- `POST /v1/auth/logout` - Session termination
- `GET /v1/auth/me` - Current user profile
- `DELETE /v1/auth/account` - Complete account deletion

---

### Epic 2: Resume Management API
**Goal:** Provide complete resume lifecycle management through the API with AI-powered parsing.

**User Outcome (via API):** Users can upload resumes (PDF), have them parsed using AI to extract structured data (skills, experience, education, contact info), store up to 5, select an active resume, and delete individual resumes.

**FRs Covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13

**Backend Deliverables:**
- Resumes table + Supabase Storage bucket + RLS policies
- `POST /v1/resumes` - Upload + parse resume
- `GET /v1/resumes` - List user's resumes
- `GET /v1/resumes/{id}` - Get resume details + parsed data
- `PUT /v1/resumes/{id}/active` - Set as active resume
- `DELETE /v1/resumes/{id}` - Delete resume + file
- AI-powered resume parsing service (PDF → AI extraction → structured JSON)

---

### Epic 3: Job Scanning & Match Analysis API
**Goal:** Store scanned job data and provide AI-powered match analysis.

**User Outcome (via API):** Job posting data can be stored/retrieved, and users can get AI analysis of how their resume matches a job's requirements.

**FRs Covered:** FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25

**Backend Deliverables:**
- Jobs table (for storing scanned data) + RLS policies
- `POST /v1/jobs/scan` - Store scanned job data
- `GET /v1/jobs/{id}` - Retrieve job details
- `PUT /v1/jobs/{id}` - Update job fields (manual corrections)
- `POST /v1/ai/match` - Generate match analysis (strengths/gaps)
- AI provider architecture (Claude primary + GPT fallback)

**Note:** Actual page scanning logic is extension-side; API stores results.

---

### Epic 4: AI Content Generation API
**Goal:** Provide AI-powered generation of cover letters, answers, and outreach messages.

**User Outcome (via API):** Users can generate personalized cover letters (with tone/instructions), application answers, and recruiter outreach messages via API calls.

**FRs Covered:** FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38

**Backend Deliverables:**
- `POST /v1/ai/cover-letter` - Generate cover letter (tone, custom instructions, regenerate)
- `POST /v1/ai/answer` - Generate application question answer
- `POST /v1/ai/outreach` - Generate recruiter/hiring manager message
- `POST /v1/ai/cover-letter/pdf` - Export cover letter as PDF
- AI prompt templates for each generation type
- Ephemeral output handling (never persisted per FR36, FR77)

---

### Epic 5: Application & Job Tracking API
**Goal:** Provide job tracking and application data management through the API.

**User Outcome (via API):** Users can save jobs, update application status, add/edit notes, and retrieve autofill data for applications.

**FRs Covered:** FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47, FR48, FR49, FR50, FR51, FR52, FR53

**Backend Deliverables:**
- Complete jobs table (status, notes fields) + indexes
- `POST /v1/jobs` - Save job (auto-set status "applied")
- `GET /v1/jobs` - List tracked jobs (with filtering/sorting)
- `PUT /v1/jobs/{id}` - Update job status
- `PUT /v1/jobs/{id}/notes` - Add/edit notes
- `DELETE /v1/jobs/{id}` - Remove from tracking
- `GET /v1/autofill/data` - Get user data for form autofill

**Note:** Autofill execution is extension-side; API provides data.

---

### Epic 6: Usage & Subscription Management API
**Goal:** Track AI usage, manage subscription tiers, and handle billing.

**User Outcome (via API):** Users can check their generation balance, view subscription status, and manage their subscription. System enforces usage limits.

**FRs Covered:** FR54, FR55, FR56, FR57, FR58, FR59, FR60, FR61

**Backend Deliverables:**
- usage_events table + global_config table + RLS policies
- `GET /v1/usage` - Current balance + subscription info
- `GET /v1/usage/history` - Usage history
- `POST /v1/subscriptions/checkout` - Initiate Stripe checkout
- `POST /v1/subscriptions/portal` - Stripe customer portal link
- `POST /v1/webhooks/stripe` - Handle subscription events
- Usage check middleware (block when exhausted)
- Referral credit system (FR59)

---

### Epic 7: Privacy, Feedback & Dashboard Support API
**Goal:** Provide privacy controls, feedback collection, and remaining dashboard data endpoints.

**User Outcome (via API):** Users can request data deletion, submit product feedback, and access all dashboard data through API.

**FRs Covered:** FR62, FR63, FR64, FR65, FR66, FR67, FR68, FR69, FR70, FR71, FR72, FR73, FR74, FR75, FR76, FR77, FR78, FR79, FR80

**Backend Deliverables:**
- feedback table + RLS policies
- `POST /v1/privacy/delete-request` - Initiate account deletion (email confirmation)
- `POST /v1/privacy/confirm-delete` - Confirm deletion with token
- `GET /v1/privacy/data-explanation` - What data is stored and where
- `POST /v1/feedback` - Submit user feedback with context
- Dashboard aggregation endpoints (if needed beyond existing)

**Note:** FR62-FR67 (Sidebar experience) are frontend; backend provides supporting data only.

---

## Epic Summary

| Epic | Title | Stories | Focus Area |
|------|-------|---------|------------|
| 1 | Auth & Account Foundation API | 2 | Supabase Auth, profiles (FR1-FR6) |
| 2 | Resume Management API | 2 | Storage, parsing, CRUD (FR7-FR13) |
| 3 | Job Scanning & Match Analysis API | 2 | Jobs table, AI match (FR14-FR25) |
| 4 | AI Content Generation API | 2 | Cover letter, answer, outreach (FR26-FR38) |
| 5 | Application & Job Tracking API | 2 | Job CRUD, notes, autofill data (FR39-FR53) |
| 6 | Usage & Subscription API | 2 | Usage tracking, Stripe (FR54-FR61) |
| 7 | Privacy, Feedback & Dashboard API | 2 | Deletion, feedback, dashboard (FR62-FR80) |
| 8 | Component Library Foundation | 10 | Storybook, blue theme, shared UI components |
| | **Total** | **24** | **80 FRs covered** |

---

# Detailed Stories

## Epic 1: User Authentication & Account Foundation API

### Story 1.1: Project Foundation & Auth System

**As a** developer,
**I want** a fully initialized monorepo with Supabase authentication configured,
**So that** users can sign in with Google OAuth and maintain authenticated sessions across the application.

**FRs Covered:** FR1, FR2, FR3, FR4

**Acceptance Criteria:**

**Given** a fresh development environment
**When** the developer clones the repository and runs setup commands
**Then** the monorepo structure exists with:
- `apps/api/` - FastAPI backend (Python, uv)
- `apps/web/` - Next.js dashboard (TypeScript, placeholder only)
- `apps/extension/` - WXT extension (TypeScript, placeholder only)
- `packages/types/` - Shared TypeScript types
- `specs/openapi.yaml` - API contract stub
- `supabase/migrations/` - Database migrations folder
**And** pnpm workspaces are configured at root level

**Given** a Supabase project is created (manual step)
**When** the developer runs database migrations
**Then** the `profiles` table exists with columns:
- `id` (UUID, PK, references auth.users)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)
- `subscription_tier` (TEXT, DEFAULT 'free')
- `subscription_status` (TEXT, DEFAULT 'active')
- `active_resume_id` (UUID, nullable)
- `preferred_ai_provider` (TEXT, DEFAULT 'claude')
- `stripe_customer_id` (TEXT, nullable)
- `created_at`, `updated_at` (TIMESTAMPTZ)
**And** RLS policies enforce users can only access their own profile

**Given** the FastAPI server is running
**When** a request is made to `POST /v1/auth/login`
**Then** the response returns a Supabase OAuth URL for Google sign-in
**And** the response includes proper CORS headers

**Given** a user completes Google OAuth consent
**When** Supabase redirects to `POST /v1/auth/callback` with auth code
**Then** the system exchanges the code for tokens
**And** creates a profile record if first-time user
**And** returns session tokens (access_token, refresh_token)
**And** response follows envelope format `{ "success": true, "data": { ... } }`

**Given** an authenticated user with valid session
**When** a request is made to `POST /v1/auth/logout`
**Then** the session is invalidated on Supabase
**And** response confirms logout success

**Given** an authenticated user
**When** subsequent API requests include the access token
**Then** the session persists across requests (FR4)
**And** expired tokens return `401` with error code `INVALID_TOKEN`

**Given** an unauthenticated request to a protected endpoint
**When** the request lacks a valid token
**Then** response returns `401` with error code `AUTH_REQUIRED`

**Technical Notes:**
- Developer must create Supabase project and configure Google OAuth provider
- Environment variables needed: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`
- FastAPI uses Supabase Python SDK for auth operations
- All responses follow envelope pattern from Architecture doc

---

### Story 1.2: Profile & Account Management API

**As a** user,
**I want** to view my profile information and delete my account if needed,
**So that** I can manage my personal data and exercise my right to deletion.

**FRs Covered:** FR5, FR6

**Acceptance Criteria:**

**Given** an authenticated user
**When** a request is made to `GET /v1/auth/me`
**Then** the response returns the user's profile:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "subscription_tier": "free",
    "subscription_status": "active",
    "active_resume_id": null,
    "preferred_ai_provider": "claude",
    "created_at": "2026-01-30T12:00:00Z"
  }
}
```
**And** sensitive fields (stripe_customer_id) are excluded from response

**Given** an authenticated user
**When** a request is made to `DELETE /v1/auth/account`
**Then** the system deletes all user data:
- Profile record
- All resumes (records + storage files) - via CASCADE
- All jobs - via CASCADE
- All usage_events - via CASCADE
- All feedback - via SET NULL
**And** the Supabase auth user is deleted
**And** response confirms deletion success
**And** the operation is logged for audit

**Given** an unauthenticated request
**When** attempting to access profile or delete account
**Then** response returns `401` with error code `AUTH_REQUIRED`

**Technical Notes:**
- Account deletion is immediate (email confirmation is in Epic 7 for privacy flow)
- CASCADE delete handled by foreign key constraints
- Logging uses structured format per NFR42-44

---

## Epic 2: Resume Management API

### Story 2.1: Resume Upload, Storage & AI Parsing

**As a** user,
**I want** to upload my resume and have it parsed using AI,
**So that** my resume data is accurately extracted and available for AI-powered job matching and content generation.

**FRs Covered:** FR7, FR8, FR9

**Acceptance Criteria:**

**Given** an authenticated user with fewer than 5 resumes
**When** a request is made to `POST /v1/resumes` with a PDF file
**Then** the system:
- Validates file is PDF format and under 10MB
- Uploads file to Supabase Storage bucket `resumes/{user_id}/{uuid}.pdf`
- Uses AI (Claude/GPT) to parse PDF and extract structured data (first_name, last_name, contact, experience, education, skills)
- Creates resume record in database with `parsed_data` JSON
- Returns the created resume with parsed data
**And** response follows envelope format:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "file_name": "john_doe_resume.pdf",
    "file_path": "resumes/user-uuid/resume-uuid.pdf",
    "parsed_data": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1-555-0100",
      "location": "San Francisco, CA",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "summary": "...",
      "experience": [...],
      "education": [...],
      "skills": [...]
    },
    "created_at": "2026-01-30T12:00:00Z"
  }
}
```
**And** parsing completes within 10 seconds (NFR6)

**Given** an authenticated user who already has 5 resumes
**When** a request is made to `POST /v1/resumes`
**Then** response returns `422` with error code `RESUME_LIMIT_REACHED`
**And** message: "Maximum 5 resumes allowed. Delete one to upload more."

**Given** a request with non-PDF file
**When** attempting to upload
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message indicates PDF format required

**Given** a request with file exceeding 10MB
**When** attempting to upload
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message indicates file size limit

**Given** the `resumes` table does not exist
**When** migrations are run
**Then** the table is created with columns:
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles, ON DELETE CASCADE)
- `file_name` (TEXT, NOT NULL)
- `file_path` (TEXT, NOT NULL)
- `parsed_data` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)
**And** RLS policies enforce user can only access own resumes
**And** Supabase Storage bucket `resumes` is created with RLS

**Technical Notes:**
- Resume parsing uses AI (Claude primary, GPT fallback) to extract structured data
- AI extracts: skills, experience, education, contact information (first_name, last_name, email, phone, location, linkedin_url)
- PDF text extraction (PyPDF2/pdfplumber) provides raw text input to AI
- Parsed data extracts `first_name` and `last_name` separately for autofill compatibility
- Storage path includes user_id for isolation
- Resume parsing counts as 1 AI generation credit

---

### Story 2.2: Resume CRUD & Active Selection

**As a** user,
**I want** to view, manage, and select my active resume,
**So that** I can organize my resumes and choose which one to use for applications.

**FRs Covered:** FR10, FR11, FR12, FR13

**Acceptance Criteria:**

**Given** an authenticated user with uploaded resumes
**When** a request is made to `GET /v1/resumes`
**Then** response returns list of user's resumes:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "file_name": "john_doe_resume.pdf",
        "is_active": true,
        "created_at": "2026-01-30T12:00:00Z"
      },
      ...
    ],
    "total": 3
  }
}
```
**And** resumes are sorted by `created_at` descending
**And** `is_active` is a computed field: `resume.id == profile.active_resume_id`

**Given** an authenticated user
**When** a request is made to `GET /v1/resumes/{id}`
**Then** response returns full resume details including `parsed_data`
**And** includes a signed URL for downloading the PDF file

**Given** a request for a resume that doesn't exist or belongs to another user
**When** attempting to access
**Then** response returns `404` with error code `RESUME_NOT_FOUND`

**Given** an authenticated user with multiple resumes
**When** a request is made to `PUT /v1/resumes/{id}/active`
**Then** the specified resume becomes the active resume
**And** `profiles.active_resume_id` is updated
**And** response confirms the change
**And** user can switch between resumes when applying (FR13)

**Given** an authenticated user
**When** a request is made to `DELETE /v1/resumes/{id}`
**Then** the resume record is deleted
**And** the file is deleted from Supabase Storage
**And** if deleted resume was active, `active_resume_id` is set to NULL
**And** response confirms deletion

**Given** attempting to delete another user's resume
**When** the request is made
**Then** response returns `404` with error code `RESUME_NOT_FOUND`
**And** no data is modified (RLS enforcement)

**Technical Notes:**
- Signed URLs for file download should expire after 1 hour
- Active resume selection updates the profiles table
- Delete operation must clean up both DB record and storage file
- `is_active` is computed at query time, not stored

---

## Epic 3: Job Scanning & Match Analysis API

### Story 3.1: Job Data Storage API

**As a** user,
**I want** my scanned job data saved and retrievable,
**So that** I can reference job details and use them for AI-powered features.

**FRs Covered:** FR14, FR15, FR16, FR17, FR18, FR20, FR21, FR22

**Acceptance Criteria:**

**Given** an authenticated user with a scanned job from the extension
**When** a request is made to `POST /v1/jobs/scan` with job data:
```json
{
  "title": "Senior Software Engineer",
  "company": "Acme Corp",
  "description": "We are looking for...",
  "location": "San Francisco, CA",
  "salary_range": "$150k-$200k",
  "employment_type": "Full-time",
  "source_url": "https://acme.com/jobs/123"
}
```
**Then** the job is saved to the database
**And** response returns the created job with ID:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Software Engineer",
    "company": "Acme Corp",
    "description": "We are looking for...",
    "location": "San Francisco, CA",
    "salary_range": "$150k-$200k",
    "employment_type": "Full-time",
    "source_url": "https://acme.com/jobs/123",
    "status": "saved",
    "created_at": "2026-01-30T12:00:00Z"
  }
}
```

**Given** required fields are missing (title, company, description)
**When** attempting to save scanned job
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message indicates which required fields are missing (FR22)

**Given** an authenticated user
**When** a request is made to `GET /v1/jobs/{id}`
**Then** response returns full job details including all extracted fields

**Given** a user needs to correct extracted data (FR20, FR21)
**When** a request is made to `PUT /v1/jobs/{id}` with updated fields
**Then** the job record is updated
**And** response returns the updated job

**Given** the `jobs` table does not exist
**When** migrations are run
**Then** the table is created with columns:
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles, ON DELETE CASCADE)
- `title` (TEXT, NOT NULL)
- `company` (TEXT, NOT NULL)
- `description` (TEXT)
- `location` (TEXT, nullable)
- `salary_range` (TEXT, nullable)
- `employment_type` (TEXT, nullable)
- `source_url` (TEXT, nullable)
- `status` (TEXT, DEFAULT 'saved')
- `notes` (TEXT, nullable)
- `created_at`, `updated_at` (TIMESTAMPTZ)
**And** RLS policies enforce user can only access own jobs
**And** index on `(user_id, status)` for filtered queries

**Technical Notes:**
- `status` field supports: saved, applied, interviewing, offered, rejected, accepted
- Application questions are NOT stored (handled client-side, sent directly to AI)
- Extension sends extracted data; API just stores it

---

### Story 3.2: AI Match Analysis Endpoint

**As a** user,
**I want** to see how well my resume matches a job posting,
**So that** I understand my strengths and gaps before applying.

**FRs Covered:** FR23, FR24, FR25

**Acceptance Criteria:**

**Given** an authenticated user with an active resume and a saved job
**When** a request is made to `POST /v1/ai/match`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "ai_provider": "claude"
}
```
**Then** the AI analyzes resume against job requirements
**And** response returns match analysis within 3 seconds (NFR3):
```json
{
  "success": true,
  "data": {
    "match_score": 85,
    "strengths": [
      "5+ years Python experience matches requirement",
      "Previous fintech experience aligns with company domain",
      "Team leadership experience matches senior role expectations"
    ],
    "gaps": [
      "Job requires Kubernetes experience - not mentioned in resume",
      "Preferred AWS certification not present"
    ],
    "recommendations": [
      "Highlight your Docker experience as transferable to Kubernetes",
      "Mention any cloud platform experience in cover letter"
    ],
    "ai_provider_used": "claude"
  }
}
```
**And** AI output is NOT stored on the server (FR36, NFR14)

**Given** `ai_provider` is specified in request
**When** generating match analysis
**Then** use the specified provider (override)

**Given** `ai_provider` is NOT specified
**When** generating match analysis
**Then** use `profiles.preferred_ai_provider` if set, else default to Claude

**Given** the primary AI provider fails
**When** the match request is made
**Then** the system falls back to secondary provider
**And** response still succeeds (NFR31)
**And** failure is logged

**Given** both AI providers fail
**When** the match request is made
**Then** response returns `503` with error code `AI_PROVIDER_UNAVAILABLE`
**And** user's usage balance is NOT decremented (NFR24)

**Given** user has no active resume and no `resume_id` provided
**When** requesting match analysis
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message: "No resume selected. Upload or select a resume first."

**Given** the AI provider architecture does not exist
**When** this story is implemented
**Then** create `services/ai/` with:
- `provider.py` - Abstract interface + provider selection logic
- `claude.py` - Claude/Anthropic implementation
- `openai.py` - GPT/OpenAI implementation
- `prompts.py` - Prompt templates for match analysis
**And** provider selection follows: request override → profile preference → default (Claude)
**And** fallback logic triggers on 500 errors or timeouts

**Technical Notes:**
- Match analysis uses resume's `parsed_data` + job's `description`
- Claude 3.5 Sonnet is primary; GPT-4o-mini is fallback
- Environment variables: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- Prompt template should extract structured strengths/gaps/recommendations

---

## Epic 4: AI Content Generation API

### Story 4.1: Cover Letter Generation API

**As a** user,
**I want** to generate tailored cover letters with my preferred tone and custom instructions,
**So that** I can quickly create personalized cover letters that sound like me.

**FRs Covered:** FR26, FR27, FR28, FR29, FR30

**Acceptance Criteria:**

**Given** an authenticated user with an active resume and a saved job
**When** a request is made to `POST /v1/ai/cover-letter`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "tone": "confident",
  "custom_instructions": "Mention my open-source contributions",
  "ai_provider": "claude"
}
```
**Then** the AI generates a tailored cover letter within 5 seconds (NFR2)
**And** response returns the generated content:
```json
{
  "success": true,
  "data": {
    "content": "Dear Hiring Manager,\n\nI am writing to express my strong interest in...",
    "ai_provider_used": "claude",
    "tokens_used": 1250
  }
}
```
**And** the content is NOT stored on the server (FR36, NFR14)
**And** user's usage balance is decremented by 1

**Given** valid tone options
**When** generating cover letter
**Then** supported tones are: `confident`, `friendly`, `enthusiastic`, `professional`, `executive`
**And** tone influences the writing style appropriately

**Given** a user wants to regenerate with feedback (FR29)
**When** a request is made to `POST /v1/ai/cover-letter` with `feedback`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "tone": "confident",
  "feedback": "Make it shorter and mention my AWS certification",
  "previous_content": "Dear Hiring Manager..."
}
```
**Then** the AI generates a new version incorporating the feedback
**And** this counts as a new generation (decrements usage)

**Given** a user wants to export as PDF (FR30)
**When** a request is made to `POST /v1/ai/cover-letter/pdf`:
```json
{
  "content": "Dear Hiring Manager,\n\nI am writing to express...",
  "file_name": "cover_letter_acme_corp"
}
```
**Then** response returns a PDF file download
**And** PDF is formatted professionally (proper margins, font)
**And** PDF generation does NOT count against usage balance

**Given** AI provider fails
**When** generation is attempted
**Then** system falls back to alternate provider
**And** if both fail, returns `503` with `AI_PROVIDER_UNAVAILABLE`
**And** usage balance is NOT decremented (NFR24)

**Given** user has zero usage balance
**When** attempting to generate
**Then** response returns `422` with error code `CREDIT_EXHAUSTED`
**And** message: "You've used all your credits. Upgrade to continue."

**Technical Notes:**
- Prompt template uses: job description + parsed resume + tone + custom instructions
- PDF generation can use `reportlab` or `weasyprint` library
- Cover letter is the most token-intensive operation
- AI provider resolution: request override → profile preference → Claude (default)

---

### Story 4.2: Answer & Outreach Generation API

**As a** user,
**I want** to generate answers to application questions and recruiter outreach messages,
**So that** I can complete applications faster and reach out to hiring teams professionally.

**FRs Covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38

**Acceptance Criteria:**

**Given** an authenticated user with an active resume and a job context
**When** a request is made to `POST /v1/ai/answer`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "question": "Why do you want to work at Acme Corp?",
  "max_length": 500,
  "ai_provider": "claude"
}
```
**Then** the AI generates a tailored answer within 5 seconds
**And** response returns:
```json
{
  "success": true,
  "data": {
    "content": "I'm drawn to Acme Corp's mission to...",
    "ai_provider_used": "claude",
    "tokens_used": 450
  }
}
```
**And** content is NOT stored on server (FR36)
**And** usage balance is decremented by 1

**Given** a user wants to regenerate answer with feedback (FR32)
**When** request includes `feedback` and `previous_content`
**Then** AI generates improved version based on feedback

**Given** an authenticated user wants to reach out to a recruiter/hiring manager
**When** a request is made to `POST /v1/ai/outreach`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "recipient_type": "recruiter",
  "recipient_name": "Sarah Chen",
  "platform": "linkedin",
  "ai_provider": "gpt"
}
```
**Then** the AI generates an outreach message within 5 seconds
**And** response returns:
```json
{
  "success": true,
  "data": {
    "content": "Hi Sarah,\n\nI came across the Senior Engineer role at Acme Corp...",
    "ai_provider_used": "gpt",
    "tokens_used": 380
  }
}
```

**Given** `recipient_name` is provided
**When** generating outreach message
**Then** message includes personalized greeting: "Hi {name},"

**Given** `recipient_name` is NOT provided
**When** generating outreach message
**Then** message starts directly with the opening statement (no greeting)
**And** NO placeholder text like "[Name]" or "Hi there" appears
**And** message is immediately copy-paste ready

**Given** valid recipient types
**When** generating outreach
**Then** supported types are: `recruiter`, `hiring_manager`, `referral`
**And** message style adapts to recipient type

**Given** valid platforms
**When** generating outreach
**Then** supported platforms are: `linkedin`, `email`, `twitter`
**And** message length/format adapts to platform constraints

**Given** a user wants to regenerate outreach with feedback (FR34)
**When** request includes `feedback` and `previous_content`
**Then** AI generates improved version based on feedback

**Given** all AI generation endpoints
**When** content is returned
**Then** user can edit content client-side before using (FR35)
**And** user can copy to clipboard client-side (FR37, FR38 - frontend responsibility)
**And** server NEVER persists generated content (FR36, FR77)

**Given** AI provider fails for any endpoint
**When** generation is attempted
**Then** fallback logic applies (same as Story 4.1)
**And** usage not decremented on complete failure

**Technical Notes:**
- Answer generation prompt: job context + resume + question + length constraint
- Outreach prompt: job + resume + recipient type + platform constraints
- LinkedIn messages should be <300 chars for connection requests
- All endpoints share the same AI provider resolution logic

---

## Epic 5: Application & Job Tracking API

### Story 5.1: Autofill Data API

**As a** user,
**I want** my profile and resume data available for autofilling application forms,
**So that** I can quickly populate forms without manual data entry.

**FRs Covered:** FR39, FR40, FR41, FR42, FR43, FR44

**Acceptance Criteria:**

**Given** an authenticated user with an active resume
**When** a request is made to `GET /v1/autofill/data`
**Then** response returns all data needed for form autofill within 1 second (NFR4):
```json
{
  "success": true,
  "data": {
    "personal": {
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0100",
      "location": "San Francisco, CA",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "portfolio_url": "https://johndoe.dev"
    },
    "resume": {
      "id": "uuid",
      "file_name": "john_doe_resume.pdf",
      "download_url": "https://supabase.../signed-url",
      "parsed_summary": "Senior software engineer with 8 years..."
    },
    "work_authorization": null,
    "salary_expectation": null
  }
}
```
**And** `personal` data is extracted from `resume.parsed_data`
**And** `full_name` is computed from `first_name` + `last_name`
**And** `download_url` is a signed URL for resume file upload (FR43)

**Given** an authenticated user with NO active resume
**When** a request is made to `GET /v1/autofill/data`
**Then** response returns profile data with `resume: null`:
```json
{
  "success": true,
  "data": {
    "personal": {
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "resume": null
  }
}
```
**And** extension can still autofill basic fields from profile

**Given** the extension receives autofill data
**When** user triggers autofill
**Then** extension handles (client-side):
- Field mapping to form inputs (FR40)
- Highlighting filled fields (FR41)
- Undo capability (FR42)
- Resume file upload (FR43)
- Cover letter paste if available (FR44)

**Technical Notes:**
- Signed URL for resume expires in 1 hour
- Personal data fields may be incomplete depending on resume parsing quality
- Extension caches autofill data locally for offline use
- `first_name`, `last_name`, `full_name` all provided for different form field types

---

### Story 5.2: Job Tracking & Notes API

**As a** user,
**I want** to track my job applications and add notes,
**So that** I can manage my job search progress effectively.

**FRs Covered:** FR45, FR46, FR47, FR48, FR49, FR50, FR51, FR52, FR53

**Acceptance Criteria:**

**Given** an authenticated user has scanned a job and wants to save it as applied (FR45, FR46)
**When** a request is made to `POST /v1/jobs`:
```json
{
  "title": "Senior Software Engineer",
  "company": "Acme Corp",
  "description": "We are looking for...",
  "source_url": "https://acme.com/jobs/123",
  "status": "applied"
}
```
**Then** job is saved with status "applied"
**And** response returns the created job

**Given** an authenticated user (FR47)
**When** a request is made to `GET /v1/jobs`
**Then** response returns paginated list of tracked jobs:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Senior Software Engineer",
        "company": "Acme Corp",
        "status": "applied",
        "notes_preview": "Recruiter mentioned...",
        "created_at": "2026-01-30T12:00:00Z",
        "updated_at": "2026-01-30T14:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "page_size": 20
  }
}
```
**And** supports query params: `?status=applied&page=1&page_size=20&sort=updated_at`
**And** `notes_preview` shows first 100 chars of notes (if any)

**Given** an authenticated user wants to update job status (FR48)
**When** a request is made to `PUT /v1/jobs/{id}/status`:
```json
{
  "status": "interviewing"
}
```
**Then** job status is updated
**And** `updated_at` timestamp is refreshed
**And** valid statuses are: `saved`, `applied`, `interviewing`, `offered`, `rejected`, `accepted`

**Given** an authenticated user wants to view job details (FR49)
**When** a request is made to `GET /v1/jobs/{id}`
**Then** response returns full job details including notes

**Given** an authenticated user wants to delete a job (FR50)
**When** a request is made to `DELETE /v1/jobs/{id}`
**Then** job is permanently deleted
**And** response confirms deletion

**Given** an authenticated user wants to add notes (FR51)
**When** a request is made to `PUT /v1/jobs/{id}/notes`:
```json
{
  "notes": "Recruiter mentioned team is scaling. Follow up next week."
}
```
**Then** notes are saved to the job record
**And** `updated_at` is refreshed

**Given** an authenticated user wants to edit notes (FR52)
**When** a request is made to `PUT /v1/jobs/{id}/notes` with updated content
**Then** notes are replaced with new content

**Given** an authenticated user views a job (FR53)
**When** a request is made to `GET /v1/jobs/{id}`
**Then** response includes full `notes` field

**Given** attempting to access another user's job
**When** any job operation is attempted
**Then** response returns `404` with `JOB_NOT_FOUND`
**And** RLS prevents data leakage

**Technical Notes:**
- `POST /v1/jobs` consolidates with Epic 3's scan endpoint - both create jobs
- Status workflow: saved → applied → interviewing → offered/rejected → accepted
- Notes are stored in existing `notes` TEXT column on jobs table

---

## Epic 6: Usage & Subscription Management API

### Story 6.1: Usage Tracking & Balance API

**As a** user,
**I want** to see my AI generation balance and have limits enforced,
**So that** I understand my usage and know when to upgrade.

**FRs Covered:** FR54, FR56, FR59, FR60, FR61

**Acceptance Criteria:**

**Given** the `usage_events` table does not exist
**When** migrations are run
**Then** the table is created:
```sql
usage_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,  -- match, cover_letter, answer, outreach
  ai_provider    TEXT NOT NULL,  -- claude, gpt
  credits_used   INTEGER DEFAULT 1,
  period_type    TEXT NOT NULL,  -- lifetime, monthly
  period_key     TEXT NOT NULL,  -- "lifetime", "2026-01"
  created_at     TIMESTAMPTZ DEFAULT now()
)
```
**And** index on `(user_id, period_type, period_key)` exists
**And** RLS policies enforce user access

**Given** the `global_config` table does not exist
**When** migrations are run
**Then** the table is created and seeded with:
```sql
INSERT INTO global_config (key, value) VALUES
('tier_limits', '{"free": {"type": "lifetime", "amount": 5}, "starter": {"type": "monthly", "amount": 100}, "pro": {"type": "monthly", "amount": 500}, "power": {"type": "monthly", "amount": 2000}}'),
('referral_bonus_credits', '5');
```

**Given** an authenticated user
**When** a request is made to `GET /v1/usage`
**Then** response returns current balance and limits:
```json
{
  "success": true,
  "data": {
    "subscription_tier": "free",
    "period_type": "lifetime",
    "period_key": "lifetime",
    "credits_used": 3,
    "credits_limit": 5,
    "credits_remaining": 2,
    "usage_by_type": {
      "match": 1,
      "cover_letter": 2,
      "answer": 0,
      "outreach": 0
    }
  }
}
```

**Given** a paid user (starter/pro/power)
**When** checking usage
**Then** `period_type` is "monthly" and `period_key` is current month (e.g., "2026-01")
**And** usage resets at the start of each month

**Given** any AI generation succeeds
**When** the operation completes
**Then** a `usage_event` record is created
**And** balance is decremented by 1

**Given** AI generation fails completely (both providers)
**When** the operation fails
**Then** NO `usage_event` is created (NFR24)
**And** balance is NOT decremented

**Given** a user with zero remaining credits (FR60)
**When** attempting any AI generation
**Then** response returns `422` with error code `CREDIT_EXHAUSTED`
**And** message: "You've used all your credits. Upgrade to continue." (FR61)

**Given** a new user signs up (FR56)
**When** their profile is created
**Then** they start with 5 lifetime free generations
**And** `subscription_tier` defaults to "free"

**Given** a user refers someone successfully (FR59)
**When** referral is validated
**Then** referring user receives bonus credits (from `global_config.referral_bonus_credits`)
**And** a usage_event with negative `credits_used` is recorded (credit addition)

**Technical Notes:**
- Usage check middleware runs before all AI endpoints
- Free tier: lifetime limit (never resets)
- Paid tiers: monthly limit (resets on 1st of each month)
- Referral tracking mechanism TBD (could be simple code or link)

---

### Story 6.2: Subscription & Billing API (Mocked)

**As a** user,
**I want** to upgrade my subscription and manage billing,
**So that** I can access more AI generations and manage my payment methods.

**FRs Covered:** FR55, FR57, FR58

**Implementation Note:** All Stripe API calls are **mocked** for MVP. API endpoints and request/response contracts remain unchanged. Real Stripe integration will be added when backend + frontend are complete.

**Acceptance Criteria:**

**Given** an authenticated free user wants to upgrade (FR57)
**When** a request is made to `POST /v1/subscriptions/checkout`:
```json
{
  "tier": "pro",
  "success_url": "https://app.jobswyft.com/account?success=true",
  "cancel_url": "https://app.jobswyft.com/account?canceled=true"
}
```
**Then** response returns checkout URL (mocked):
```json
{
  "success": true,
  "data": {
    "checkout_url": "mock://checkout?tier=pro",
    "mock": true
  }
}
```
**And** user's `subscription_tier` is immediately updated to requested tier
**And** `subscription_status` set to "active"

**Given** valid subscription tiers
**When** creating checkout
**Then** supported tiers are: `starter` ($4.99/mo), `pro` ($9.99/mo), `power` ($19.99/mo)

**Given** an authenticated paid user wants to manage subscription (FR58)
**When** a request is made to `POST /v1/subscriptions/portal`
**Then** response returns portal URL (mocked):
```json
{
  "success": true,
  "data": {
    "portal_url": "mock://portal",
    "mock": true
  }
}
```

**Given** an authenticated user (FR55)
**When** a request is made to `GET /v1/usage` (from Story 6.1)
**Then** response includes subscription info:
```json
{
  "subscription_tier": "pro",
  "subscription_status": "active",
  "current_period_end": "2026-02-28T23:59:59Z"
}
```

**Given** webhook endpoint exists
**When** `POST /v1/webhooks/stripe` is called
**Then** endpoint exists but is not actively used during mock phase

**Given** testing tier changes (dev/test only)
**When** using mock mode
**Then** `POST /v1/subscriptions/checkout` immediately upgrades user
**And** `POST /v1/subscriptions/mock-cancel` can simulate cancellation

**Technical Notes:**
- Create `services/stripe_service.py` with interface
- `MockStripeService` implements interface for MVP
- `RealStripeService` to be implemented later (same interface)
- Toggle via environment variable: `STRIPE_MOCK_MODE=true`
- When `STRIPE_MOCK_MODE=false`, real Stripe calls are made

**Deferred to Post-MVP:**
- Real Stripe Checkout integration
- Real Customer Portal integration
- Webhook signature verification
- Payment failure handling

---

## Epic 7: Privacy, Feedback & Dashboard Support API

### Story 7.1: Privacy & Data Deletion API

**As a** user,
**I want** to understand what data is stored and request complete deletion,
**So that** I can exercise my privacy rights and control my personal information.

**FRs Covered:** FR73, FR74, FR75

**Acceptance Criteria:**

**Given** an authenticated user wants to know what data is stored (FR73)
**When** a request is made to `GET /v1/privacy/data-summary`
**Then** response returns summary of stored data:
```json
{
  "success": true,
  "data": {
    "profile": {
      "stored": true,
      "fields": ["email", "full_name", "subscription_tier", "preferences"],
      "location": "Supabase PostgreSQL (encrypted at rest)"
    },
    "resumes": {
      "count": 3,
      "storage": "Supabase Storage (encrypted)",
      "includes": ["PDF files", "parsed text data"]
    },
    "jobs": {
      "count": 25,
      "storage": "Supabase PostgreSQL"
    },
    "usage_history": {
      "count": 47,
      "storage": "Supabase PostgreSQL",
      "includes": ["operation type", "timestamp", "no content stored"]
    },
    "ai_generated_content": {
      "stored": false,
      "note": "AI outputs are never saved to our servers"
    },
    "data_retention": "Data retained until you delete your account",
    "export_available": false
  }
}
```

**Given** an authenticated user wants to delete their account (FR74)
**When** a request is made to `POST /v1/privacy/delete-request`
**Then** system generates a deletion confirmation token
**And** sends confirmation email to user's email address
**And** response indicates email sent:
```json
{
  "success": true,
  "data": {
    "message": "Confirmation email sent. Please check your inbox.",
    "email_sent_to": "j***@example.com",
    "expires_in": "24 hours"
  }
}
```
**And** token expires after 24 hours

**Given** a user receives the confirmation email (FR75)
**When** they click the confirmation link or submit token to `POST /v1/privacy/confirm-delete`:
```json
{
  "token": "abc123..."
}
```
**Then** system deletes ALL user data:
- Profile record
- All resumes (DB records + storage files)
- All jobs
- All usage_events
- Supabase auth user
**And** response confirms deletion:
```json
{
  "success": true,
  "data": {
    "message": "Your account and all data have been permanently deleted."
  }
}
```
**And** deletion is logged for audit (without PII)

**Given** an invalid or expired token
**When** attempting to confirm deletion
**Then** response returns `400` with error code `INVALID_TOKEN`
**And** message: "Invalid or expired deletion token. Please request again."

**Given** deletion confirmation is pending
**When** user makes other API requests
**Then** account functions normally until deletion is confirmed
**And** user can cancel by simply not confirming

**Technical Notes:**
- Deletion token stored temporarily (Redis or DB with expiry)
- Email sending via Supabase Auth email or external service (Resend, SendGrid)
- For MVP: Can mock email sending, log token to console for testing
- Audit log entry: `{ "event": "account_deleted", "timestamp": "...", "user_id_hash": "..." }`

---

### Story 7.2: Feedback API

**As a** user,
**I want** to submit feedback about the product,
**So that** the team can improve Jobswyft based on my experience.

**FRs Covered:** FR78, FR79, FR80

**Acceptance Criteria:**

**Given** the `feedback` table does not exist
**When** migrations are run
**Then** the table is created:
```sql
feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  category   TEXT,
  context    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
)
```
**And** RLS allows users to insert their own feedback
**And** RLS prevents users from reading others' feedback

**Given** an authenticated user wants to submit feedback (FR78)
**When** a request is made to `POST /v1/feedback`:
```json
{
  "content": "The cover letter generation is amazing! Would love to see more tone options.",
  "category": "feature_request",
  "context": {
    "page_url": "https://linkedin.com/jobs/123",
    "feature_used": "cover_letter",
    "browser": "Chrome 120"
  }
}
```
**Then** feedback is saved to database (FR80)
**And** response confirms submission:
```json
{
  "success": true,
  "data": {
    "message": "Thank you for your feedback!",
    "feedback_id": "uuid"
  }
}
```

**Given** feedback submission
**When** context is provided (FR79)
**Then** context is stored as JSONB for analysis
**And** context fields are optional and flexible

**Given** valid feedback categories
**When** submitting feedback
**Then** supported categories are: `bug`, `feature_request`, `general`, `praise`, `complaint`
**And** category is optional (defaults to `general`)

**Given** an unauthenticated user
**When** attempting to submit feedback
**Then** response returns `401` with `AUTH_REQUIRED`
**And** anonymous feedback is not supported (need user context for follow-up)

**Given** feedback content is empty
**When** attempting to submit
**Then** response returns `400` with `VALIDATION_ERROR`

**Technical Notes:**
- `user_id` uses ON DELETE SET NULL to preserve feedback even if user deletes account
- Context is freeform JSONB - extension/dashboard can send any relevant info
- No admin endpoints for reading feedback in MVP (access via Supabase dashboard)

---

## Story Summary

| Epic | Story | Title | FRs |
|------|-------|-------|-----|
| 1 | 1.1 | Project Foundation & Auth System | FR1-FR4 |
| 1 | 1.2 | Profile & Account Management API | FR5-FR6 |
| 2 | 2.1 | Resume Upload, Storage & Parsing | FR7-FR9 |
| 2 | 2.2 | Resume CRUD & Active Selection | FR10-FR13 |
| 3 | 3.1 | Job Data Storage API | FR14-FR22 |
| 3 | 3.2 | AI Match Analysis Endpoint | FR23-FR25 |
| 4 | 4.1 | Cover Letter Generation API | FR26-FR30 |
| 4 | 4.2 | Answer & Outreach Generation API | FR31-FR38 |
| 5 | 5.1 | Autofill Data API | FR39-FR44 |
| 5 | 5.2 | Job Tracking & Notes API | FR45-FR53 |
| 6 | 6.1 | Usage Tracking & Balance API | FR54, FR56, FR59-FR61 |
| 6 | 6.2 | Subscription & Billing API (Mocked) | FR55, FR57-FR58 |
| 7 | 7.1 | Privacy & Data Deletion API | FR73-FR75 |
| 7 | 7.2 | Feedback API | FR78-FR80 |
| 8 | 8.1 | Component Library Infrastructure & Storybook Setup | Infrastructure |
| 8 | 8.2 | Primitive Components - Buttons, Inputs, Badges | UI Components |
| 8 | 8.3 | Primitive Components - Feedback & Navigation | UI Components |
| 8 | 8.4 | Composite Components - Cards, Dialogs, Tabs | UI Components |
| 8 | 8.5 | Composite Components - Form & Command | UI Components |
| 8 | 8.6 | Domain Components - Resume & Job | UI Components |
| 8 | 8.7 | Domain Components - AI & Progress | UI Components |
| 8 | 8.8 | Section Components - Layout & Navigation | UI Components |
| 8 | 8.9 | Section Components - AI Studio & Complete Flows | UI Components |
| 8 | 8.10 | Platform Integration & Validation | UI Components |

**Total: 8 Epics, 24 Stories, 80 FRs covered**

---

