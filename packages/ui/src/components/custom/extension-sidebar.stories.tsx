import React from "react"
import { Wand2 } from "lucide-react"
import type { Meta, StoryObj } from "@storybook/react"
import { ExtensionSidebar } from "./extension-sidebar"
import { AIStudio } from "./ai-studio"
import { Coach } from "./coach"
import { Autofill } from "./autofill"
import { AppHeader } from "./app-header"
import { ResumeCard } from "./resume-card"
import { CreditBalance } from "./credit-balance"
import { JobCard } from "./job-card"
import { Badge } from "@/components/ui/badge"

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
                isCollapsible={true}
            />
        ),
        scanContent: (
            <>
                <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-6 p-6">
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-violet-400/20 duration-3000" />
                        <div className="relative flex items-center justify-center size-20 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800 shadow-lg">
                            <Wand2 className="size-8 text-violet-600 dark:text-violet-400" />
                        </div>
                    </div>

                    <div className="space-y-2 max-w-[240px]">
                        <h3 className="font-bold text-lg text-foreground">
                            Waiting for Job Post
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Navigate to a job posting on LinkedIn or Indeed to activate JobSwyft.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/50 font-normal">LinkedIn</Badge>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/50 font-normal">Indeed</Badge>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/50 font-normal">Glassdoor</Badge>
                    </div>
                </div>
            </>
        ),
        // Use args.creditBar if desired or let the component handle default rendering 
        // But for NoJobDetected (locked), we usually want to show a limited view.
        // The user request was "No Job detected does not have proper CreditBar".
        creditBar: {
            credits: 38,
            maxCredits: 50,
            onBuyMore: () => alert("Buy more credits")
        },
        isLocked: true,
    },
}

import { LoggedOutView } from "./logged-out-view"

// Wrapper for interactive state
const ExtensionSidebarWithState = (args: any) => {
    // Initialize with defaultTab or use "scan" if not provided
    const [activeTab, setActiveTab] = React.useState(args.activeTab || args.defaultTab || "scan")
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
            creditBar={args.creditBar || { credits: 38, maxCredits: 50, onBuyMore: () => alert("Buy more credits") }}
            // Ensure content is passed if not already in args, or override to inject handlers
            contextContent={args.contextContent || (
                <ResumeCard
                    resumes={[{ id: "1", fileName: "Senior_Product_Designer.pdf" }]}
                    activeResumeId="1"
                    resumeData={MOCK_RESUME_DATA}
                    isCompact={true}
                    isCollapsible={true}
                />
            )}
            scanContent={args.scanContent || (
                <JobCard
                    job={MOCK_JOB}
                    match={MOCK_MATCH}
                    onDiveDeeper={handleDiveDeeper}
                    onCoach={handleCoach}
                />
            )}
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


export const LowCredits: Story = {
    decorators: [CenteredLayout],
    render: (args) => <ExtensionSidebarWithState {...args} />,
    args: {
        ...JobDetected.args,
        creditBar: {
            credits: 2,
            maxCredits: 50,
            onBuyMore: () => alert("Buy more credits")
        }
    }
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

export const LongJobDescription: Story = {
    decorators: [CenteredLayout],
    render: (args) => <ExtensionSidebarWithState {...args} />,
    args: {
        ...DiveDeeperDemo.args,
        scanContent: (
            <JobCard
                job={{
                    ...MOCK_JOB,
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
                }}
                match={MOCK_MATCH}
                onDiveDeeper={() => { }}
                onCoach={() => { }}
            />
        )
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
                isCompact={true}
                isCollapsible={true}
            />
        ),
    },
}

const MOCK_MAXED_JOB = {
    ...MOCK_JOB,
    title: "Global Principal Product Architect - AI & Core Systems",
    company: "Stripe Global Ventures",
    location: "SF / Remote / NYC",
    salary: "$250,000 - $450,000 + Equity",
    postedAt: "12m ago",
    description: `Stripe is a technology company that builds economic infrastructure for the internet.

As a Global Principal Product Architect, you will lead the evolution of our most critical economic systems.

### The Role
You will be responsible for the end-to-end architectural vision of our AI-driven financial services unit. This is a high-impact, high-visibility role reporting directly to the VP of Engineering.

### Responsibilities
- Define and execute a multi-year technical roadmap for global financial settlement engines.
- Collaborate with executive leadership to align technical strategy with business objectives.
- Mentor a global organization of 500+ engineers through architectural reviews and design standards.
- Drive the adoption of next-generation technologies including distributed ledgers and real-time reconciliation.
- Lead response strategies for complex, large-scale system incidents.
- Represent Stripe at international technology summits and standardization bodies.

### Requirements
- 15+ years of experience in high-scale systems architecture.
- Proven track record of delivering mission-critical financial systems at global scale.
- Deep expertise in distributed systems, consistency models, and multi-region failover.
- Strong background in AI/ML integration within highly regulated environments.
- Exceptional communication skills with the ability to influence at all levels of the organization.
- Advanced degree (MS or PhD) in Computer Science or related field.

### Benefits
- Competitive compensation package including performance bonuses and generous equity.
- Comprehensive world-class health, dental, and vision benefits for you and your family.
- Unlimited PTO policy with a mandatory minimum of 3 weeks off.
- $10,000 annual learning and development stipend.
- Fully home-office stipend for remote work.
- Paid parental leave as well as support for adoption and fertility.

Join us in building the economic engine of the internet.`
}

export const MaxedOutEverything: Story = {
    decorators: [CenteredLayout],
    render: (args) => <ExtensionSidebarWithState {...args} />,
    args: {
        ...DiveDeeperDemo.args,
        contextContent: (
            <ResumeCard
                resumes={[{ id: "1", fileName: "Executive_Technical_Leader_Long.pdf" }]}
                activeResumeId="1"
                resumeData={MOCK_MAXED_RESUME_DATA}
                isCompact={true}
                isCollapsible={true}
                maxHeight="500px"
            />
        ),
        scanContent: (
            <JobCard
                job={MOCK_MAXED_JOB}
                match={{
                    ...MOCK_MATCH,
                    score: 98,
                    summary: "Exceptional candidate with direct experience in Stripe-scale architecture and AI leadership."
                }}
                onDiveDeeper={() => { }}
                onCoach={() => { }}
            />
        )
    }
}

export const LoggedOut: Story = {
    // ... existing code ...
    decorators: [CenteredLayout],
    args: {
        className: "border shadow-2xl rounded-xl",
        style: { position: 'absolute', inset: 0, height: '100%', width: '100%' } as React.CSSProperties,
        children: (
            <LoggedOutView />
        ),
    },
}
