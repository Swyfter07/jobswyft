import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { ResumeCard } from "./resume-card"
import type { ResumeData, ResumeSummary } from "./resume-card"

// ─── Mock Data ──────────────────────────────────────────────────────

const mockResumes: ResumeSummary[] = [
  { id: "resume-1", fileName: "Marcus_Chen_SWE_2026.pdf" },
  { id: "resume-2", fileName: "Marcus_Chen_EM_2026.pdf" },
  { id: "resume-3", fileName: "Jenna_Morales_Resume.pdf" },
]

const fullResumeData: ResumeData = {
  id: "resume-1",
  fileName: "Marcus_Chen_SWE_2026.pdf",
  personalInfo: {
    fullName: "Marcus Chen",
    email: "marcus.chen@email.com",
    phone: "+1 (415) 555-0192",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/marcuschen",
    website: "marcuschen.dev",
  },
  skills: [
    "TypeScript", "React", "Node.js", "Python", "PostgreSQL", "AWS",
    "Docker", "Kubernetes", "GraphQL", "Redis", "CI/CD", "System Design",
    "Team Leadership", "Agile", "Next.js", "FastAPI", "Tailwind CSS",
  ],
  experience: [
    {
      title: "Senior Software Engineer",
      company: "TechCorp Inc.",
      startDate: "Jan 2023",
      endDate: "Present",
      description:
        "Led development of the core platform serving 2M+ daily active users. Managed a team of 5 engineers and drove architecture decisions for the microservices migration. Implemented comprehensive monitoring and alerting that reduced incident response time by 40%.",
      highlights: [
        "Reduced API response time by 60% through Redis caching and query optimization",
        "Led migration from monolith to microservices, improving deployment frequency 4x",
        "Mentored 3 junior developers, 2 of whom were promoted to mid-level",
        "Architected event-driven notification system handling 10M+ daily events",
        "Introduced automated integration testing pipeline reducing QA cycle from 3 days to 4 hours",
        "Led cross-team initiative to standardize API contracts across 12 microservices",
      ],
    },
    {
      title: "Software Engineer",
      company: "StartupXYZ",
      startDate: "Jun 2020",
      endDate: "Dec 2022",
      description:
        "Full-stack engineer on the payments platform team.",
      highlights: [
        "Built payment reconciliation system handling 100K+ daily transactions",
        "Designed and implemented PCI-compliant checkout flow",
      ],
    },
    {
      title: "Junior Developer",
      company: "WebAgency Co",
      startDate: "Aug 2018",
      endDate: "May 2020",
      description:
        "Developed responsive web applications for clients across finance and e-commerce.",
      highlights: [
        "Delivered 12+ client projects on time and within budget",
      ],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "University of California, Berkeley",
      startDate: "2014",
      endDate: "2018",
    },
  ],
  certifications: [
    { name: "AWS Solutions Architect Professional", issuer: "Amazon Web Services", date: "2024" },
    { name: "Kubernetes Administrator (CKA)", issuer: "CNCF", date: "2023" },
  ],
  projects: [
    {
      name: "OpenTrace",
      description:
        "Open-source distributed tracing library for Node.js microservices.",
      techStack: ["TypeScript", "Node.js", "OpenTelemetry", "Grafana", "Docker"],
      url: "github.com/marcuschen/opentrace",
    },
    {
      name: "JobFlow CLI",
      description:
        "Command-line tool for automating job application tracking.",
      techStack: ["Python", "Click", "SQLite", "Rich"],
    },
  ],
}

const minimalResumeData: ResumeData = {
  id: "resume-3",
  fileName: "Jenna_Morales_Resume.pdf",
  personalInfo: {
    fullName: "Jenna Morales",
    email: "jenna.m@university.edu",
    phone: "+1 (555) 123-4567",
    location: "Austin, TX",
  },
  skills: ["Python", "Java", "SQL", "Git", "React"],
  experience: [
    {
      title: "Software Engineering Intern",
      company: "FinTech Solutions",
      startDate: "Jun 2025",
      endDate: "Aug 2025",
      description:
        "Developed features for the mobile banking application used by 500K+ users.",
      highlights: [
        "Built peer-to-peer payment simulator as capstone project",
        "Implemented unit tests achieving 85% code coverage",
      ],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "University of Texas at Austin",
      startDate: "2022",
      endDate: "2026",
    },
  ],
}

