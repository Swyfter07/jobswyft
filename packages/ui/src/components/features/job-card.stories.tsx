import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { JobCard } from "./job-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { JobData } from "@/lib/mappers"

// ─── Mock Data ──────────────────────────────────────────────────────

const fullJob: JobData = {
  title: "Senior Frontend Engineer",
  company: "Acme Corp",
  location: "San Francisco, CA (Hybrid)",
  salary: "$150k – $200k",
  employmentType: "Full-time",
  sourceUrl: "https://boards.greenhouse.io/acme/jobs/12345",
  status: "saved",
  description:
    "We're looking for a Senior Frontend Engineer to join our product team. You'll build and maintain our React-based UI, mentor junior engineers, and drive architectural decisions. Experience with TypeScript, Next.js, and design systems is highly valued. You will work closely with product and design to ship delightful user experiences at scale.",
  logo: undefined,
}

const minimalJob: JobData = {
  title: "Software Engineer",
  company: "StartupCo",
  location: "Remote",
  description: "Build things.",
}

const missingFieldsJob: JobData = {
  title: "",
  company: "",
  location: "",
  description: "",
}

const noDescriptionJob: JobData = {
  title: "Backend Developer",
  company: "DataCorp",
  location: "New York, NY",
  salary: "$130k – $170k",
  employmentType: "Full-time",
}

// ─── Story Wrapper ──────────────────────────────────────────────────

function InteractiveWrapper({ initialJob, ...rest }: { initialJob: JobData } & Record<string, unknown>) {
  const [job, setJob] = React.useState(initialJob)
  const [isEditing, setIsEditing] = React.useState(rest.isEditing as boolean ?? false)
  const [isSaving, setIsSaving] = React.useState(false)

  return (
    <JobCard
      job={job}
      isEditing={isEditing}
      onEditToggle={() => setIsEditing(!isEditing)}
      onFieldChange={(field, value) => setJob((prev) => ({ ...prev, [field]: value }))}
      onSave={() => {
        setIsSaving(true)
        setTimeout(() => setIsSaving(false), 1500)
      }}
      isSaving={isSaving}
    />
  )
}

// ─── Meta ───────────────────────────────────────────────────────────

const meta: Meta<typeof JobCard> = {
  title: "Features/JobCard",
  component: JobCard,
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "extensionDefault" },
  },
  decorators: [
    (Story) => (
      <div className="w-[340px]">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof JobCard>

// ─── Stories ────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => <InteractiveWrapper initialJob={fullJob} />,
}

export const Minimal: Story = {
  render: () => <InteractiveWrapper initialJob={minimalJob} />,
}

export const MissingFields: Story = {
  render: () => <InteractiveWrapper initialJob={missingFieldsJob} />,
}

export const EditMode: Story = {
  render: () => <InteractiveWrapper initialJob={fullJob} isEditing />,
}

export const EmptyDescription: Story = {
  render: () => <InteractiveWrapper initialJob={noDescriptionJob} />,
}

export const Saving: Story = {
  args: {
    job: fullJob,
    isSaving: true,
  },
}

export const WithMatchAnalysis: Story = {
  name: "With Match Analysis",
  args: {
    job: fullJob,
    match: {
      score: 85,
      matchedSkills: ["React", "TypeScript", "Next.js", "Design Systems"],
      missingSkills: ["Python", "Kubernetes"],
      summary: "Strong match based on frontend expertise and design system experience.",
    },
  },
}

export const AnalyzingMatch: Story = {
  name: "Analyzing Match",
  args: {
    job: fullJob,
    isAnalyzing: true,
  },
}

export const Scanning: Story = {
  name: "Scanning Overlay",
  args: {
    job: fullJob,
    isScanning: true,
  },
}

export const DarkMode: Story = {
  name: "Dark Mode",
  decorators: [
    (Story) => (
      <div className="dark bg-background p-4 rounded-xl w-[340px]">
        <Story />
      </div>
    ),
  ],
  render: () => <InteractiveWrapper initialJob={fullJob} />,
}

export const DarkModeWithMatch: Story = {
  name: "Dark Mode: With Match",
  decorators: [
    (Story) => (
      <div className="dark bg-background p-4 rounded-xl w-[340px]">
        <Story />
      </div>
    ),
  ],
  args: {
    job: fullJob,
    match: {
      score: 72,
      matchedSkills: ["React", "TypeScript"],
      missingSkills: ["Python", "AWS", "Docker"],
      summary: "Good fit with room for growth in backend skills.",
    },
  },
}

export const ExtensionViewport: Story = {
  name: "Extension Viewport (360×600)",
  parameters: {
    viewport: { defaultViewport: "extensionDefault" },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] p-3">
        <Story />
      </div>
    ),
  ],
  render: () => <InteractiveWrapper initialJob={fullJob} />,
}

/** Loading skeleton that matches the JobCard layout — shown during scanning */
export const Loading: Story = {
  name: "Loading (Skeleton)",
  render: () => (
    <div className="w-full space-y-3 rounded-lg border-2 border-card-accent-border p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  ),
}
