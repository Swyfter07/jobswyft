# Implementation Learnings (Appended Per Story)

## EXT.X: [Story Title]
- **Pattern discovered:** [description]
- **Architecture impact:** [what changed or should change]
- **Reusable for:** [which future stories benefit]
```

Types of learnings to capture:
- Chrome extension API gotchas (permissions, messaging, storage limits)
- Component composition patterns that worked well
- API response shape mismatches requiring mapper updates
- Performance observations (bundle size, load time)
- State management patterns (Zustand store structure, persistence strategy)
- Content script ↔ Side Panel communication patterns

**3. User Preference Tracking**

When the user provides feedback on component design (colors, spacing, layout, behavior), the dev agent must:
- Implement the preference immediately
- Document it in the story's dev notes
- If it's a generalizable preference, add it to [Design Language Rules](#design-language-rules-all-components) above
- Update `MEMORY.md` user preferences section

## Backend Tech Debt Registry

> Tech debt discovered during extension stories is tracked in a centralized file that feeds into future epic creation.

**Location:** `_bmad-output/implementation-artifacts/backend-tech-debt.md`

**Format:**
```markdown