const fiveResumes: ResumeSummary[] = [
  { id: "resume-1", fileName: "Marcus_Chen_SWE_2026.pdf" },
  { id: "resume-2", fileName: "Marcus_Chen_EM_2026.pdf" },
  { id: "resume-3", fileName: "Jenna_Morales_Resume.pdf" },
  { id: "resume-4", fileName: "David_Okonkwo_VP_Eng.pdf" },
  { id: "resume-5", fileName: "Aisha_Patel_Marketing.pdf" },
]

// ─── Interactive Wrapper ────────────────────────────────────────────

function InteractiveResumeCard({
  initialResumeId,
  resumes,
  dataMap,
  isCollapsible,
}: {
  initialResumeId?: string
  resumes: ResumeSummary[]
  dataMap: Record<string, ResumeData>
  isCollapsible?: boolean
}) {
  const [activeId, setActiveId] = React.useState(initialResumeId)
  const [currentResumes, setCurrentResumes] = React.useState(resumes)
  const [isOpen, setIsOpen] = React.useState(true)

  return (
    <ResumeCard
      resumes={currentResumes}
      activeResumeId={activeId ?? null}
      resumeData={activeId ? dataMap[activeId] ?? null : null}
      onResumeSelect={(id) => setActiveId(id)}
      onUpload={() => console.log("[ResumeCard] Upload clicked")}
      onDelete={(id) => {
        console.log(`[ResumeCard] Delete: ${id}`)
        setCurrentResumes((prev) => prev.filter((r) => r.id !== id))
        setActiveId(undefined)
      }}
      isCollapsible={isCollapsible}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    />
  )
}

// ─── Meta ───────────────────────────────────────────────────────────

const meta = {
  title: "Features/ResumeCard",
  component: ResumeCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ResumeCard>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Full resume with all sections — interactive wrapper. */
export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <InteractiveResumeCard
        initialResumeId="resume-1"
        resumes={mockResumes}
        dataMap={{
          "resume-1": fullResumeData,
          "resume-3": minimalResumeData,
        }}
      />
    </div>
  ),
}

/** Empty state — just the dotted upload card (no header/dropdown). */
export const EmptyState: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={[]}
        activeResumeId={null}
        resumeData={null}
        onUpload={() => console.log("Upload clicked")}
      />
    </div>
  ),
}

/** Loading — Skeleton shimmer while fetching or uploading. */
export const Loading: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={mockResumes}
        activeResumeId="resume-1"
        resumeData={null}
        isLoading
      />
    </div>
  ),
}

/** Uploading from empty state — shows skeleton (same as loading). */
export const UploadingFromEmpty: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={[]}
        activeResumeId={null}
        resumeData={null}
        isUploading
      />
    </div>
  ),
}

/** Connection error — shows error only, no resume blocks. */
export const Error: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={mockResumes}
        activeResumeId="resume-1"
        resumeData={null}
        error="Check your connection and try again"
        onRetry={() => console.log("Retry clicked")}
        onClearError={() => console.log("Clear error")}
      />
    </div>
  ),
}

/** Five resumes at limit. */
export const MaxResumes: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={fiveResumes}
        activeResumeId="resume-1"
        resumeData={fullResumeData}
      />
    </div>
  ),
}

/** New grad with limited data. */
export const MinimalResume: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={mockResumes}
        activeResumeId="resume-3"
        resumeData={minimalResumeData}
      />
    </div>
  ),
}

/** Collapsible in collapsed state (slim trigger bar). */
export const Collapsed: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false)
    return (
      <div className="w-[400px]">
        <ResumeCard
          resumes={mockResumes}
          activeResumeId="resume-1"
          resumeData={fullResumeData}
          isCollapsible
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>
    )
  },
}

/** 360px width constraint (extension viewport). */
export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <InteractiveResumeCard
        initialResumeId="resume-1"
        resumes={mockResumes}
        dataMap={{
          "resume-1": fullResumeData,
          "resume-3": minimalResumeData,
        }}
        isCollapsible
      />
    </div>
  ),
}

/** Dark theme variant (use Storybook theme toggle). */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl">
      <InteractiveResumeCard
        initialResumeId="resume-1"
        resumes={mockResumes}
        dataMap={{
          "resume-1": fullResumeData,
          "resume-3": minimalResumeData,
        }}
      />
    </div>
  ),
}
