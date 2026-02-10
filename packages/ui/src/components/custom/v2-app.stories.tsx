import React from "react"
import { Wand2, Layout } from "lucide-react"
import type { Meta, StoryObj } from "@storybook/react"
import {
    ExtensionSidebar,
    AIStudio,
    Coach,
    Autofill,
    AppHeader,
    ResumeCard,
    JobCard,
    Badge,
    Button,
    ResumeEmptyState,
    SettingsDialog,
    Toast,
    ToastContainer
} from "@jobswyft/ui"
import { LoggedOutView } from "./logged-out-view"

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
    description: "We are looking for a Senior Product Designer to join our team...\n\nResponsibilities:\n• Lead design projects from concept to launch\n• Collaborate with engineers and product managers\n• Create high-fidelity mockups and prototypes",
}

const MOCK_MATCH = {
    score: 92,
    matchedSkills: ["Figma", "Design Systems", "Prototyping"],
    missingSkills: ["Principle", "Origami"],
    explanation: "Strong match for your experience in design systems.",
    tips: "Highlight your experience with Stripe-specific design tokens.",
    missingSkillsList: ["Principle", "Origami"]
}

const meta = {
    title: "V2 App/Full Implementation",
    component: ExtensionSidebar,
    parameters: {
        layout: "fullscreen",
    },
} satisfies Meta<typeof ExtensionSidebar>

export default meta
type Story = StoryObj<typeof meta>

const CenteredLayout = (Story: any) => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-950 p-8">
        <div className="relative w-[400px] border shadow-2xl rounded-xl overflow-hidden bg-background" style={{ height: '85vh' }}>
            <Story />
        </div>
    </div>
)

