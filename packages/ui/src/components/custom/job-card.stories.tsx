import type { Meta, StoryObj } from "@storybook/react"
import { JobCard } from "./job-card"

const meta = {
    title: "Custom/JobCard",
    component: JobCard,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        onCoach: { action: "coach" },
        onSave: { action: "save" },
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

export const LongDescription: Story = {
    args: {
        job: {
            ...sampleJob,
            description: `We are looking for a Senior Product Designer to join our team.

Responsibilities:
• Lead design projects from concept to launch
• Collaborate with engineers and product managers
• Conduct user research and usability testing
• Create high-fidelity mockups and prototypes
• Maintain and evolve our design system

Requirements:
• 5+ years of experience in product design
• Strong portfolio showcasing your design process
• Proficiency in Figma and other design tools
• Excellent communication and collaboration skills
• Experience with localized products is a plus

About Us:
Stripe is a technology company that builds economic infrastructure for the internet. Businesses of every size—from new startups to public companies—use our software to accept payments and manage their businesses online.

Benefits:
• Competitive salary and equity
• Comprehensive health, dental, and vision insurance
• 401(k) plan with company match
• Generous parental leave
• Flexible vacation policy
• Wellness program
• Learning and development stipend

Join us in building the global economic infrastructure for the internet.`
        },
        match: sampleMatch,
        className: "w-[400px]",
    },
}

export const SavedJob: Story = {
    args: {
        job: sampleJob,
        match: sampleMatch,
        className: "w-[400px]",
        isSaved: true,
    },
}
