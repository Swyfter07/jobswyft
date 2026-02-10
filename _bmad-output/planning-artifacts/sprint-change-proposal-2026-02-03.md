# Sprint Change Proposal - Epic 0 Pivot to shadcn UI

**Date**: 2026-02-03
**Author**: BMad Method - Correct Course Workflow
**Scope**: Major (Architectural pivot requiring story rollback)
**Status**: ✅ APPROVED - Implementation Phase
**Approved By**: User
**Approval Date**: 2026-02-03

---

## 1. Issue Summary

### Trigger
During execution of Epic 0 (Platform Foundation - UI Component Library Migration), after completing Stories 0.1 (Design Tokens + UI Scaffold) and 0.2 (Core Atomic Components), a strategic pivot opportunity was identified.

### Problem Statement
The current implementation uses a custom design system approach:
- **Story 0.1**: Custom design tokens via Style Dictionary (~13 token files + build scripts)
- **Story 0.2**: Hand-built atomic components (Button, Badge, Icon system with 63 icons, Typography)

**Total Investment**: ~80 files, ~6,000 lines of code

**Issue**: User has access to a shadcn UI custom configuration with existing styles that provides:
- ✅ Battle-tested accessibility (Radix UI primitives)
- ✅ Proven keyboard navigation and ARIA patterns
- ✅ Active ecosystem with thousands of production deployments
- ✅ Lower maintenance burden (community-driven updates)
- ✅ Faster development velocity (configure vs build from scratch)

### Discovery Context
- Identified after completing Stories 0.1 and 0.2 (both marked as "done" and "review" respectively)
- User has existing shadcn custom link ready for integration
- Remaining Epic 0 stories (0.3-0.6) would continue custom atom approach, increasing technical debt

### Evidence
- Custom approach requires ongoing maintenance of ~80 files
- shadcn provides same functionality with ~10-15 component installations + CSS variable configuration
- shadcn's Radix UI foundation offers superior accessibility out-of-the-box
- Custom atoms duplicate effort that shadcn already solves (Select, Dialog, Dropdown complexity)

---

## 2. Impact Analysis

### Epic Impact

**Epic 0: Platform Foundation (UI Component Library Migration)**
- **Original Goal**: Build custom design system for Extension + Dashboard consistency
- **Revised Goal**: Establish shadcn UI-based component library for Extension + Dashboard consistency
- **Impact**: Complete strategic pivot - **stories 0.1 and 0.2 must be rolled back**

**Story Changes:**
| Story | Status | Action |
|-------|--------|--------|
| 0.1 (Design Tokens + UI Scaffold) | done | **SUPERSEDE** - delete design-tokens package |
| 0.2 (Core Atoms) | review | **SUPERSEDE** - delete atoms directory |
| 0.3 (Form Atoms) | backlog | **REWRITE** - use shadcn Form primitives |
| 0.4 (Molecules) | backlog | **REWRITE** - use shadcn Dialog, Card |
| 0.5 (Organisms) | backlog | **REWRITE** - build on shadcn base |
| 0.6 (Compositions) | backlog | **REWRITE** - compose shadcn components |

**New Story Required:**
- **Story 0.1-NEW**: "shadcn UI Setup & Initial Component Migration"
  - Install shadcn/ui CLI
  - Configure with user's custom styles
  - Add 10-15 core components to Storybook
  - Document consumption patterns for Extension + Dashboard

**Remaining Epics (Epic 1-7):**
- **No Impact**: API, Dashboard, Extension consume `@jobswyft/ui` package - agnostic to implementation approach

---

### Artifact Impact

#### Architecture Document (`architecture.md`)

**Section Requiring Rewrite**: UI Package Architecture (lines 248-690)

**Current Content to Remove:**
- Design tokens package description
- Style Dictionary build process
- Custom token JSON structure
- Token generation scripts
- Custom atomic component patterns
- CSS Modules-first approach

**New Content to Add:**
- shadcn/ui installation & setup
- CSS variable configuration (Tailwind + shadcn theming)
- Component customization approach
- Radix UI primitive integration
- Storybook + shadcn workflow
- Multi-surface consumption (Extension + Dashboard)

**Other Sections:**
- ✅ Technology Stack: No changes (React + TypeScript + Tailwind + Storybook)
- ✅ Project Structure: Minor update (remove design-tokens package reference)
- ✅ Deployment: No changes
- ✅ Database/API: No changes

