# JobSwyft

AI-powered Chrome extension that streamlines the job application process with intelligent resume parsing, job scanning, and personalized content generation.

## Overview

JobSwyft is a sophisticated Chrome extension designed to accelerate job hunting by leveraging AI to automate tedious application tasks. It helps job seekers:

- Parse and manage multiple resumes
- Extract job posting details from any website
- Generate tailored cover letters with customizable tone and length
- Analyze resume-to-job-description fit with actionable insights
- Answer application questions contextually
- Create hiring manager outreach messages
- Track application submissions with motivational milestones

## Features

### Resume Management
- **Multi-Resume Support**: Upload and switch between multiple PDF resumes
- **Intelligent Parsing**:
  - AI-powered parsing with OpenAI (structured JSON extraction)
  - Regex fallback for fast, cost-free parsing
- **Smart Blocks**: Editable profile sections including:
  - Personal information (auto-extracted email, phone, LinkedIn, portfolio)
  - Skills and competencies
  - Work experience
  - Education
  - Projects and achievements
- **Persistent Storage**: All resume data saved locally in Chrome storage

### Job Posting Extraction
- **Multi-Frame Scanning**: Heuristic DOM inspection across iframes
- **AI Fallback**: OpenAI-powered extraction when heuristics fail
- **Manual Pickers**: Click-to-select tools for precise data capture
- **Platform Support**: Greenhouse, LinkedIn, Indeed, and standard job sites

### AI Studio (4 Modules)

#### 1. Match Analysis
- Compare resume against job requirements
- Generate match score (0-100%)
- Identify critical missing skills
- Provide actionable improvement tips
- Visual HTML-formatted results

#### 2. Cover Letter Generator
- **Customization Options**:
  - Length: Short (150-200 words), Medium (250-350 words), Long (400-500 words)
  - Tone: Professional, Confident, Friendly, Enthusiastic
- **Features**:
  - Context-aware generation using resume + job data
  - Live editable output
  - Copy to clipboard
  - Export as PDF
  - Refinement via feedback mechanism

#### 3. Answer Generator
- Context-aware responses to application questions
- Customizable tone and length
- First-person voice as the candidate
- Uses full resume and job posting context

#### 4. Outreach Message Generator
- Hiring manager email templates
- Professional and friendly tone options
- Customizable length
- Context from job posting and resume

### Application Tracking
- **Counter System**: Track submitted applications
- **Motivational Milestones**: Emoji-based progress indicators
  - 🍞 Getting started
  - 🚀 Building momentum
  - 🔥 On fire
  - ✈️ Soaring
  - 🌟 Superstar
  - 👑 Legend status
- **Reset Functionality**: Clear counter with confirmation

### Autofill Capabilities
- Inject form data from parsed resume
- Support for text inputs and standard form fields
- Integration with Floating Action Button (FAB)

## Architecture

### Technology Stack
| Technology | Purpose |
|------------|---------|
| **Chrome Extension API (MV3)** | Core framework with side panel, storage, scripting APIs |
| **OpenAI API** | GPT-4o-mini for text generation and analysis |
| **PDF.js** | Client-side PDF text extraction |
| **Vanilla JavaScript** | Core application logic (no frameworks) |
| **CSS3** | Modern UI with flexbox, grid, animations |
| **Chrome Storage API** | Local data persistence |

### Project Structure

```
JobSwyft/
├── manifest.json              # Extension configuration (Manifest V3)
├── service-worker.js          # Background service worker
├── sidepanel.html             # Main UI structure (323 lines)
├── sidepanel.js               # Core application logic (3,269 lines)
├── prompts.js                 # AI prompt templates (267 lines)
├── styles.css                 # UI styling (19,333 bytes)
├── lib/
│   ├── pdf.min.js            # PDF.js library
│   └── pdf.worker.min.js     # PDF.js worker
├── Assets/
│   ├── icon3.png             # Extension icons
│   └── icon2.webp
└── README.md                  # This file
```

### Key Files

#### [manifest.json](manifest.json)
- Extension metadata (name, version, description)
- Permissions: `sidePanel`, `storage`, `activeTab`, `scripting`, `<all_urls>`
- Service worker and side panel registration
- Web-accessible resources (PDF worker)

#### [sidepanel.js](sidepanel.js) (3,269 lines)
Core application logic including:
- **Tab System**: Manages Scan, AI Studio, and Autofill views
- **Resume Management**: Upload, parse, store, switch between resumes
- **Job Scanning**: Heuristic page scraping + AI fallback
- **AI Features**: All generation and analysis capabilities
- **Data Management**: Chrome storage integration
- **Personal Info Extraction**: Regex-based parsing for contact details

**Major Functions:**
- `setupTabs()` - Tab navigation system
- `setupResumeTray()` - Resume upload and management
- `setupJobAdder()` - Job details extraction and scanning
- `setupAIAnalysis()` - Resume match analysis
- `triggerResumeParse()` - PDF parsing with AI or regex fallback
- `generateCoverLetter()` - AI cover letter creation
- `generateOutreach()` - Hiring manager message generation

#### [prompts.js](prompts.js) (267 lines)
Centralized AI prompt templates:
- `resume_parsing` - Structured JSON extraction from PDFs
- `match_analysis` - Resume vs. job description comparison
- `job_description_extraction` - AI fallback for job details
- `answer_question` - Context-aware answer generation
- `cover_letter` - Personalized cover letter creation
- `regenerate_with_feedback` - Refinement based on user feedback

