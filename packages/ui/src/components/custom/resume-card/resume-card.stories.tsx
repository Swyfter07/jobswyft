import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ResumeCard } from "./resume-card"
import type { ResumeData, ResumeSummary } from "./types"

// ─── Mock Data ────────────────────────────────────────────────────────────────

const fullResumeData: ResumeData = {
  id: "resume-1",
  fileName: "Marcus_Chen_SWE_2026.pdf",
  personalInfo: {
    fullName: "Marcus Chen",
    email: "marcus.chen@example.com",
    phone: "+1 555-123-4567",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/marcuschen",
    website: "marcuschen.dev",
  },
  skills: [
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "PostgreSQL",
    "AWS",
    "Docker",
    "GraphQL",
    "REST APIs",
    "CI/CD",
    "Tailwind CSS",
    "Next.js",
    "Redis",
    "Kubernetes",
    "Git",
    "Agile",
    "TDD",
  ],
  experience: [
    {
      title: "Senior Software Engineer",
      company: "TechCorp Inc",
      startDate: "Jan 2023",
      endDate: "Present",
      description:
        "Led development of the core platform serving 2M+ daily active users. Architected and shipped key features across the full stack.",
      highlights: [
        "Reduced API response time by 60% through query optimization and caching",
        "Led migration from monolith to microservices architecture",
        "Mentored 3 junior developers through structured pairing sessions",
      ],
    },
    {
      title: "Software Engineer",
      company: "StartupXYZ",
      startDate: "Jun 2020",
      endDate: "Dec 2022",
      description:
        "Full-stack engineer on the payments team. Built and maintained critical billing infrastructure processing $50M+ annually.",
      highlights: [
        "Built real-time payment processing pipeline handling 10K+ transactions/day",
        "Implemented PCI-DSS compliant card storage system",
        "Reduced deployment time from 45 minutes to 5 minutes with CI/CD improvements",
      ],
    },
    {
      title: "Junior Developer",
      company: "WebAgency Co",
      startDate: "Aug 2018",
      endDate: "May 2020",
      description:
        "Developed client websites and internal tools using React and Node.js.",
      highlights: [
        "Delivered 15+ client projects on time and within budget",
        "Created reusable component library adopted across 8 projects",
      ],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "UC Berkeley",
      startDate: "Aug 2014",
      endDate: "May 2018",
      gpa: "3.8",
      highlights: [
        "Dean's List 6 consecutive semesters",
        "Senior thesis: Distributed consensus in edge computing networks",
      ],
    },
  ],
  certifications: [
    {
      name: "AWS Solutions Architect Professional",
      issuer: "Amazon Web Services",
      date: "Mar 2024",
    },
    {
      name: "Certified Kubernetes Administrator",
      issuer: "CNCF",
      date: "Nov 2023",
    },
  ],
  projects: [
    {
      name: "OpenMetrics Dashboard",
      description:
        "Open-source observability dashboard for Kubernetes clusters with real-time metrics visualization and alerting.",
      techStack: ["React", "Go", "Prometheus", "Grafana", "WebSocket"],
      url: "https://github.com/marcuschen/openmetrics",
    },
    {
      name: "CodeReview Bot",
      description:
        "AI-powered code review assistant that integrates with GitHub PRs to provide automated suggestions.",
      techStack: ["Python", "FastAPI", "OpenAI", "GitHub API"],
    },
  ],
}

const minimalResumeData: ResumeData = {
  id: "resume-2",
  fileName: "Jane_Doe_Resume.pdf",
  personalInfo: {
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "+1 555-987-6543",
    location: "New York, NY",
  },
  skills: ["JavaScript", "HTML", "CSS"],
  experience: [
    {
      title: "Web Developer",
      company: "Freelance",
      startDate: "Jan 2024",
      endDate: "Present",
      description: "Building websites for small businesses.",
      highlights: ["Delivered 5 client projects"],
    },
  ],
  education: [
    {
      degree: "B.A. Information Technology",
      school: "NYU",
      startDate: "Sep 2020",
      endDate: "Jun 2024",
    },
  ],
}

const mockResumes: ResumeSummary[] = [
  { id: "resume-1", fileName: "Marcus_Chen_SWE_2026.pdf" },
  { id: "resume-2", fileName: "Jane_Doe_Resume.pdf" },
  { id: "resume-3", fileName: "Alex_Smith_Backend.pdf" },
]

const maxResumes: ResumeSummary[] = [
  { id: "resume-1", fileName: "Marcus_Chen_SWE_2026.pdf" },
  { id: "resume-2", fileName: "Jane_Doe_Resume.pdf" },
  { id: "resume-3", fileName: "Alex_Smith_Backend.pdf" },
  { id: "resume-4", fileName: "Taylor_ML_Engineer.pdf" },
  { id: "resume-5", fileName: "Jordan_Frontend_2026.pdf" },
]

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "Custom/ResumeCard",
  component: ResumeCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md" style={{ height: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResumeCard>

