# Job Card Design System
**Version 1.0** | **Theme: Condensed & Insightful**

## 1. Core Philosophy
- **Context First**: The job description is the "Source of Truth".
- **Instant Insight**: Users should know *immediately* if they are a good fit via the Match Score.
- **Actionable**: Clear paths to "Generate" or "Chat".

## 2. Visual Architecture

### A. Card Layout
- **Style**: `Card` (Shadcn) with `shadow-sm` and `hover:shadow-md`.
- **Padding**: `p-4` (Standard) or `p-3` (Compact mode).
- **Background**: `bg-card` (White/Dark Gray).

### B. Job Header
- **Title**: `text-lg font-semibold tracking-tight`.
- **Company**: `text-sm font-medium text-muted-foreground` + Icon (Building).
- **Metadata Row**:
  - Location (MapPin)
  - Salary (Badge variant="outline" or "secondary")
  - Posted Date (Clock)

### C. Match Intelligence (The "Brain")
- **Score Indicator**:
  - **Size**: Slightly reduced (`size-12`).
  - **Style**: Highlighted background + Ring border (`ring-2 ring-offset-2`).
  - **Color logic**: Same as v1.0.
- **Skill Pills Layout**:
  - **Format**: Stacked Rows (Legacy "2-Column" removed).
  - **Row 1**: "Matches" - Green/Secondary badges.
  - **Row 2**: "Gaps" - Outline/Dashed badges.

### D. Actions
- **Primary**: "Talk to Coach" (Button variant="default").
- **Removed**: "Generate Cover Letter", "Chat w/ Job".

## 3. Data Structure (Types)
```typescript
interface JobData {
  title: string;
  company: string;
  location: string;
  salary?: string;
  postedAt?: string;
  description: string; // Full HTML/Markdown?
}

interface MatchData {
  score: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  summary: string; // One-line AI summary
}
```
