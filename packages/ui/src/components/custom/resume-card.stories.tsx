import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import {
  ResumeCard,
  CopyChip,
  ResumeSection,
  ResumeEmptyState,
} from "./resume-card"
import type { ResumeData, ResumeSummary } from "./resume-card"
import { Wrench, User } from "lucide-react"

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
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "PostgreSQL",
    "AWS",
    "Docker",
    "Kubernetes",
    "GraphQL",
    "Redis",
    "CI/CD",
    "System Design",
    "Team Leadership",
    "Agile",
    "Next.js",
    "FastAPI",
    "Tailwind CSS",
  ],
  experience: [
    {
      title: "Senior Software Engineer",
      company: "TechCorp Inc.",
      startDate: "Jan 2023",
      endDate: "Present",
      description:
        "Led development of the core platform serving 2M+ daily active users. Managed a team of 5 engineers and drove architecture decisions for the microservices migration.",
      highlights: [
        "Reduced API response time by 60% through Redis caching and query optimization",
        "Led migration from monolith to microservices, improving deployment frequency 4x",
        "Mentored 3 junior developers, 2 of whom were promoted to mid-level",
        "Implemented real-time notification system using WebSocket connections",
      ],
    },
    {
      title: "Software Engineer",
      company: "StartupXYZ",
      startDate: "Jun 2020",
      endDate: "Dec 2022",
      description:
        "Full-stack engineer on the payments platform team. Built and maintained critical financial infrastructure processing $50M+ monthly.",
      highlights: [
        "Built payment reconciliation system handling 100K+ daily transactions",
        "Designed and implemented PCI-compliant checkout flow",
        "Reduced payment processing errors by 95% through comprehensive error handling",
      ],
    },
    {
      title: "Junior Developer",
      company: "WebAgency Co",
      startDate: "Aug 2018",
      endDate: "May 2020",
      description:
        "Developed responsive web applications for clients across finance, healthcare, and e-commerce sectors.",
      highlights: [
        "Delivered 12+ client projects on time and within budget",
        "Introduced component library that reduced development time by 30%",
      ],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "University of California, Berkeley",
      startDate: "2014",
      endDate: "2018",
      gpa: "3.8",
      highlights: [
        "Dean's List all semesters",
        "Teaching Assistant for CS61B Data Structures",
        "Capstone: Distributed Systems Fault Tolerance Research",
      ],
    },
  ],
  certifications: [
    {
      name: "AWS Solutions Architect Professional",
      issuer: "Amazon Web Services",
      date: "2024",
    },
    {
      name: "Kubernetes Administrator (CKA)",
      issuer: "CNCF",
      date: "2023",
    },
  ],
  projects: [
    {
      name: "OpenTrace",
      description:
        "Open-source distributed tracing library for Node.js microservices. Provides automatic instrumentation and visualization of request flows across services.",
      techStack: [
        "TypeScript",
        "Node.js",
        "OpenTelemetry",
        "Grafana",
        "Docker",
      ],
      url: "github.com/marcuschen/opentrace",
    },
    {
      name: "JobFlow CLI",
      description:
        "Command-line tool for automating job application tracking. Integrates with major job boards and exports to CSV/JSON.",
      techStack: ["Python", "Click", "SQLite", "Rich"],
    },
  ],
}