const V2AppWrapper = ({
    initialTab = "scan",
    isLocked = true,
    initialJob = null as any,
    isLoggedOut = false,
    isScanning = false,
    isEditing = false,
    noResumes = false,
    multipleResumes = false,
    showSettings = false,
    showToast = false,
    toastVariant = "success" as "success" | "error" | "loading" | "info",
    toastMessage = "",
}) => {
    const [activeTab, setActiveTab] = React.useState(initialTab)
    const [isDarkMode, setIsDarkMode] = React.useState(false)
    const [studioTab, setStudioTab] = React.useState("match")
    const [jobData, setJobData] = React.useState(initialJob || { title: "", company: "", description: "" })
    const [scanning, setScanning] = React.useState(isScanning)
    const [editing, setEditing] = React.useState(isEditing)

    // Settings state
    const [settingsOpen, setSettingsOpen] = React.useState(showSettings)
    const [apiKey, setApiKey] = React.useState("")
    const [model, setModel] = React.useState("gpt-4o-mini")

    // Toast state
    const [toastVisible, setToastVisible] = React.useState(showToast)

    if (isLoggedOut) {
        return (
            <div className={isDarkMode ? "dark" : ""}>
                <div className="h-full bg-background text-foreground">
                    <LoggedOutView />
                </div>
            </div>
        )
    }

    const handleScan = () => {
        setScanning(true)
        setTimeout(() => {
            setScanning(false)
            setJobData(MOCK_JOB)
        }, 1500)
    }

    const handleManual = () => {
        setJobData({ title: "", company: "", description: "" })
        setEditing(true)
    }

    const resumes = noResumes ? [] : (multipleResumes ? [
        { id: "1", fileName: "Senior_Product_Designer.pdf" },
        { id: "2", fileName: "Product_Manager_Lead.pdf" },
        { id: "3", fileName: "Freelance_Design_2023.pdf" }
    ] : [{ id: "1", fileName: "Senior_Product_Designer.pdf" }]);

    return (
        <div className={isDarkMode ? "dark" : ""}>
            <div className="h-full bg-background text-foreground flex flex-col">
                <ExtensionSidebar
                    header={
                        <AppHeader
                            appName="JobSwyft"
                            isDarkMode={isDarkMode}
                            onThemeToggle={() => setIsDarkMode(!isDarkMode)}
                            onSettingsClick={() => setSettingsOpen(true)}
                        />
                    }
                    contextContent={
                        noResumes ? (
                            <ResumeEmptyState onUpload={() => alert("Upload")} />
                        ) : (
                            <ResumeCard
                                resumes={resumes}
                                activeResumeId="1"
                                resumeData={MOCK_RESUME_DATA}
                                isCompact={true}
                                isCollapsible={true}
                                variant="subtle"
                            />
                        )
                    }
                    scanContent={
                        <div className="flex flex-col gap-3 p-1">
                            <div className="flex items-center justify-between gap-2">
                                <label className="flex items-center gap-2 text-xs text-muted-foreground mr-auto">
                                    <input type="checkbox" checked={true} readOnly className="rounded border-muted-foreground/30" />
                                    Auto-scan
                                </label>
                                <div className="flex gap-1.5">
                                    <Button variant="outline" size="xs" className="h-7 text-[10px]" onClick={handleManual}>Add Manually</Button>
                                    <Button variant="outline" size="xs" className="h-7 text-[10px]" onClick={() => setJobData({ title: "", company: "", description: "" })}>Clear</Button>
                                    <Button size="xs" className="h-7 text-[10px]" onClick={handleScan} disabled={scanning}>{scanning ? "Scanning..." : "Scan Page"}</Button>
                                </div>
                            </div>
                            {jobData.description || editing ? (
                                <JobCard
                                    job={jobData}
                                    match={!isLocked ? MOCK_MATCH as any : undefined}
                                    isEditing={editing}
                                    onAnalyze={(data) => {
                                        if (data) setJobData(prev => ({ ...prev, ...data }));
                                        setEditing(false);
                                    }}
                                    onDiveDeeper={() => setActiveTab("ai-studio")}
                                    onCoach={() => setActiveTab("coach")}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-6 p-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 animate-ping rounded-full bg-violet-400/20 duration-3000" />
                                        <div className="relative flex items-center justify-center size-20 rounded-full bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800 shadow-lg">
                                            <Wand2 className="size-8 text-violet-600 dark:text-violet-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-w-[240px]">
                                        <h3 className="font-bold text-lg text-foreground">Waiting for Job Post</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed text-center px-4">
                                            Navigate to a job posting on LinkedIn or Indeed to activate JobSwyft.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/50 font-normal">LinkedIn</Badge>
                                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/50 font-normal">Indeed</Badge>
                                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/50 font-normal">Glassdoor</Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                    studioContent={
                        <AIStudio
                            isLocked={isLocked}
                            activeTab={studioTab}
                            onTabChange={setStudioTab}
                            matchAnalysis={!isLocked ? MOCK_MATCH as any : undefined}
                            className="h-full"
                        />
                    }
                    autofillContent={<Autofill className="h-full" />}
                    coachContent={<Coach className="h-full" isLocked={isLocked} />}
                    isLocked={isLocked}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    creditBar={{ credits: 38, maxCredits: 50 }}
                    style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
                />

                {/* Settings Dialog */}
                <SettingsDialog
                    open={settingsOpen}
                    onOpenChange={setSettingsOpen}
                    apiKey={apiKey}
                    onApiKeyChange={setApiKey}
                    model={model}
                    onModelChange={setModel}
                />

                {/* Toast Notifications */}
                {toastVisible && (
                    <ToastContainer position="bottom-center">
                        <Toast
                            variant={toastVariant}
                            title={toastMessage || "Notification"}
                            onDismiss={() => setToastVisible(false)}
                        />
                    </ToastContainer>
                )}
            </div>
        </div>
    )
}

export const WaitingState: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="scan" initialJob={null} isLocked={true} />,
}

export const NoResumesUploaded: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="scan" initialJob={null} isLocked={true} noResumes={true} />,
}

export const MultipleResumesList: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="scan" initialJob={null} isLocked={true} multipleResumes={true} />,
}

export const ScanningInProgress: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="scan" initialJob={null} isLocked={true} isScanning={true} />,
}

export const ManualEntryMode: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="scan" initialJob={{ title: "", company: "", description: "" }} isLocked={true} isEditing={true} />,
}

export const JobDetectedUnlocked: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="scan" initialJob={MOCK_JOB} isLocked={false} />,
}

export const AIStudioMatchTab: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="ai-studio" initialJob={MOCK_JOB} isLocked={false} />,
}

export const CoachState: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="coach" initialJob={MOCK_JOB} isLocked={false} />,
}

export const LoggedOut: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper isLoggedOut={true} />,
}

export const WithSettingsOpen: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="scan" initialJob={null} isLocked={true} showSettings={true} />,
}

export const WithSuccessToast: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="scan" initialJob={MOCK_JOB} isLocked={false} showToast={true} toastVariant="success" toastMessage="Cover letter generated!" />,
}

export const WithErrorToast: Story = {
    decorators: [CenteredLayout],
    render: () => <V2AppWrapper initialTab="scan" initialJob={null} isLocked={true} showToast={true} toastVariant="error" toastMessage="API key required" />,
}
