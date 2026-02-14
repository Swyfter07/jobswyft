import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ExtensionSidebar } from "./extension-sidebar"
import { AppHeader } from "./app-header"
import { ResumeCard } from "@/components/features/resume/resume-card"
import { JobCard } from "@/components/features/job-card"
import { ScanEmptyState } from "@/components/features/scan-empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
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
        viewport: { defaultViewport: "extensionDefault" },
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ExtensionSidebar>

export default meta
type Story = StoryObj<typeof meta>

const CenteredLayout = (Story: React.ComponentType) => (
    <div className="flex items-center justify-center min-h-screen bg-muted p-8">
        <div className="relative w-[360px]" style={{ height: '600px' }}>
            <Story />
        </div>
    </div>
)

const DarkCenteredLayout = (Story: React.ComponentType) => (
    <div className="dark flex items-center justify-center min-h-screen bg-background p-8">
        <div className="relative w-[360px]" style={{ height: '600px' }}>
            <Story />
        </div>
    </div>
)

// Shared header + resume context for authenticated stories
const defaultHeader = <AppHeader appName="JobSwyft" autoScanEnabled onAutoScanToggle={() => {}} autoAnalysisEnabled onAutoAnalysisToggle={() => {}} resetButton />
const defaultResumeContext = (
    <ResumeCard
        resumes={[{ id: "1", fileName: "Senior_Product_Designer.pdf" }]}
        activeResumeId="1"
        resumeData={MOCK_RESUME_DATA}
        isCollapsible
    />
)

// ─── Tab-Based Stories (4-Tab Navigation) ────────────────────────────

/** Default view — Scan tab active, empty state */
export const ScanTabEmpty: Story = {
    name: "Scan Tab: Empty State",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: defaultResumeContext,
        scanContent: <ScanEmptyState canManualScan onManualScan={() => {}} onManualEntry={() => {}} />,
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        defaultTab: "scan",
    },
}

/** Scan tab — Loading skeleton */
export const ScanTabLoading: Story = {
    name: "Scan Tab: Loading",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: defaultResumeContext,
        scanContent: (
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
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        defaultTab: "scan",
    },
}

/** Scan tab — Job detected */
export const ScanTabSuccess: Story = {
    name: "Scan Tab: Job Detected",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: defaultResumeContext,
        scanContent: <JobCard job={MOCK_JOB} />,
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        defaultTab: "scan",
    },
}

/** Scan tab — Error state */
export const ScanTabError: Story = {
    name: "Scan Tab: Error",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: defaultResumeContext,
        scanContent: (
            <div className="space-y-4 rounded-lg border-2 border-card-accent-border p-6 flex flex-col items-center">
                <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2 w-full text-center">
                    Failed to scan job page
                </p>
                <Button variant="ghost" size="sm" className="text-sm text-primary font-medium">
                    Retry Scan
                </Button>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    Or paste a job description
                </Button>
            </div>
        ),
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        defaultTab: "scan",
    },
}

/** AI Studio tab active */
export const AIStudioTab: Story = {
    name: "AI Studio Tab: Active",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: defaultResumeContext,
        scanContent: <JobCard job={MOCK_JOB} />,
        studioContent: (
            <div className="space-y-3">
                <div className="rounded-lg border p-4 bg-card">
                    <h3 className="text-sm font-semibold mb-2">Match Analysis</h3>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="text-2xl font-bold text-primary">85%</div>
                        <span className="text-xs text-muted-foreground">match score</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Strong match based on React, TypeScript, and Design Systems experience.</p>
                </div>
                <div className="rounded-lg border p-4 bg-card">
                    <h3 className="text-sm font-semibold mb-2">Cover Letter</h3>
                    <p className="text-xs text-muted-foreground">Generate a tailored cover letter for this position.</p>
                </div>
                <div className="rounded-lg border p-4 bg-card">
                    <h3 className="text-sm font-semibold mb-2">Outreach</h3>
                    <p className="text-xs text-muted-foreground">Draft a networking message for a hiring manager.</p>
                </div>
            </div>
        ),
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        defaultTab: "ai-studio",
    },
}