#### PRD Document (`prd.md`)

**Impact**: ✅ **NO CHANGES NEEDED**
- PRD describes **features** (what), not implementation (how)
- Functional Requirements unchanged (FR1-FR83)
- Non-Functional Requirements unchanged (NFR1-NFR44)
- MVP scope unchanged

#### Epics Document (`epics.md`)

**Section Requiring Update**: Epic 0 Description & Story Breakdown

**Changes:**
- Update Epic 0 goal/description to reflect shadcn approach
- Revise Story 0.1-0.6 descriptions to reference shadcn components
- Update technical notes to reference shadcn patterns
- Remove custom design token references

#### Sprint Status (`sprint-status.yaml`)

**Changes Required:**
```yaml
development_status:
  epic-0: in-progress
  0-1-foundation-design-tokens-ui-scaffold: superseded  # Was: done
  0-2-core-atoms-icons-typography-badge-button: superseded  # Was: review
  0-1-NEW-shadcn-ui-setup: backlog  # NEW STORY
  0-3-form-atoms-input-textarea-select-progressbar-logo: backlog  # Rewrite pending
  # ... rest unchanged
```

#### Story Files

**Delete:**
- `_bmad-output/implementation-artifacts/0-1-foundation-design-tokens-ui-scaffold.md`
- `_bmad-output/implementation-artifacts/0-2-core-atoms-icons-typography-badge-button.md`

**Create:**
- `_bmad-output/implementation-artifacts/0-1-NEW-shadcn-ui-setup.md`

---

## 3. Recommended Approach

### Selected Path: **Option 2 - Rollback + Fresh Start**

### Rationale

**Why Rollback (vs. Incremental Adjustment):**
1. **Technical Debt Avoidance**: Mixing custom atoms + shadcn creates maintenance nightmare
2. **Clean Architecture**: shadcn requires different structure (CSS variables, Tailwind config, component installation pattern)
3. **Future-Proofing**: shadcn ecosystem updates benefit project without custom maintenance
4. **Development Velocity**: Configuring shadcn < building atoms from scratch
5. **User Request**: User has shadcn config ready - maximizes existing investment

**Why Not Incremental:**
- Would require bridging two incompatible systems
- Technical debt compounds with each custom atom
- Contradicts user's explicit request to "scrap 0.1 and 0.2"

**Risk Assessment:**
- **Rollback Risk**: Low (delete code, no runtime dependencies yet)
- **Migration Risk**: Low (shadcn mature, well-documented, thousands of production users)
- **Timeline Risk**: Neutral or positive (shadcn setup + 10-15 components ≈ time already spent)

---

## 4. Detailed Change Proposals

### Code Deletions

**Delete Entire Package:**
```bash
rm -rf packages/design-tokens/
```
**Files Removed**: ~13 source files + dist/ + node_modules/
- All token JSON files (colors, typography, spacing, shadows, borders, transitions, themes)
- Build scripts (build.ts, generate-theme-css.ts, index.ts)
- Package config (package.json, tsconfig.json)

**Delete Atom Components:**
```bash
rm -rf packages/ui/src/atoms/Button/
rm -rf packages/ui/src/atoms/Badge/
rm -rf packages/ui/src/atoms/Icon/
rm -rf packages/ui/src/atoms/Typography/
```
**Files Removed**: ~76 files (4 components + 63 individual icons + supporting files)