const maxedResumeData: ResumeData = {
  ...fullResumeData,
  id: "resume-maxed",
  fileName: "Executive_Technical_Leader_2026.pdf",
  personalInfo: {
    ...fullResumeData.personalInfo,
    fullName: "Marcus Aurelius Chen",
    phone: "+1 (415) 555-0192 ext. 4452",
    location: "San Francisco - New York - London (Global Citizen)",
    linkedin: "linkedin.com/in/marcus-aurelius-chen-executive-leader",
    website: "executive-leader.marcus-aurelius.dev",
  },
  skills: [
    ...fullResumeData.skills,
    "Strategic Planning",
    "P&L Management",
    "Cross-functional Leadership",
    "Digital Transformation",
    "Quantum Computing",
    "Machine Learning",
    "Generative AI",
    "Cloud Native Architecture",
    "Blockchain",
    "Smart Contracts",
    "Cybersecurity Strategy",
    "Ethical Hacking",
    "DevSecOps",
    "Site Reliability Engineering",
  ],
  experience: [
    {
      ...fullResumeData.experience[0],
      highlights: [
        ...fullResumeData.experience[0].highlights,
        "Architected a global multi-region failover strategy with 99.999% uptime",
        "Streamlined operational costs by $15M/year through intelligent automation",
        "Spearheaded the company-wide adoption of AI-assisted development tools",
      ],
    },
    ...fullResumeData.experience.slice(1),
    {
      title: "Founding Engineer",
      company: "FirstLight SaaS",
      startDate: "Jan 2016",
      endDate: "Jul 2018",
      description: "Third employee at a rapidly scaling SaaS venture. Built the first MVP and scaled to series B.",
      highlights: [
        "Wrote 80% of the initial codebase across frontend, backend, and infrastructure",
        "Scale user base from 0 to 50,000 paid subscribers",
      ],
    },
    {
      title: "Senior Consultant",
      company: "Global Systems Integrator",
      startDate: "Jun 2014",
      endDate: "Dec 2015",
      description: "Technical lead for digital transformation projects for Fortune 500 clients.",
      highlights: [
        "Led 3 major digital overhauls for retail giants",
        "Published internal whitepaper on microservices patterns",
      ],
    },
  ],
  education: [
    ...fullResumeData.education,
    {
      degree: "Executive MBA",
      school: "Stanford Graduate School of Business",
      startDate: "2020",
      endDate: "2022",
    }
  ],
  projects: [
    ...fullResumeData.projects || [],
    {
      name: "QuantLab",
      description: "Experimental framework for simulating quantum algorithms on classical hardware. Utilized by research students at 3 major universities.",
      techStack: ["Python", "NumPy", "C++", "Qiskit"],
      url: "github.com/marcuschen/quantlab",
    },
    {
      name: "EcoScale",
      description: "Platform for auditing and reducing carbon footprints of large-scale cloud deployments. Awarded Top Innovation at GreenTech 2024.",
      techStack: ["React", "GraphQL", "Go", "Terraform", "Prometheus"],
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
      gpa: "3.7",
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
  maxHeight,
}: {
  initialResumeId?: string
  resumes: ResumeSummary[]
  dataMap: Record<string, ResumeData>
  maxHeight?: string
}) {
  const [activeId, setActiveId] = React.useState(initialResumeId)
  const [currentResumes, setCurrentResumes] = React.useState(resumes)

  return (
    <ResumeCard
      resumes={currentResumes}
      activeResumeId={activeId}
      resumeData={activeId ? dataMap[activeId] ?? null : null}
      onResumeSelect={(id) => setActiveId(id)}
      onUpload={() => console.log("[ResumeCard] Upload clicked")}
      onDelete={(id) => {
        console.log(`[ResumeCard] Delete: ${id}`)
        setCurrentResumes((prev) => prev.filter((r) => r.id !== id))
        setActiveId(undefined)
      }}
      maxHeight={maxHeight}
    />
  )
}

// ─── Meta ───────────────────────────────────────────────────────────

const meta = {
  title: "Custom/ResumeCard",
  component: ResumeCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ResumeCard>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Full resume with all sections — personal info, skills, 3 jobs, education, certs, projects. */
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

/** Empty state — no resume selected, shows upload prompt. */
export const EmptyState: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={mockResumes}
        resumeData={null}
        onUpload={() => console.log("Upload clicked")}
      />
    </div>
  ),
}

/** No resumes uploaded at all. Shows empty selector and upload CTA. */
export const NoResumes: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={[]}
        resumeData={null}
        onUpload={() => console.log("Upload clicked")}
      />
    </div>
  ),
}

/** Minimal resume — new grad with limited experience, no certs or projects. */
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

/** Five resumes at the upload limit. Counter shows "5 resumes". */
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

/** Constrained to 400x600 extension popup viewport with scroll. */
export const ExtensionPopup: Story = {
  render: () => (
    <div className="w-[400px] h-[600px] overflow-hidden border border-border rounded-xl bg-background">
      <div className="p-2 h-full flex flex-col">
        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 mb-1">
          Extension Sidebar
        </div>
        <div className="flex-1 min-h-0">
          <InteractiveResumeCard
            initialResumeId="resume-1"
            resumes={mockResumes}
            dataMap={{
              "resume-1": fullResumeData,
              "resume-3": minimalResumeData,
            }}
            maxHeight="440px"
          />
        </div>
      </div>
    </div>
  ),
}

/** Full desktop width — dashboard resumes page layout. */
export const DashboardWidth: Story = {
  render: () => (
    <div className="w-[600px]">
      <InteractiveResumeCard
        initialResumeId="resume-1"
        resumes={mockResumes}
        dataMap={{
          "resume-1": fullResumeData,
          "resume-3": minimalResumeData,
        }}
        maxHeight="700px"
      />
    </div>
  ),
}

// ─── Sub-component Stories ──────────────────────────────────────────

