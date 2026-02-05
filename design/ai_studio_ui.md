# AI Studio Component Design Specification

**Status**: Draft
**Related PRD Section**: Section 10 (AI Studio)
**Parent Component**: `ExtensionSidebar`

## Overview
The AI Studio is the creative engine of the extension. It consumes data from the `activeResume` (via ResumeCard) and `scannedJob` (via JobCard) to generate actionable content for the user. It is transient/ephemeral in nature—outputs are not stored on the backend.

## Architecture

### 1. States
- **Locked**:
  - **Condition**: `JobCard` has not successfully scanned required fields (Title, Company, Description).
  - **UI**: Overlay with a padlock icon and a clear CTA to "Scan Job" or "Manually Edit Job".
  - **Visuals**: Blurred background or disabled grayscale opacity.
  - **Note**: This prevents garbage-in-garbage-out.
- **Unlocked**:
  - **Condition**: Valid Job Data exists.
  - **UI**: Full tabbed interface accessing all 4 tools.

### 2. Layout Structure
- **Container**: `Card` (matching Resume/Job card styling: `border-orange-200`, `shadow-sm`).
- **Header**:
  - Title: "AI Studio"
  - Badge/Indicator: "Powered by Gemini" (optional branding)
  - Action (Right): Reset/Clear All.
- **Navigation**:
  - `Tabs` component for switching tools.
  - Tabs: `Match`, `Cover Letter`, `Answer`, `Outreach`.
- **Content Area**: Dynamic area changing based on selected tab.

## Sub-Components (Tools)

### Tool 1: Match Analysis (`MatchTab`)
*Goal: Quick understanding of fit.*
- **Input**: None (Auto-runs on unlock).
- **Display**:
  - **Overall Score**: Large percentage circle (Reused from JobCard but detailed).
  - **Strengths**: Bulleted list of matching keywords/skills.
  - **Gaps**: Bulleted list of missing requirements.
  - **Action**: "Optimize Resume" (Future scope, placeholder for now).

### Tool 2: Cover Letter Generator (`CoverLetterTab`)
*Goal: Generate a tailored letter.*
- **Controls**:
  - **Tone**: Dropdown (`Professional`, `Casual`, `Enthusiastic`, `Confident`).
  - **Length**: Dropdown (`Short`, `Medium`, `Long`).
  - **Custom Instructions**: Textarea (e.g., "Mention my Python experience").
- **Action**: "Generate" Button (Consumes 1 Credit).
- **Output**:
  - Rich Text Editor (or Textarea) for manual refinement.
  - Actions: `Copy`, `Download PDF`, `Regenerate`.

### Tool 3: Answer Assistant (`AnswerTab`)
*Goal: Answer specific application questions.*
- **Input**: Textarea ("Paste question here").
- **Action**: "Generate Answer" Button.
- **Output**:
  - Proposed answer text.
  - Actions: `Copy`, `Regenerate`.

### Tool 4: Outreach (`OutreachTab`)
*Goal: Message recruiters.*
- **Inputs**:
  - **Recipient Role**: Input (e.g., "Hiring Manager").
  - **Platform**: Toggle (`Email`, `LinkedIn`).
- **Action**: "Draft Message" Button.
- **Output**:
  - Subject Line & Body.
  - Actions: `Copy`, `Regenerate`.

## Interactive Requirements
- **Credit Balance Integration**:
  - Every "Generate" action must check `creditBalance > 0`.
  - If 0, show "Upgrade" modal/tooltip.
  - Deduct 1 credit locally on generation (optimistic UI).
- **Persistence**:
  - **Session-based**: Outputs survive tab switching but clear on page reload/navigation (per PRD).

## Styling Strategy (Shadcn/UI)
- Use standard `Tabs` component.
- Inputs: `Select`, `Textarea`, `Input`.
- Buttons: Primary (Orange gradient) for "Generate".
- **Animations**:
  - Smooth height transition when switching tabs.
  - Loading skeletons during generation.

## Future Considerations
- "Auto-Apply" hook (Autofill integration).
