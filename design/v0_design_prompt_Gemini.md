# JobSwyft Extension - Master Design Specification for V0

**System Role:** 
You are an expert Product Designer specializing in "Magical" utility tools. You are designing a Chrome Extension sidebar for **JobSwyft**, a tool that helps users apply to jobs 10x faster using AI.

**Core Philosophy:** 
"High Density, Low Noise." The user is overwhelmed by job hunting. This tool needs to feel like a calm, capable sidekick that organizes chaos. It lives *next* to the job post, not on top of it.

---

## 1. Design Language (The "Vibe")
*   **Base Framework:** Shadcn/UI (clean, accessible, modular).
*   **Focus:** Layout, Typography hierarchy, and Spacing.
*   **Structure:** High information density but breathable.
*   **Micro-Interactions are Critical:**
    *   *Pulse:* When a job is detected.
    *   *Slide:* Smooth tab transitions.
    *   *Expand/Collapse:* Progressive disclosure for dense information.

---

## 2. Key Components & States to Visualize

### A. The Shell (Sidebar)
*   **Behavior:** Fixed right-side panel (width ~400px).
*   **Header:** Minimal. App Logo + "Job Detected" badge + Credit Meter.
*   **Footer:** Sticky "Credit Bar" showing usage.

### B. Job Context (The "Job Card")
*   **State:** The anchor. Always visible.
*   **Content:** Extracted data (Title, Company), Match Ring (Radial gauge), Missing Skills Badges.
*   **Interaction:** Edit mode transforms text to inputs.

### C. User Context (The "Resume Card")
*   **State 1: Compact (Default):** Mini-card showing active resume name + health score.
*   **State 2: Expanded:** Full details with progressive disclosure (Show top 2 jobs, then "View All").

### D. The Engine (AI Studio) - *Crucial States*
*   **State 1: Locked (Pre-Scan):**
    *   Overlay with padlock icon.
    *   Blurred background content.
    *   CTA: "Scan Job to Unlock".
*   **State 2: Unlocked (The Workspace):**
    *   **Tab System:** `Match` | `Cover Letter` | `Answer` | `Outreach`.
    *   **Loading State:** Skeleton loaders for AI generation.
    *   **Empty State:** "Select a tool to start" placeholder.

### E. The Coach (Chat Assistant)
*   **State 1: Empty:**
    *   Friendly greeting ("How can I help with this role?").
    *   Suggested prompts chips (e.g., "Analyze culture fit").
*   **State 2: Active Conversation:**
    *   Chat bubbles interface.
    *   Timestamps (e.g., "Just now").
*   **State 3: Locked:**
    *   Similar to AI Studio, locked until job context exists.

### F. The Action (Autofill)
*   **State 1: Ready:** List of mapped fields (green checkmarks for ready, amber for missing).
*   **State 2: Filling (Active):**
    *   Progress indicator or spinner.
    *   "Filling field 3 of 12..." text.
*   **State 3: Complete:**
    *   "Application Filled" Toast notification.
    *   **Undo Action:** "Undo Last Fill" button visible.

---

## 3. The "Hero" Flow to Generate

Please create a high-fidelity mockup showcasing this **"Happy Path" sequence**:

1.  **Scene 1: Discovery**
    *   Sidebar is open. "Job Detected" card is pulsing. Match Score is analyzing (skeleton loader).
    *   AI Studio is **Locked** (padlock overlay).
2.  **Scene 2: Evaluation (The Reveal)**
    *   Match Score settles at **92%**.
    *   User clicks "Unlock AI Studio".
3.  **Scene 3: Creation (Cover Letter)**
    *   AI Studio is **Unlocked**. Active tab is **Cover Letter**.
    *   Tone selected: "Confident".
    *   Button "Generate (1 Credit)" is clicked.
4.  **Scene 4: The Coach Interaction**
    *   User switches to "Coach" tab.
    *   Shows a chat UI with a question about "Salary Negotiation".

---

## 4. Specific UI Details ("Gold Plating")
*   **Badge Spacing:** Ensure badges (Skills, Tags) have breathing room (gap-2).
*   **Contrast:** Ensure high legibility for text.
*   **Icons:** Use clear, thin-stroke icons (like Lucide).
*   **Shadows:** Use depth to separate layers hierarchy (cards vs background).
