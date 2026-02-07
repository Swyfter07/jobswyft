# JobSwyft - Chrome Extension Sidebar Design Brief

> Design a complete Chrome Extension sidebar UI for **JobSwyft**, an AI-powered job application assistant that lives alongside job postings and helps users apply 5x faster. I want a full, interactive prototype with all screens and states.

---

## The Product in One Sentence

A Chrome Extension sidebar that automatically detects job postings, instantly analyzes how well you match, generates tailored cover letters and outreach messages, and autofills application forms - turning a 25-minute grind into a 4-minute breeze.

---

## Design Philosophy

**"High Density, Low Noise."**

The user is overwhelmed by job hunting - dozens of tabs, copy-pasting resumes, rewriting cover letters from scratch. This tool needs to feel like a calm, capable sidekick that organizes chaos. It lives *next to* the job posting, not on top of it.

Think: the precision of a Bloomberg terminal meets the warmth of a personal career coach.

**Guiding Principles:**
- **Context-aware**: The sidebar should feel like it *understands* what page the user is on and adapts instantly
- **Progressive disclosure**: Show the minimum needed, reveal depth on demand
- **Momentum, not friction**: Every interaction should feel like forward progress
- **Celebrate the small wins**: A great match score, a generated cover letter, a filled form - these moments deserve subtle delight

---

## The Sidebar Shell

- **Position**: Fixed right-side panel, approximately 380-400px wide
- **Height**: Full viewport height, scrollable content area
- **Header**: Compact - Logo/wordmark + contextual status indicator + user avatar
- **Footer**: Sticky credit/usage bar (always visible)
- **Theme**: Support both light and dark mode. Use a warm accent color (orange/amber family) as the brand color against clean neutrals

---

## The Four States of the Sidebar

The sidebar is context-aware. It watches what page the user is on and morphs accordingly. Design all four states:

### State 1: Signed Out
- Clean, centered layout
- App logo with tagline: "Apply smarter. Apply faster."
- Single "Sign in with Google" button
- Brief value props below (3 bullet points with icons)
- Subtle background pattern or gradient

### State 2: Authenticated, Non-Job Page
- User is signed in but browsing a random website (not a job board)
- Show the **Resume Tray** (compact bar showing active resume name, clickable to expand dropdown of all resumes)
- Friendly empty state: illustration + "Navigate to a job posting to get started"
- Quick link to "Go to Dashboard"
- This state should feel calm and ready, not empty

### State 3: Job Posting Detected
- The sidebar comes alive. A subtle pulse or glow indicates "Job Detected"
- **Job Card** appears automatically with extracted data:
  - Job title (prominent)
  - Company name + logo (if available)
  - Location, salary range, employment type (as metadata chips)
  - **Match Score Ring**: A radial/circular gauge showing match percentage (0-100%)
    - Green (70%+) = Strong fit
    - Yellow (40-69%) = Moderate fit
    - Red (<40%) = Weak fit
  - **Skill Pills**: Two rows
    - "Strengths" row: Green-tinted badges showing skills you have that they want
    - "Gaps" row: Amber/dashed-outline badges showing skills they want that you lack
  - Expandable job description preview (2-3 lines, click to see full)
- **Resume Tray** still visible above the job card
- **AI Studio** section is visible but **locked** - show a frosted/blurred overlay with a padlock icon and message: "Go to the application page to unlock AI tools"
- The locked state should create intrigue and anticipation, not frustration

### State 4: Application Page (Full Power)
- User clicked "Apply" and is now on the application form
- Everything from State 3 is present, but now the AI Studio is **unlocked** and fully interactive
- **Autofill Preview** section appears below AI Studio showing detected form fields
- **Credit Badge** is prominent, showing remaining balance
- This is the "cockpit" state - information-dense but organized

---

## Core Components to Design

### A. Resume Tray
- **Collapsed (default)**: Single-line bar showing active resume filename + a small status dot
- **Expanded**: Dropdown panel listing all resumes (max 5)
  - Each resume shows: filename, upload date, "Active" indicator
  - Click to switch active resume
  - "Upload New" button at bottom
