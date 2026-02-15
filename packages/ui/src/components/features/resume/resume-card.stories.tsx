import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { ResumeCard } from "./resume-card"
import type { ResumeData, ResumeSummary } from "./resume-card"
import {
  mockResumes,
  fullResumeData,
  minimalResumeData,
  fiveResumes,
} from "./__fixtures__/mock-resume-data"

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
  title: "Features/Resume/ResumeCard",
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
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true)
    return (
      <div className="w-[400px]">
        <ResumeCard
          resumes={[]}
          activeResumeId={null}
          resumeData={null}
          onUpload={() => console.log("Upload clicked")}
          isCollapsible
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>
    )
  },
}

/** Loading — Skeleton shimmer while fetching or uploading. */
export const Loading: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true)
    return (
      <div className="w-[400px]">
        <ResumeCard
          resumes={mockResumes}
          activeResumeId="resume-1"
          resumeData={null}
          isLoading
          isCollapsible
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>
    )
  },
}

/** Uploading from empty state — shows skeleton (same as loading). */
export const UploadingFromEmpty: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true)
    return (
      <div className="w-[400px]">
        <ResumeCard
          resumes={[]}
          activeResumeId={null}
          resumeData={null}
          isUploading
          isCollapsible
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>
    )
  },
}

/** Connection error — shows error only, no resume blocks. */
export const Error: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(true)
    return (
      <div className="w-[400px]">
        <ResumeCard
          resumes={mockResumes}
          activeResumeId="resume-1"
          resumeData={null}
          error="Check your connection and try again"
          onRetry={() => console.log("Retry clicked")}
          onClearError={() => console.log("Clear error")}
          isCollapsible
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </div>
    )
  },
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