export default meta
type Story = StoryObj<typeof meta>

// ─── Empty State ──────────────────────────────────────────────────────────────

export const EmptyState: Story = {
  args: {
    resumes: [],
    state: "empty",
  },
}

export const EmptyStateDark: Story = {
  args: {
    resumes: [],
    state: "empty",
  },
  parameters: {
    themes: { themeOverride: "dark" },
  },
}

// ─── Uploading State ──────────────────────────────────────────────────────────

export const Uploading25: Story = {
  args: {
    resumes: [],
    state: "uploading",
    uploadProgress: 25,
    uploadFileName: "New_Resume.pdf",
  },
}

export const Uploading67: Story = {
  args: {
    resumes: mockResumes,
    state: "uploading",
    uploadProgress: 67,
    uploadFileName: "New_Resume.pdf",
  },
}

export const Uploading95: Story = {
  args: {
    resumes: [],
    state: "uploading",
    uploadProgress: 95,
    uploadFileName: "Senior_Dev_Resume_2026.pdf",
  },
}

export const UploadingDark: Story = {
  args: {
    resumes: [],
    state: "uploading",
    uploadProgress: 67,
    uploadFileName: "New_Resume.pdf",
  },
  parameters: {
    themes: { themeOverride: "dark" },
  },
}

// ─── Parsing State ────────────────────────────────────────────────────────────

export const Parsing: Story = {
  args: {
    resumes: [],
    state: "parsing",
  },
}

export const ParsingDark: Story = {
  args: {
    resumes: [],
    state: "parsing",
  },
  parameters: {
    themes: { themeOverride: "dark" },
  },
}

// ─── Idle State ───────────────────────────────────────────────────────────────

export const FullResume: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    resumeData: fullResumeData,
    state: "idle",
  },
}

export const FullResumeDark: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    resumeData: fullResumeData,
    state: "idle",
  },
  parameters: {
    themes: { themeOverride: "dark" },
  },
}

export const MinimalResume: Story = {
  args: {
    resumes: [mockResumes[1]],
    activeResumeId: "resume-2",
    resumeData: minimalResumeData,
    state: "idle",
  },
}

export const MaxResumes: Story = {
  args: {
    resumes: maxResumes,
    activeResumeId: "resume-1",
    resumeData: fullResumeData,
    state: "idle",
  },
}

// ─── Loading State ────────────────────────────────────────────────────────────

export const Loading: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    state: "loading",
  },
}

export const LoadingDark: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    state: "loading",
  },
  parameters: {
    themes: { themeOverride: "dark" },
  },
}

// ─── Error State ──────────────────────────────────────────────────────────────

export const ErrorWithResumes: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    state: "error",
    errorMessage: "Failed to parse resume",
    errorGuidanceText: "The file may be corrupted or in an unsupported format.",
  },
}

export const ErrorFirstUpload: Story = {
  args: {
    resumes: [],
    state: "error",
    errorMessage: "Failed to upload resume",
    errorGuidanceText: "Please check your connection and try again.",
  },
}

export const ErrorDark: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    state: "error",
    errorMessage: "Network error",
  },
  parameters: {
    themes: { themeOverride: "dark" },
  },
}

// ─── Interactive / Viewport Stories ───────────────────────────────────────────

export const InteractiveStateTransitions: Story = {
  render: () => {
    const [state, setState] = useState<
      "empty" | "uploading" | "parsing" | "idle"
    >("empty")
    const [progress, setProgress] = useState(0)

    const handleUpload = () => {
      setState("uploading")
      setProgress(0)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => {
              setState("parsing")
              setTimeout(() => setState("idle"), 2000)
            }, 500)
            return 100
          }
          return prev + 10
        })
      }, 300)
    }

    return (
      <ResumeCard
        resumes={state === "idle" ? mockResumes : []}
        activeResumeId={state === "idle" ? "resume-1" : undefined}
        resumeData={state === "idle" ? fullResumeData : undefined}
        state={state}
        uploadProgress={progress}
        uploadFileName="New_Resume.pdf"
        onUpload={handleUpload}
      />
    )
  },
}

export const MobileViewport: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    resumeData: fullResumeData,
    state: "idle",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 375 }}>
        <Story />
      </div>
    ),
  ],
}

export const TabletViewport: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    resumeData: fullResumeData,
    state: "idle",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 768 }}>
        <Story />
      </div>
    ),
  ],
}

export const DesktopViewport: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    resumeData: fullResumeData,
    state: "idle",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 1440 }}>
        <Story />
      </div>
    ),
  ],
}

export const ExtensionSidebar: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    resumeData: fullResumeData,
    state: "idle",
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, minWidth: 320, height: 600 }}>
        <Story />
      </div>
    ),
  ],
}

export const DashboardWidth: Story = {
  args: {
    resumes: mockResumes,
    activeResumeId: "resume-1",
    resumeData: fullResumeData,
    state: "idle",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 600 }}>
        <Story />
      </div>
    ),
  ],
}