- **Resume Detail View** (accessible from tray): Expandable accordion sections
  - Personal Info (name, email, phone, links - shown as compact badges)
  - Skills (copyable chip/pill badges)
  - Experience (company, title, dates, description - progressive disclosure: show 2 most recent, "View all" for rest)
  - Education
  - Each section has a "Copy All" action
  - Only one section expanded at a time (accordion behavior)

### B. Job Card
- **Scanning state**: Skeleton loader + spinner + "Scanning page..." text
- **Success state**: Full job data rendered (as described in State 3)
- **Partial success**: Warning indicator showing which fields couldn't be extracted, with inline edit capability
- **Error state**: Red-tinted message + "Try Manual Scan" button with element picker
- Match score should animate in (count up from 0 to final number)
- Strengths and Gaps pills should have a "+N more" collapse if there are many

### C. AI Studio (The Creative Engine)
A tabbed workspace with 4 tools. Each tab has an icon + label.

**Tab 1: Match Analysis**
- Auto-generates on scan (free, no credit cost)
- Large match percentage display with radial gauge
- Side-by-side "Strengths" and "Gaps" lists
- "Get Deep Analysis" button (costs 1 credit) for detailed recommendations
- The deep analysis output appears as a structured card with actionable insights

**Tab 2: Cover Letter**
- **Controls panel**:
  - Tone selector: Confident | Friendly | Enthusiastic | Executive (as a toggle group / pill selector)
  - Length selector: Brief | Standard | Detailed
  - Custom instructions textarea: "Add any special notes..." (e.g., "Mention my open-source contributions")
- **Generate button**: "Generate Cover Letter (1 Credit)" - primary, prominent
- **Output area** (after generation):
  - Editable textarea showing the generated letter
  - Action bar: Copy | Regenerate | Download PDF
  - Regenerate opens a small feedback input: "What should change?"
- **Loading state**: Skeleton lines + "Crafting your cover letter..." message with a subtle writing animation

**Tab 3: AI Chat (Career Coach)**
- **Empty state**: Friendly greeting + suggested question chips:
  - "What skills match this role?"
  - "How should I position my experience?"
  - "What questions might they ask in the interview?"
  - "Analyze the company culture"
- **Active conversation**: Chat bubble interface
  - User messages right-aligned (brand color background)
  - AI messages left-aligned (muted background) with copy button on each
  - Typing indicator (animated dots) during AI response
  - Each user message costs 1 credit
- **"New Chat" button** in header to clear and restart
- Suggestion chips disappear after first message sent

**Tab 4: Outreach Messages**
- **Controls**:
  - Message type: LinkedIn Recruiter | Hiring Manager Email | Follow-up
  - Tone: Professional | Friendly | Bold (toggle pills)
  - Length: Brief | Standard
  - Custom instructions textarea
- **Generate button** + same output pattern as Cover Letter (editable output, copy, regenerate)

**Locked State** (for entire AI Studio when on job posting page, not application page):
- Frosted glass / blur overlay covering the tab content
- Centered padlock icon
- Text: "Navigate to the application page to unlock"
- The tabs should still be visible but unclickable

### D. Autofill Preview & Execution
- **Pre-fill view**: List of detected form fields from the application page
  - Each field shows: field label, value that will be filled, status icon (pending/ready)
  - Fields sourced from: resume data (name, email, phone), generated cover letter, resume file
  - Color coding: Green = ready, Amber = needs attention, Gray = will skip
- **"Autofill Now" button**: Primary action, prominent
- **During fill**: Brief progress animation, fields tick off one by one
- **Post-fill view**: All fields show green checkmarks
  - "Undo" button appears (important safety net)
  - Summary: "Filled 8 of 10 fields. 2 need manual input."
- **Undo action**: Reverts all autofilled fields to their previous state

### E. Credit Balance Bar (Sticky Footer)
- Always visible at bottom of sidebar
- Shows: Lightning bolt icon + "3 / 5 credits remaining"
- Progress bar visualization:
  - Normal = brand color
  - Low (1-2 remaining) = amber/warning
  - Empty (0) = red/destructive
