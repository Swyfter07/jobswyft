import type { Meta, StoryObj } from "@storybook/react-vite"
import { JobCard } from "./job-card"

const meta = {
    title: "Features/JobCard",
    component: JobCard,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        onCoach: { action: "coach" },
    },
} satisfies Meta<typeof JobCard>

export default meta
type Story = StoryObj<typeof meta>

// Sample Data
const sampleJob = {
    title: "Senior Product Designer",
    company: "Stripe",
    location: "San Francisco, CA (Remote)",
    salary: "$160k - $220k",
    postedAt: "2 days ago",
    description: "We are looking for a senior designer...",
}

const sampleMatch = {
    score: 87,
    matchedSkills: ["Figma", "Design Systems", "Prototyping", "User Research"],
    missingSkills: ["Principle", "After Effects"],
    summary: "You are a strong match for this role based on your experience with design systems at scalable tech companies. Your lack of motion design (Principle) is a minor gap.",
}

export const Default: Story = {
    args: {
        job: sampleJob,
        match: sampleMatch,
        className: "w-[400px]",
    },
}

export const PerfectMatch: Story = {
    args: {
        job: { ...sampleJob, title: "Principal Engineer" },
        match: {
            score: 98,
            matchedSkills: ["React", "TypeScript", "Node.js", "System Design", "AWS"],
            missingSkills: [],
            summary: "An exceptional match. Your background aligns perfectly with the required tech stack and leadership scope.",
        },
        className: "w-[400px]",
    },
}

export const LowMatch: Story = {
    args: {
        job: { ...sampleJob, title: "Marketing Manager" },
        match: {
            score: 42,
            matchedSkills: ["Communication"],
            missingSkills: ["SEO", "Content Strategy", "Google Ads", "Analytics"],
            summary: "This role requires significant marketing domain knowledge which is not present in your engineering-focused resume.",
        },
        className: "w-[400px]",
    },
}

export const LoadingState: Story = {
    args: {
        job: { ...sampleJob, title: "Loading...", company: "Loading..." },
        className: "w-[400px]",
        // Implementation note: You might want to add a real loading state prop later
    },
}

export const ManualEntry: Story = {
    args: {
        job: { ...sampleJob, title: "", company: "", description: "" },
        match: undefined,
        className: "w-[400px]",
        isEditing: true,
    },
}