#### [sidepanel.html](sidepanel.html)
UI structure with three main tabs:
1. **Scan Tab**: Resume tray + job details input
2. **AI Studio Tab**: Match, Cover, Answer, Outreach sub-tabs
3. **Autofill Tab**: Form autofill features

#### [styles.css](styles.css)
Design system featuring:
- Tailwind-inspired color palette (blue primary, slate grays)
- Component styles for cards, buttons, tabs, badges, modals
- Smooth animations and transitions
- Glassmorphic premium card designs
- Responsive flex/grid layouts

#### [service-worker.js](service-worker.js)
Minimal background worker:
- Opens side panel on extension icon click
- Event coordination

## Installation & Setup

### Prerequisites
- Google Chrome browser
- OpenAI API key (for AI features)

### Loading the Extension

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `JobSwyft` directory
6. The extension icon should appear in your Chrome toolbar

### Configuration

1. Click the JobSwyft extension icon to open the side panel
2. Navigate to the AI Studio tab
3. Enter your OpenAI API key in the settings
4. Select your preferred model (default: gpt-4o-mini)

## Usage

### Basic Workflow

1. **Upload Resume**
   - Go to Scan tab
   - Click "Upload Resume" in the resume tray
   - Select your PDF resume
   - Click "Parse Resume" to extract information

2. **Scan Job Posting**
   - Navigate to a job posting page
   - Click "Scan This Page" to auto-extract job details
   - Or use the pickers to manually select job title, company, and description
   - Review and edit extracted information

3. **Generate Content**
   - Switch to AI Studio tab
   - Choose your desired feature (Match, Cover, Answer, Outreach)
   - Customize tone and length options
   - Click generate
   - Edit results inline if needed
   - Copy to clipboard or export as PDF

4. **Track Applications**
   - Increment the application counter after each submission
   - Celebrate milestones with motivational emojis

### Tips
- Parse your resume once and switch between multiple resumes easily
- Use the Match Analysis before applying to identify gaps
- Customize cover letter tone based on company culture
- Save your OpenAI API key for persistent use
- Use manual pickers if auto-scan doesn't work on certain sites

## Data Storage

All data is stored locally in Chrome's storage API:

```javascript
job_jet_resumes           // Array of resume objects with parsed data
job_jet_active_resume_id  // Currently active resume ID
job_jet_profile          // Parsed profile (smart blocks)
job_jet_info             // Personal contact information
job_jet_openai_key       // OpenAI API key (encrypted by Chrome)
job_jet_openai_model     // Selected AI model
job_jet_counter          // Application submission count
```

**Privacy**: All data remains local to your browser. PDF parsing happens client-side. OpenAI API calls are made directly from your browser using your own API key.

## Development

### Recent Changes

**Latest Commits:**
- `fdaf5b7` - Relocated Floating Action Button to content script for direct webpage injection
- `cb23066` - Minor updates
- `e11aac7` - Added hiring manager outreach generation, cover letter editor, UI width adjustments
- `0ec716a` - Initial commit

**Current Branch:** `Sureel-Local`

**Modified Files:**
- manifest.json
- prompts.js
- service-worker.js
- sidepanel.html
- sidepanel.js
- styles.css

**Deleted:**
- fab-content.js (functionality moved to content script)

### Architecture Decisions

**Strengths:**
- Clean separation of concerns (prompts, UI, logic)
- Robust error handling and user feedback
- Multi-frame scanning for complex job sites
- Smart fallback mechanisms (regex → AI → manual)
- Privacy-focused (client-side processing)

**Design Choices:**
- Single JavaScript file for core logic (easier extension development)
- No external frontend framework (reduced complexity, faster execution)
- Client-side PDF parsing (no server uploads)
- Direct OpenAI API calls (no backend intermediary)

### Extension Permissions

- `sidePanel` - Side panel UI
- `storage` - Local data persistence
- `activeTab` - Access current tab for job scanning
- `scripting` - Content script injection for autofill
- `<all_urls>` - Scan job postings on any website

## API Costs

JobSwyft uses OpenAI's API with the following approximate costs (as of 2025):

- **gpt-4o-mini** (default): ~$0.00015 per request
- Resume parsing: 1-2 requests
- Cover letter: 1 request (+ refinements if needed)
- Match analysis: 1 request
- Answer generation: 1 request per question

**Cost-Saving Tips:**
- Use regex parsing instead of AI for resumes (free)
- Generate content only when needed
- Use gpt-4o-mini for most tasks

## Troubleshooting

### Job scanning not working
- Try using the manual pickers (click-to-select)
- Ensure you're on the actual job posting page
- Some sites may require scrolling to load content

### Resume parsing failed
- Ensure PDF is text-based (not scanned image)
- Try the regex fallback option
- Check that PDF.js library loaded correctly

### AI features not responding
- Verify OpenAI API key is correct
- Check browser console for errors
- Ensure you have API credits available
- Try a different model

## Contributing

This is a personal project by Sureel. Contributions, bug reports, and feature requests are welcome.

## License

[Add your license information here]

## Changelog

### Version History
- **Latest** - FAB content script injection, outreach generation, cover letter editor
- **Previous** - Initial release with core features

---

**Built with ❤️ to make job hunting less painful**
