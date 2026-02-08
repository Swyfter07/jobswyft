import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ExtensionSidebar } from "./extension-sidebar"
import { AppHeader } from "./app-header"
import { ResumeCard } from "@/components/features/resume/resume-card"
import { LoginView } from "@/components/features/login-view"

// Mock Data
const MOCK_RESUME_DATA = {
    id: "1",
    fileName: "Senior_Product_Designer.pdf",
    personalInfo: { fullName: "Alex Chen", email: "alex@example.com", phone: "+1 (555) 123-4567", location: "SF", linkedin: "in/alex", website: "alex.design" },
    skills: ["Figma", "React", "TypeScript", "Design Systems"],
    experience: [{ title: "Senior Product Designer", company: "Tech Corp", startDate: "2021", endDate: "Present", description: "Design systems.", highlights: [] }],
    education: [], certifications: [], projects: []
}

const meta = {
    title: "Layout/ExtensionSidebar",
    component: ExtensionSidebar,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ExtensionSidebar>

export default meta
type Story = StoryObj<typeof meta>

const CenteredLayout = (Story: React.ComponentType) => (
    <div className="flex items-center justify-center min-h-screen bg-muted p-8">
        <div className="relative w-[400px]" style={{ height: '85vh' }}>
            <Story />
        </div>
    </div>
)

/** Authenticated with resume context - shell only (tabs will be populated in EXT.5+) */
export const Authenticated: Story = {
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
                isCollapsible
            />
        ),
        isLocked: false,
    },
}

/** No job detected - tabs locked with resume context visible */
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
                isCollapsible
            />
        ),
        isLocked: true,
    },
}

// Note: Tab content (scan/studio/autofill/coach) will be added in future stories (EXT.5+)
// Current stories focus on shell layout + authentication states


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

/** Maxed out resume data for stress testing scrolling and layout */
export const MaxedOutResume: Story = {
    decorators: [CenteredLayout],
    args: {
        header: <AppHeader appName="JobSwyft" />,
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        contextContent: (
            <ResumeCard
                resumes={[{ id: "1", fileName: "Senior_Product_Designer_Long.pdf" }]}
                activeResumeId="1"
                resumeData={MOCK_MAXED_RESUME_DATA}
                isCollapsible
            />
        ),
        isLocked: false,
    },
}

/** Login view before authentication */
export const Login: Story = {
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <LoginView />
        ),
    },
}