- When empty: "Credits exhausted" message + "Upgrade Coming Soon" tooltip
- Also shows auto-match daily usage: "12/20 auto matches today" (secondary, smaller text)

---

## The Happy Path Flow (Design This as a Sequence)

Create these screens showing the complete user journey:

1. **Install & Sign In**: Sidebar opens for first time. Clean sign-in screen.
2. **Upload Resume**: After sign-in, prompt to upload first resume. Show drag-and-drop zone. Then show parsing progress bar.
3. **Resume Ready**: Resume appears in tray, parsed sections visible. User is on a non-job page. Friendly empty state says "Head to a job posting!"
4. **Job Detected**: User navigates to LinkedIn job page. Sidebar pulses. Job card materializes with scanning animation. Match score counts up to 87%. Strengths and gaps populate. AI Studio is locked (blurred).
5. **Application Page - AI Unlocked**: User clicks "Apply." AI Studio unlocks with a satisfying transition. User opens Cover Letter tab, selects "Confident" tone, clicks Generate.
6. **Cover Letter Generated**: Output appears in editable textarea. User tweaks a line, clicks Copy.
7. **Autofill**: User scrolls to autofill section. Preview shows 9 fields ready. User clicks "Autofill Now." Fields tick off. Success state with undo option.
8. **Job Saved**: User clicks "Save Job" - toast notification confirms. Credit balance updates.

---

## Interaction Details & Micro-Interactions

- **Job Detected pulse**: Subtle ring animation on the Job Card border when a new job is first detected
- **Match Score reveal**: Number counts up from 0 to final value over ~1 second
- **Tab transitions**: Smooth slide or fade between AI Studio tabs (not instant swap)
- **Copy confirmation**: Button transforms to checkmark + "Copied!" for 2 seconds
- **Credit deduction**: Number decrements with a brief scale animation
- **Autofill tick-off**: Each field gets a checkmark with a staggered delay (like a checklist being completed)
- **Locked → Unlocked transition**: The blur/frost dissolves away, tabs become interactive with a brief scale-up
- **High match celebration**: For 90%+ matches, add a subtle sparkle or glow effect on the score
- **Skeleton loaders**: Use animated shimmer skeletons during all loading states
- **Toast notifications**: Bottom-right of sidebar, auto-dismiss after 3 seconds

---

## Empty States & Edge Cases

Design these scenarios:
- **No resumes uploaded**: Illustration + "Upload your first resume to get started" + upload button
- **Job scan failed**: Error card with retry option and manual input fallback
- **Out of credits**: Disabled generate buttons + amber banner explaining credit exhaustion + "Upgrade Coming Soon"
- **Offline**: Muted sidebar with banner: "You're offline. Some features require internet."
- **Partial scan**: Job card with warning badges on missing fields, inline edit capability

---

## Visual Language Notes

- **Icons**: Thin-stroke line icons (Lucide style)
- **Shadows**: Layered depth - cards float above sidebar background
- **Border radius**: Slightly rounded (0.5-0.75rem) - friendly but not bubbly
- **Typography**: Clean sans-serif. Strong hierarchy between headings, labels, and body text
- **Color usage**:
  - Brand accent (warm orange/amber) for primary actions and highlights
  - Semantic greens for strengths/success
  - Semantic ambers for warnings/gaps
  - Semantic reds for errors/destructive
  - Neutral grays for structure and secondary text
- **Spacing**: Generous but efficient. Breathable cards, tight metadata rows
- **Dark mode**: Full dark mode variant. Cards should feel like they glow subtly against the dark background

---

## What I Want to See

Generate a complete, polished, interactive prototype that includes:

1. All 4 sidebar states (signed out, non-job page, job detected, application page)
2. The full AI Studio with all 4 tabs functional
3. Resume tray with expand/collapse
4. Autofill preview and execution flow
5. Credit balance bar with all states (normal, low, empty)
6. All loading, empty, and error states
7. Light and dark mode
8. The complete happy-path flow from sign-in to saved job
9. Smooth transitions and micro-interactions
10. Mobile-optimized for ~400px width constraint

Surprise me with the layout, color choices, and interaction patterns. I want to be inspired by what a great Chrome extension sidebar can feel like.