/** Autofill tab active */
export const AutofillTab: Story = {
    name: "Autofill Tab: Active",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: defaultResumeContext,
        scanContent: <JobCard job={MOCK_JOB} />,
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: (
            <div className="space-y-3">
                <div className="rounded-lg border p-4 bg-card">
                    <h3 className="text-sm font-semibold mb-2">Detected Fields</h3>
                    <p className="text-xs text-muted-foreground">No application form detected. Navigate to a job application page to start autofilling.</p>
                </div>
            </div>
        ),
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        defaultTab: "autofill",
    },
}

/** Coach tab active */
export const CoachTab: Story = {
    name: "Coach Tab: Active",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: defaultResumeContext,
        scanContent: <JobCard job={MOCK_JOB} />,
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: (
            <div className="flex flex-col h-full">
                <div className="flex-1 space-y-3 p-3">
                    <div className="text-center text-xs text-muted-foreground py-8">
                        Ask your career coach anything about this job, interview prep, or your application strategy.
                    </div>
                </div>
                <div className="border-t border-border p-3">
                    <div className="flex gap-2">
                        <div className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">Ask your career coach...</div>
                        <Button size="sm" disabled>Send</Button>
                    </div>
                </div>
            </div>
        ),
        defaultTab: "coach",
    },
}

/** Locked tabs — AI Studio, Autofill, and Coach disabled (no job scanned) */
export const LockedTabs: Story = {
    name: "Locked Tabs (No Job Data)",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: defaultResumeContext,
        scanContent: <ScanEmptyState canManualScan onManualScan={() => {}} onManualEntry={() => {}} />,
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        isLocked: true,
        defaultTab: "scan",
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
    name: "Stress: Maxed Content (Overflow)",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: (
            <ResumeCard
                resumes={[{ id: "1", fileName: "Senior_Product_Designer_Long.pdf" }]}
                activeResumeId="1"
                resumeData={MOCK_MAXED_RESUME_DATA}
                isCollapsible
            />
        ),
        scanContent: <JobCard job={MOCK_JOB} />,
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        defaultTab: "scan",
    },
}

// ─── Special States ─────────────────────────────────────────────────

/** Login view before authentication */
export const Login: Story = {
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: (
            <div className="flex items-center gap-2 px-1">
                <span className="text-lg font-bold text-foreground tracking-tight">
                    Jobswyft
                </span>
            </div>
        ),
        children: (
            <LoginView />
        ),
    },
}

/** With footer slot (CreditBar placeholder) */
export const WithFooter: Story = {
    name: "With Footer Slot",
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: defaultHeader,
        contextContent: defaultResumeContext,
        scanContent: <JobCard job={MOCK_JOB} />,
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        footer: (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
                <span>3 / 10 credits remaining</span>
                <Button variant="ghost" size="sm" className="text-primary font-medium">Upgrade</Button>
            </div>
        ),
        defaultTab: "scan",
    },
}

// ─── Dark Mode ──────────────────────────────────────────────────────

/** Dark mode — Scan tab with job detected */
export const DarkMode: Story = {
    name: "Dark Mode: Scan Tab",
    decorators: [DarkCenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: <AppHeader appName="JobSwyft" isDarkMode autoScanEnabled onAutoScanToggle={() => {}} autoAnalysisEnabled onAutoAnalysisToggle={() => {}} resetButton />,
        contextContent: defaultResumeContext,
        scanContent: <JobCard job={MOCK_JOB} />,
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        defaultTab: "scan",
    },
}

/** Dark mode — Locked tabs state */
export const DarkModeLocked: Story = {
    name: "Dark Mode: Locked Tabs",
    decorators: [DarkCenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        header: <AppHeader appName="JobSwyft" isDarkMode autoScanEnabled onAutoScanToggle={() => {}} autoAnalysisEnabled onAutoAnalysisToggle={() => {}} resetButton />,
        contextContent: defaultResumeContext,
        scanContent: <ScanEmptyState canManualScan onManualScan={() => {}} onManualEntry={() => {}} />,
        studioContent: <div className="text-sm text-muted-foreground p-4">AI Studio content placeholder</div>,
        autofillContent: <div className="text-sm text-muted-foreground p-4">Autofill content placeholder</div>,
        coachContent: <div className="text-sm text-muted-foreground p-4">Coach content placeholder</div>,
        isLocked: true,
        defaultTab: "scan",
    },
}