**Delete ThemeProvider (will use shadcn's theme system):**
```bash
rm -rf packages/ui/src/providers/ThemeProvider.tsx
rm -rf packages/ui/src/providers/ThemeProvider.test.tsx
```

**Update Package Exports:**
```bash
# Edit packages/ui/src/atoms/index.ts - remove all exports
# Edit packages/ui/src/providers/index.ts - remove ThemeProvider export
# Edit packages/ui/package.json - remove @jobswyft/design-tokens dependency
```

**Total Deletion**: ~90 files, ~6,500 lines of code

---

### New Story: 0.1-NEW - shadcn UI Setup & Initial Component Migration

**Story Goal:**
Establish shadcn UI as the foundation for the component library, configure with user's custom styles, and migrate core components to Storybook.

**Acceptance Criteria:**
1. shadcn/ui CLI installed and initialized
2. User's custom shadcn configuration applied
3. Core components added: Button, Badge, Input, Select, Dialog, Card, Tabs, Dropdown
4. Components render in Storybook with theme toggle (dark/light)
5. Documentation created for Extension + Dashboard consumption
6. Build successful: `pnpm build` in packages/ui
7. No TypeScript errors

**Tasks:**
- Install shadcn CLI: `npx shadcn-ui@latest init`
- Configure components.json with user's custom config
- Add components: `npx shadcn-ui@latest add button badge input select dialog card tabs dropdown-menu`
- Create Storybook stories for each component
- Update tailwind.config to use shadcn CSS variables
- Update globals.css with shadcn base styles
- Create component consumption guide (Extension + Dashboard patterns)
- Update package exports in src/index.ts

**Estimated Effort**: 1-2 days (vs. 3-4 days for remaining custom atoms)

---

### Architecture Document Updates

**File**: `_bmad-output/planning-artifacts/architecture.md`

**Section to Rewrite**: Lines 248-690 (UI Package Architecture)

**New Structure:**
```markdown
## UI Package Architecture (shadcn UI-Based)

### Design Philosophy
**shadcn/ui Foundation:** Component library built on Radix UI primitives with Tailwind CSS styling. Components are copied into the project (not npm package), allowing full customization while maintaining accessibility and interaction patterns.

**Styling Approach:**
- **shadcn/ui Components** → Tailwind CSS + CSS variables (theme-aware)
- **Custom CSS Modules** → Complex extensions (glassmorphism, animations)
- **Tailwind Utilities** → Layout, spacing, responsive

### Package: `@jobswyft/ui`

**Purpose:** Shared component library using shadcn/ui primitives, customized for Jobswyft design system.

```
packages/ui/
├── package.json
├── tsconfig.json
├── components.json          # shadcn config
├── tailwind.config.ts       # CSS variable theming
├── src/
│   ├── index.ts
│   ├── styles/
│   │   └── globals.css      # shadcn base + Tailwind
│   ├── components/
│   │   ├── ui/              # shadcn components (installed via CLI)
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── dropdown-menu.tsx
│   │   └── custom/          # App-specific compositions
│   │       ├── job-card.tsx
│   │       ├── resume-card.tsx
│   │       └── extension-sidebar.tsx
│   └── lib/
│       └── utils.ts         # cn() utility from shadcn
└── .storybook/
    ├── main.ts
    └── preview.tsx          # Theme switcher
```

### shadcn Component Installation Pattern

**Installation:**
```bash
npx shadcn-ui@latest add button
```

**Customization:**
- Components installed to `src/components/ui/`
- Edit directly for project-specific changes
- CSS variables in `tailwind.config.ts` for theming
- No npm dependency - full ownership of code

**Theme Configuration:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        // ... custom colors from user's shadcn config
      },
    },
  },
}
```

```css
/* globals.css */
@layer base {
  :root {
    --primary: 244 63% 57%;        /* #6366f1 */
    --secondary: 262 52% 62%;      /* #8b5cf6 */
    /* ... theme variables */
  }

  .dark {
    --primary: 244 63% 67%;
    /* ... dark theme overrides */
  }
}
```

### Component Consumption (Multi-Surface)

**Extension Content Script:**
```tsx
import { Button, Badge } from '@jobswyft/ui';
import '@jobswyft/ui/styles';

<Button variant="default">Generate Match</Button>
```

**Dashboard Page:**
```tsx
import { Button, Card, Tabs } from '@jobswyft/ui';
// Styles auto-imported via layout

<Card>
  <Tabs>...</Tabs>
</Card>
```

**Custom Compositions:**
```tsx
// src/components/custom/job-card.tsx
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function JobCard({ job }) {
  return (
    <Card>
      <CardHeader>{job.title}</CardHeader>
      <CardContent>
        <Badge>{job.location}</Badge>
        <Button>Apply</Button>
      </CardContent>
    </Card>
  );
}
```

### Storybook Configuration

**Unchanged from Story 0.1:**
- Theme toggle (dark/light)
- Viewport presets: Mobile, Tablet, Desktop, Extension Popup
- Autodocs enabled

**New Stories:**
- shadcn components: Button, Badge, Input, Select, Dialog, Card, Tabs, Dropdown
- Custom compositions: JobCard, ResumeCard, ExtensionSidebar

### Migration from Custom Atoms

**Component Mapping:**
| Custom (Story 0.2) | shadcn Equivalent | Action |
|--------------------|-------------------|--------|
| Button | button | ✅ Replace with shadcn |
| Badge | badge | ✅ Replace with shadcn |
| Icon | lucide-react | ✅ Use Lucide (shadcn standard) |
| Typography | Built-in | ✅ Use Tailwind typography |
| Input | input | ✅ Use shadcn |
| Select | select | ✅ Use shadcn |
| Card | card | ✅ Use shadcn |
| Modal | dialog | ✅ Use shadcn |
| Tabs | tabs | ✅ Use shadcn |
| Dropdown | dropdown-menu | ✅ Use shadcn |

**Advantages of shadcn Approach:**
- ✅ Accessibility: Radix UI primitives (proven ARIA, keyboard nav, focus management)
- ✅ Customization: Full code ownership, edit directly
- ✅ Ecosystem: Lucide icons, Tailwind integration, community examples
- ✅ Maintenance: Community-driven updates, battle-tested patterns
- ✅ Velocity: Configure vs build from scratch (~50% time reduction)

---

(Rest of architecture document unchanged)
```

**Lines Modified**: 248-690 (443 lines rewritten)

---

### Epics Document Updates

**File**: `_bmad-output/planning-artifacts/epics.md`

**Changes:**

**Epic 0 Description Update:**
```markdown
## Epic 0: Platform Foundation (shadcn UI-Based Component Library)

**Goal**: Establish shadcn UI as the design system foundation, providing accessible, customizable components for Extension and Dashboard surfaces.

**Surfaces**: All (infrastructure) - Extension content scripts, extension popup, dashboard pages

**Technical Approach:**
- shadcn/ui CLI for component installation
- Radix UI primitives for accessibility
- Tailwind CSS + CSS variables for theming
- Lucide icons for visual consistency
- Storybook for component documentation

**Key Architectural Decision:**
This epic pivoted from a custom design system (Style Dictionary tokens + hand-built atoms) to shadcn UI after completing Stories 0.1 and 0.2. The pivot provides superior accessibility, lower maintenance, and faster development velocity.

**Superseded Stories:**
- Story 0.1 (Design Tokens + UI Scaffold) - superseded by shadcn approach
- Story 0.2 (Core Atoms) - superseded by shadcn primitives
```

**Story Updates:**
```markdown
### Story 0.1-NEW: shadcn UI Setup & Initial Component Migration

As a **developer building UI surfaces**,
I want **shadcn UI configured with core components in Storybook**,
So that **I can build Extension and Dashboard interfaces with accessible, customizable primitives**.

**Acceptance Criteria:**
- shadcn CLI installed and configured with user's custom styles
- Core components added: Button, Badge, Input, Select, Dialog, Card, Tabs, Dropdown
- All components render in Storybook with theme toggle
- Component consumption guide created for Extension + Dashboard
- Build successful with no TypeScript errors

**Technical Notes:**
- Components installed via `npx shadcn-ui@latest add <component>`
- CSS variables configured in tailwind.config.ts
- Lucide icons used (shadcn standard)
- Storybook stories follow shadcn patterns

---

### Story 0.3-REVISED: Form Components & Advanced UI

(Updated to reference shadcn components instead of custom atoms)

### Story 0.4-REVISED: Complex Components (Dialog, Sheet, Popover)

(Updated to use shadcn Dialog, Sheet, Popover primitives)

### Story 0.5-REVISED: Business Components (JobCard, ResumeCard, Navbar)

(Updated to compose from shadcn primitives)

### Story 0.6-REVISED: Surface-Specific Compositions (ExtensionSidebar, ExtensionPopup)

(Updated to compose from shadcn primitives)
```

---

## 5. Implementation Handoff

### Scope Classification: **Minor**

**Reasoning**: This is a technical refactoring decision. While architecturally significant, it does not affect:
- Product requirements (PRD unchanged)
- Feature scope (MVP unchanged)
- User-facing functionality (same visual result)
- Timeline (neutral or positive impact)

### Handoff Recipients

**Primary**: Development Team (Dev Agent)
- Execute code deletions
- Install and configure shadcn UI
- Migrate components to Storybook
- Update documentation

**Secondary**: None required
- No backlog reorganization needed (SM/PM not involved)
- No strategic decisions remaining (architectural path chosen)

### Deliverables

**Code Changes:**
1. Delete `packages/design-tokens/` (entire directory)
2. Delete `packages/ui/src/atoms/` (entire directory)
3. Delete `packages/ui/src/providers/ThemeProvider.tsx`
4. Install shadcn: `npx shadcn-ui@latest init`
5. Add components: `npx shadcn-ui@latest add button badge input select dialog card tabs dropdown-menu`
6. Create Storybook stories for shadcn components
7. Update package.json dependencies

**Documentation Changes:**
1. Rewrite `architecture.md` lines 248-690 (UI Package Architecture)
2. Update `epics.md` Epic 0 description and stories
3. Create `0-1-NEW-shadcn-ui-setup.md` story file
4. Delete `0-1-foundation-design-tokens-ui-scaffold.md`
5. Delete `0-2-core-atoms-icons-typography-badge-button.md`
6. Update `sprint-status.yaml` to mark 0-1 and 0-2 as superseded

### Success Criteria

**Technical:**
- ✅ All custom design-tokens and atom files deleted
- ✅ shadcn UI installed and configured
- ✅ 8-10 shadcn components added to Storybook
- ✅ Build successful: `pnpm build` in packages/ui
- ✅ Storybook runs: `pnpm storybook`
- ✅ Theme toggle works (dark/light)
- ✅ No TypeScript errors

**Documentation:**
- ✅ Architecture document updated with shadcn approach
- ✅ Epics document revised for Epic 0
- ✅ Story files reflect new direction
- ✅ Sprint status accurate

**Validation:**
- ✅ User approves shadcn component selections
- ✅ Theme matches user's custom shadcn config
- ✅ Components work in Extension viewport (400×600)
- ✅ Components work in Dashboard responsive layout

---

## 6. Timeline and Effort Estimate

### Effort Breakdown

**Deletion Phase:** 30 minutes
- Delete packages and directories
- Update package.json dependencies
- Clean pnpm lockfile

**shadcn Setup Phase:** 1 hour
- Install shadcn CLI
- Configure components.json with user's custom config
- Update tailwind.config and globals.css

**Component Migration Phase:** 4-6 hours
- Add 8-10 shadcn components via CLI
- Create Storybook stories for each
- Test theme toggle and viewports
- Document consumption patterns

**Documentation Phase:** 2-3 hours
- Rewrite architecture.md section
- Update epics.md
- Create new story file
- Update sprint status

**Total Estimated Effort:** 1-2 days

### Timeline Impact

**Original Plan (Continue Custom Approach):**
- Stories 0.3-0.6: ~5-7 days (form atoms, molecules, organisms, compositions)
- Maintenance overhead: Ongoing

**New Plan (shadcn Approach):**
- Story 0.1-NEW: ~1-2 days
- Stories 0.3-0.6 (Revised): ~3-4 days (less custom code to write)
- Maintenance overhead: Significantly reduced

**Net Impact**: Neutral or positive (~1-2 days faster overall, much lower long-term maintenance)

---

## 7. Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| shadcn CSS conflicts with existing styles | Low | Medium | Start fresh, minimal existing CSS |
| Theme customization harder than expected | Low | Low | shadcn CSS variables well-documented |
| Component API differences break consumption | Low | Medium | Update consumption guide early |
| Build configuration issues | Low | Low | shadcn works with Vite/Storybook out-of-box |

### Project Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User's custom config incompatible | Low | High | Validate config in first 30 minutes |
| Team unfamiliar with shadcn | Low | Low | shadcn docs are excellent, patterns similar |
| Delayed progress on Epic 1-7 | Low | Low | Epic 0 blocking either way, shadcn faster |

### Overall Risk Level: **LOW**

---

## 8. Approval and Next Steps

### Approval Required

**User Approval Needed For:**
- ✅ Rollback of Stories 0.1 and 0.2 (delete ~90 files)
- ✅ Pivot to shadcn UI approach
- ✅ New Story 0.1-NEW creation
- ✅ Architecture document rewrite (UI section)

### Post-Approval Actions

**Immediate (Day 1):**
1. Update sprint-status.yaml (mark 0-1, 0-2 as superseded)
2. Delete code (design-tokens package, atoms directory, ThemeProvider)
3. Install shadcn CLI and configure

**Short-Term (Day 1-2):**
4. Add shadcn components (Button, Badge, Input, Select, Dialog, Card, Tabs, Dropdown)
5. Create Storybook stories
6. Test theme toggle and viewports

**Follow-Up (Day 2-3):**
7. Update architecture.md
8. Update epics.md
9. Create Story 0.1-NEW file
10. Delete old story files

**Validation:**
11. User reviews shadcn components in Storybook
12. User confirms theme matches custom config
13. User approves component selections

---

## 9. Alternatives Considered

### Alternative 1: Keep Custom Atoms, Add shadcn Alongside

**Approach**: Maintain custom Button, Badge, Typography, add shadcn for complex components (Select, Dialog, etc.)

**Pros**:
- Preserve investment in Stories 0.1 and 0.2
- Mix-and-match approach

**Cons**:
- Technical debt (two styling systems to maintain)
- Inconsistent component APIs
- Confusing for developers (which Button to use?)
- Contradicts user's explicit request

**Verdict**: ❌ **REJECTED** - Creates more problems than it solves

---

### Alternative 2: Incremental Migration (Keep Design Tokens, Use shadcn Components)

**Approach**: Keep design-tokens package for CSS variables, use shadcn components configured with those tokens

**Pros**:
- Preserve some investment from Story 0.1
- Single source of truth for design values

**Cons**:
- shadcn expects specific CSS variable names (--primary, --secondary, etc.)
- Adds complexity bridging two systems
- Custom design-tokens package adds minimal value over shadcn's approach
- Still contradicts user's request to "scrap 0.1 and 0.2"

**Verdict**: ❌ **REJECTED** - Unnecessarily complex, not worth the savings

---

### Alternative 3: Rollback + Fresh Start with shadcn (RECOMMENDED)

**Approach**: Delete all custom work from Stories 0.1 and 0.2, start fresh with shadcn UI

**Pros**:
- ✅ Clean architecture (single system)
- ✅ Superior accessibility (Radix UI)
- ✅ Lower maintenance (community-driven)
- ✅ Faster development (configure vs build)
- ✅ Aligns with user's explicit request
- ✅ Better long-term sustainability

**Cons**:
- "Sunk cost" of Stories 0.1 and 0.2 (~90 files deleted)

**Verdict**: ✅ **SELECTED** - Best technical decision, aligns with user request, superior outcome

---

## 10. Change Summary

### Code Impact

**Deleted:**
- ~90 files (~6,500 lines)
- packages/design-tokens/ (entire package)
- packages/ui/src/atoms/ (Button, Badge, Icon, Typography)
- packages/ui/src/providers/ThemeProvider.tsx

**Added:**
- ~15-20 files (~1,500 lines)
- shadcn component installations (button, badge, input, select, dialog, card, tabs, dropdown-menu)
- Storybook stories for shadcn components
- components.json (shadcn config)

**Net Change**: -70 files, -5,000 lines (leaner codebase)

---

### Documentation Impact

**Files Modified:**
- architecture.md: 443 lines rewritten (UI Package Architecture section)
- epics.md: Epic 0 description + story updates
- sprint-status.yaml: 2 stories marked superseded, 1 new story added

**Files Deleted:**
- 0-1-foundation-design-tokens-ui-scaffold.md
- 0-2-core-atoms-icons-typography-badge-button.md

**Files Created:**
- sprint-change-proposal-2026-02-03.md (this document)
- 0-1-NEW-shadcn-ui-setup.md (to be created post-approval)

---

### Epic Impact Summary

| Epic | Status | Impact |
|------|--------|--------|
| Epic 0 | In Progress | Strategic pivot - rollback 2 stories, create 1 new, rewrite 4 remaining |
| Epic 1-7 | Backlog | No impact - consume @jobswyft/ui agnostic to implementation |

---

## 11. Final Recommendation

### Recommendation: **APPROVE ROLLBACK & PIVOT TO shadcn UI**

**Justification:**
1. **Technical Merit**: shadcn provides superior foundation (accessibility, ecosystem, maintenance)
2. **User Request**: Explicit request to "scrap 0.1 and 0.2" and use shadcn
3. **Efficiency**: Faster development + lower maintenance vs custom approach
4. **Clean Architecture**: Single system (shadcn) vs. dual maintenance burden
5. **Risk**: Low - shadcn is mature, well-documented, production-ready
6. **Timeline**: Neutral or positive impact on overall Epic 0 completion

**Next Action**: Obtain user approval, then execute implementation plan.

---

**Prepared by**: BMad Method - Correct Course Workflow
**Date**: 2026-02-03
**Status**: Awaiting User Approval

---
