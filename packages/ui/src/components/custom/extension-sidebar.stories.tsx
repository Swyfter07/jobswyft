import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ExtensionSidebar } from "./extension-sidebar"
import { AIStudio } from "./ai-studio"
import { Coach } from "./coach"
import { Autofill } from "./autofill"
import { AppHeader } from "./app-header"
import { ResumeCard } from "./resume-card"
import { CreditBalance } from "./credit-balance"
import { JobCard } from "./job-card"

// Mock Data
const MOCK_RESUME_DATA = {
    id: "1",
    fileName: "Senior_Product_Designer.pdf",
    personalInfo: { fullName: "Alex Chen", email: "alex@example.com", phone: "+1 (555) 123-4567", location: "SF", linkedin: "in/alex", website: "alex.design" },
    skills: ["Figma", "React", "TypeScript", "Design Systems"],
    experience: [{ title: "Senior Product Designer", company: "Tech Corp", startDate: "2021", endDate: "Present", description: "Design systems.", highlights: [] }],
    education: [], certifications: [], projects: []
}

const MOCK_JOB = {
    title: "Senior Product Designer",
    company: "Stripe",
    location: "Remote",
    salary: "$140k - $180k",
    postedAt: "2h ago",
    description: "We are looking for a Senior Product Designer...",
}

const MOCK_MATCH = {
    score: 92,
    matchedSkills: ["Figma", "Design Systems", "Prototyping"],
    missingSkills: ["Principle", "Origami"],
    summary: "Strong match for your experience in design systems."
}

const meta = {
    title: "Custom/ExtensionSidebar",
    component: ExtensionSidebar,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ExtensionSidebar>

export default meta
type Story = StoryObj<typeof meta>

const CenteredLayout = (Story: any) => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="relative w-[400px]" style={{ height: '85vh' }}>
            <Story />
        </div>
    </div>
)

export const JobDetected: Story = {
    decorators: [CenteredLayout],
    render: (args) => <ExtensionSidebarWithState {...args} />,
    args: {
        header: <AppHeader appName="JobSwyft" />,
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        // scanContent is handled by the wrapper to inject handlers
        isLocked: false,
    },
}

export const NoJobDetected: Story = {
    decorators: [CenteredLayout],
    args: {
        header: <AppHeader appName="JobSwyft" />,
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        contextContent: (
            <ResumeCard
                resumes={[{ id: "1", fileName: "Senior_Product_Designer.pdf" }]}
                activeResumeId="1"
                resumeData={MOCK_RESUME_DATA}
            />
        ),
        scanContent: (
            <>
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/25">
                    <div className="rounded-full bg-muted p-3">
                        <span className="text-2xl">🔍</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">No Job Detected</h3>
                        <p className="text-sm text-muted-foreground px-4">
                            Navigate to a job posting to unlock AI tools.
                        </p>
                    </div>
                    <div className="text-xs text-muted-foreground pt-4">
                        Supported sites: LinkedIn, Indeed, Glassdoor
                    </div>
                </div>
                <CreditBalance total={50} used={12} className="mt-auto" />
            </>
        ),
        isLocked: true,
    },
}

import { LoggedOutView } from "./logged-out-view"

// Wrapper for interactive state
const ExtensionSidebarWithState = (args: any) => {
    const [activeTab, setActiveTab] = React.useState("scan")
    const [studioTab, setStudioTab] = React.useState("match")

    const handleDiveDeeper = () => {
        setActiveTab("ai-studio")
        setTimeout(() => setStudioTab("match"), 0) // Ensure tab switch happens
    }

    const handleCoach = () => {
        setActiveTab("coach")
    }

    return (
        <ExtensionSidebar
            {...args}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            // Ensure content is passed if not already in args, or override to inject handlers
            contextContent={args.contextContent || (
                <ResumeCard
                    resumes={[{ id: "1", fileName: "Senior_Product_Designer.pdf" }]}
                    activeResumeId="1"
                    resumeData={MOCK_RESUME_DATA}
                />
            )}
            scanContent={
                <>
                    <JobCard
                        job={MOCK_JOB}
                        match={MOCK_MATCH}
                        onDiveDeeper={handleDiveDeeper}
                        onCoach={handleCoach}
                    />
                    <CreditBalance total={50} used={12} className="mt-auto" />
                </>
            }
            studioContent={
                <AIStudio
                    isLocked={false}
                    className="h-full"
                    activeTab={studioTab}
                    onTabChange={setStudioTab}
                />
            }
            autofillContent={<Autofill className="h-full" />}
            coachContent={<Coach className="h-full" />}
        />
    )
}

export const DiveDeeperDemo: Story = {
    decorators: [CenteredLayout],
    render: (args) => <ExtensionSidebarWithState {...args} />,
    args: {
        // Inherit base args but ensure interactivity
        header: <AppHeader appName="JobSwyft" />,
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        isLocked: false,
    }
}

// Maxed out data for stress testing
const MOCK_MAXED_RESUME_DATA = {
    ...MOCK_RESUME_DATA,
    experience: Array(8).fill(null).map((_, i) => ({
        title: `Senior Product Designer ${i + 1}`,
        company: `Tech Giant ${i + 1}`,
        startDate: "2018",
        endDate: "2020",
        description: "Led the design system team, reducing drift by 40%. Implemented a new token architecture that scaled to 5 products. Mentored 3 junior designers and facilitated weekly design critiques. Collaborated closely with engineering to ensure pixel-perfect implementation and established a new handoff process using Figma and Storybook.",
        highlights: ["Increased efficiency by 200%", "Launched 3 major features", "Won design award"]
    })),
    education: Array(3).fill(null).map((_, i) => ({
        degree: `Master of Design ${i + 1}`,
        school: "Design Institute",
        startDate: "2014",
        endDate: "2016",
        gpa: "3.9"
    })),
    skills: ["Figma", "Sketch", "Principle", "Protopie", "React", "HTML/CSS", "JavaScript", "TypeScript", "Storybook", "JIRA", "Notion", "Linear", "User Research", "Usability Testing", "Wireframing", "Prototyping", "Interaction Design", "Visual Design"]
}

export const MaxedOutResume: Story = {
    decorators: [CenteredLayout],
    args: {
        ...JobDetected.args,
        contextContent: (
            <ResumeCard
                resumes={[{ id: "1", fileName: "Senior_Product_Designer_Long.pdf" }]}
                activeResumeId="1"
                resumeData={MOCK_MAXED_RESUME_DATA}
            />
        ),
    },
}

export const LoggedOut: Story = {
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <LoggedOutView />
        ),
    },
}