/** Standalone CopyChip — click to copy text to clipboard with tooltip feedback. */
export const CopyChipDemo: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      <CopyChip value="marcus.chen@email.com" />
      <CopyChip value="TypeScript" />
      <CopyChip value="+1 (415) 555-0192" />
      <CopyChip value="San Francisco, CA" />
      <CopyChip value="React" />
      <CopyChip value="Node.js" />
      <CopyChip value="PostgreSQL" />
    </div>
  ),
}

/** Standalone ResumeSection — expandable section wrapper with icon, count, copy-all. */
export const SectionDemo: Story = {
  render: () => (
    <div className="w-[380px] space-y-2 p-4">
      <ResumeSection
        icon={<User />}
        title="Personal Info"
        count={4}
        copyAllValue="Marcus Chen\nmarcus@email.com"
        defaultOpen
      >
        <div className="flex flex-wrap gap-1.5">
          <CopyChip value="Marcus Chen" />
          <CopyChip value="marcus@email.com" />
          <CopyChip value="+1 (415) 555-0192" />
          <CopyChip value="San Francisco, CA" />
        </div>
      </ResumeSection>
      <ResumeSection
        icon={<Wrench />}
        title="Skills"
        count={5}
        copyAllValue="TypeScript, React, Node.js, Python, PostgreSQL"
      >
        <div className="flex flex-wrap gap-1.5">
          <CopyChip value="TypeScript" />
          <CopyChip value="React" />
          <CopyChip value="Node.js" />
          <CopyChip value="Python" />
          <CopyChip value="PostgreSQL" />
        </div>
      </ResumeSection>
    </div>
  ),
}

/** Standalone EmptyState component. */
export const EmptyStateDemo: Story = {
  render: () => (
    <div className="w-[380px] border border-border rounded-xl p-4">
      <ResumeEmptyState onUpload={() => console.log("Upload")} />
    </div>
  ),
}

/** Maxed out resume — extreme case with many skills, jobs, highlights, projects, and education. */
export const MaxedOut: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={mockResumes}
        activeResumeId="resume-maxed"
        resumeData={maxedResumeData}
        maxHeight="700px"
      />
    </div>
  ),
}

/** Color Variants Comparison: Default vs Subtle vs Bold */
export const ColorVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-[400px]">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Default</h3>
        <ResumeCard
          resumes={mockResumes}
          activeResumeId="resume-1"
          resumeData={fullResumeData}
          variant="default"
          maxHeight="auto"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Subtle</h3>
        <ResumeCard
          resumes={mockResumes}
          activeResumeId="resume-1"
          resumeData={fullResumeData}
          variant="subtle"
          maxHeight="auto"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Bold</h3>
        <ResumeCard
          resumes={mockResumes}
          activeResumeId="resume-1"
          resumeData={fullResumeData}
          variant="bold"
          maxHeight="auto"
        />
      </div>
    </div>
  ),
}

/** Resume parsing in progress - shows animated indeterminate progress bar. */
export const ParsingInProgress: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={mockResumes}
        activeResumeId="resume-1"
        resumeData={null}
        isParsing={true}
        onUpload={() => console.log("Upload clicked")}
        onReparse={(id) => console.log("Reparse clicked:", id)}
      />
    </div>
  ),
}

/** Resume parsing with progress percentage - shows determinate progress bar. */
export const ParsingWithProgress: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={mockResumes}
        activeResumeId="resume-1"
        resumeData={null}
        isParsing={true}
        parseProgress={65}
        onUpload={() => console.log("Upload clicked")}
        onReparse={(id) => console.log("Reparse clicked:", id)}
      />
    </div>
  ),
}

/** Newly uploaded resume being processed. */
export const UploadingResume: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={[...mockResumes, { id: "resume-new", fileName: "New_Resume_2026.pdf" }]}
        activeResumeId="resume-new"
        resumeData={null}
        isParsing={true}
        parseProgress={25}
        onUpload={() => console.log("Upload clicked")}
      />
    </div>
  ),
}

/** Parse failed - shows error state with retry button. */
export const ParseError: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={mockResumes}
        activeResumeId="resume-1"
        resumeData={null}
        parseError="Unable to parse resume. The PDF may be corrupted or password-protected."
        onUpload={() => console.log("Upload clicked")}
        onReparse={(id) => console.log("Reparse clicked:", id)}
      />
    </div>
  ),
}

/** Resume with many experience entries — demonstrates scrollable experience block when expanded. */
export const ScrollableExperience: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeCard
        resumes={mockResumes}
        activeResumeId="resume-maxed"
        resumeData={maxedResumeData}
        maxHeight="500px"
      />
    </div>
  ),
}
