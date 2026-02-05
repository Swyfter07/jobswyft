import type { Meta, StoryObj } from "@storybook/react"
import { ExtensionSidebar } from "./extension-sidebar"
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
    args: {
        header: <AppHeader appName="JobSwyft" />,
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <>
                <ResumeCard
                    resumes={[{ id: "1", fileName: "Senior_Product_Designer.pdf" }]}
                    activeResumeId="1"
                    resumeData={MOCK_RESUME_DATA}
                />
                <JobCard job={MOCK_JOB} match={MOCK_MATCH} />
                <CreditBalance total={50} used={12} className="mt-auto" />
            </>
        ),
    },
}

export const NoJobDetected: Story = {
    decorators: [CenteredLayout],
    args: {
        header: <AppHeader appName="JobSwyft" />,
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <>
                <ResumeCard
                    resumes={[{ id: "1", fileName: "Senior_Product_Designer.pdf" }]}
                    activeResumeId="1"
                    resumeData={MOCK_RESUME_DATA}
                />
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
    },
}

export const LoggedOut: Story = {
    decorators: [CenteredLayout],
    args: {
        header: <div className="p-4 font-bold text-xl text-center">JobSwyft</div>,
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <div className="flex flex-col items-center justify-center h-full space-y-6 p-6 text-center">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Welcome to JobSwyft</h2>
                    <p className="text-muted-foreground">
                        Sign in to start applying faster with AI-powered tools.
                    </p>
                </div>

                <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
                    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="mr-2 size-4">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.24 2.08-2.08 2.76-4.96 2.76-7.307 0-.72-.053-1.427-.16-2.12H12.48z" />
                    </svg>
                    Sign in with Google
                </button>

                <p className="text-xs text-muted-foreground">
                    By pulling the trigger, you agree to our <span className="underline cursor-pointer">Terms</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
                </p>
            </div>
        ),
    },
}
