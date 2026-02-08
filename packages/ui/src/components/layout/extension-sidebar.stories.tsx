import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ExtensionSidebar } from "./extension-sidebar"
import { AppHeader } from "./app-header"
import { ResumeCard } from "@/components/features/resume/resume-card"
import { JobCard } from "@/components/features/job-card"
import { ScanEmptyState } from "@/components/features/scan-empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { LoginView } from "@/components/features/login-view"
import type { JobData } from "@/lib/mappers"

// ─── Mock Data ──────────────────────────────────────────────────────

const MOCK_RESUME_DATA = {
    id: "1",
    fileName: "Senior_Product_Designer.pdf",
    personalInfo: { fullName: "Alex Chen", email: "alex@example.com", phone: "+1 (555) 123-4567", location: "SF", linkedin: "in/alex", website: "alex.design" },
    skills: ["Figma", "React", "TypeScript", "Design Systems"],
    experience: [{ title: "Senior Product Designer", company: "Tech Corp", startDate: "2021", endDate: "Present", description: "Design systems.", highlights: [] }],
    education: [], certifications: [], projects: []
}

const MOCK_JOB: JobData = {
    title: "Senior Frontend Engineer",
    company: "Acme Corp",
    location: "San Francisco, CA (Hybrid)",
    salary: "$150k – $200k",
    employmentType: "Full-time",
    description: "We're looking for a Senior Frontend Engineer to join our product team. You'll build and maintain our React-based UI, mentor junior engineers, and drive architectural decisions.",
    sourceUrl: "https://boards.greenhouse.io/acme/jobs/12345",
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

// Shared header + resume context for authenticated stories (children pattern)
function AuthenticatedShell({ scanContent }: { scanContent: React.ReactNode }) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-2 bg-background z-10 shrink-0">
                <AppHeader appName="JobSwyft" />
            </div>
            <div className="bg-muted/30 dark:bg-muted/50 overflow-y-auto overflow-x-hidden shrink-0 scroll-fade-y scrollbar-hidden">
                <div className="px-2 py-1">
                    <ResumeCard
                        resumes={[{ id: "1", fileName: "Senior_Product_Designer.pdf" }]}
                        activeResumeId="1"
                        resumeData={MOCK_RESUME_DATA}
                        isCollapsible
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 bg-muted/20 dark:bg-muted/40 scroll-fade-y scrollbar-hidden">
                {scanContent}
            </div>
        </div>
    )
}

/** Empty state — no job page detected, shows scan button + paste fallback */
export const ScanEmpty: Story = {
    name: "Scan: Empty State",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <AuthenticatedShell
                scanContent={<ScanEmptyState canManualScan onManualScan={() => {}} onManualEntry={() => {}} />}
            />
        ),
    },
}

/** Loading state — skeleton while scanning the page */
export const ScanLoading: Story = {
    name: "Scan: Loading",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <AuthenticatedShell
                scanContent={
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
                }
            />
        ),
    },
}

/** Scanned job — JobCard with extracted data */
export const ScanSuccess: Story = {
    name: "Scan: Job Detected",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <AuthenticatedShell
                scanContent={<JobCard job={MOCK_JOB} />}
            />
        ),
    },
}

/** Error state — scan failed with retry option */
export const ScanError: Story = {
    name: "Scan: Error",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <AuthenticatedShell
                scanContent={
                    <div className="space-y-4 rounded-lg border-2 border-card-accent-border p-6 flex flex-col items-center">
                        <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 w-full text-center">
                            Failed to scan job page
                        </p>
                        <button type="button" className="text-sm text-primary hover:underline font-medium">
                            Retry Scan
                        </button>
                        <button type="button" className="text-xs text-muted-foreground hover:text-primary hover:underline">
                            Or paste a job description
                        </button>
                    </div>
                }
            />
        ),
    },
}

// ─── Stress Test ────────────────────────────────────────────────────

const MOCK_MAXED_RESUME_DATA = {
    ...MOCK_RESUME_DATA,
    experience: Array(8).fill(null).map((_, i) => ({
        title: `Senior Product Designer ${i + 1}`,
        company: `Tech Giant ${i + 1}`,
        startDate: "2018",
        endDate: "2020",
        description: "Led the design system team, reducing drift by 40%. Implemented a new token architecture that scaled to 5 products. Mentored 3 junior designers and facilitated weekly design critiques.",
        highlights: ["Increased efficiency by 200%", "Launched 3 major features"]
    })),
    education: Array(3).fill(null).map((_, i) => ({
        degree: `Master of Design ${i + 1}`,
        school: "Design Institute",
        startDate: "2014",
        endDate: "2016",
        gpa: "3.9"
    })),
    skills: ["Figma", "Sketch", "Principle", "React", "HTML/CSS", "JavaScript", "TypeScript", "Storybook", "JIRA", "Notion", "Linear", "User Research", "Usability Testing", "Wireframing", "Prototyping", "Interaction Design", "Visual Design", "Design Systems"]
}

/** Maxed out resume + job card for stress testing scrolling */
export const MaxedOut: Story = {
    name: "Stress: Maxed Content",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <div className="flex flex-col h-full">
                <div className="p-2 bg-background z-10 shrink-0">
                    <AppHeader appName="JobSwyft" />
                </div>
                <div className="bg-muted/30 dark:bg-muted/50 overflow-y-auto overflow-x-hidden shrink-0 scroll-fade-y scrollbar-hidden">
                    <div className="px-2 py-1">
                        <ResumeCard
                            resumes={[{ id: "1", fileName: "Senior_Product_Designer_Long.pdf" }]}
                            activeResumeId="1"
                            resumeData={MOCK_MAXED_RESUME_DATA}
                            isCollapsible
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 bg-muted/20 dark:bg-muted/40 scroll-fade-y scrollbar-hidden">
                    <JobCard job={MOCK_JOB} />
                </div>
            </div>
        ),
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
