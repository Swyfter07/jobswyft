import type { Meta, StoryObj } from "@storybook/react-vite"
import { JobCard } from "./job-card"
import type { JobData, MatchData } from "./job-card"

const meta = {
    title: "Custom/JobCard (Summary)",
    component: JobCard,
    parameters: { layout: "centered" },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-[340px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof JobCard>

export default meta
type Story = StoryObj<typeof meta>

const MOCK_JOB: JobData = {
    title: "Senior Frontend Engineer",
    company: "Acme Corp",
    location: "San Francisco, CA (Hybrid)",
    salary: "$150k – $200k",
    postedAt: "2 days ago",
    description:
        "We're looking for a Senior Frontend Engineer to join our product team. You'll build and maintain our React-based UI, mentor junior engineers, and drive architectural decisions.",
}

const MOCK_MATCH: MatchData = {
    score: 85,
    matchedSkills: ["React", "TypeScript", "Design Systems"],
    missingSkills: ["Python", "Kubernetes"],
    summary: "Strong match based on frontend expertise.",
}

export const Default: Story = {
    args: { job: MOCK_JOB },
}

export const WithMatch: Story = {
    name: "With Match Analysis",
    args: { job: MOCK_JOB, match: MOCK_MATCH },
}

export const MinimalJob: Story = {
    name: "Minimal Fields",
    args: {
        job: {
            title: "Software Engineer",
            company: "StartupCo",
            location: "Remote",
        },
    },
}

export const EditMode: Story = {
    name: "Edit Mode",
    args: { job: MOCK_JOB, isEditing: true },
}

export const WithActions: Story = {
    name: "With Coach & Dive Deeper Actions",
    args: {
        job: MOCK_JOB,
        match: MOCK_MATCH,
        onCoach: () => {},
        onDiveDeeper: () => {},
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
    args: { job: MOCK_JOB, match: MOCK_MATCH },
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
    args: { job: MOCK_JOB },
}
