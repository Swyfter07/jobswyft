
import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import {
    Pencil,
    Check,
    Copy,
    X,
    Save,
    FileText,
    Briefcase,
    GraduationCap,
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Globe,
    Hammer,
    ChevronRight
} from "lucide-react"

import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Card, CardContent } from "../ui/card"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "../ui/sheet"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
// Import ExtensionSidebar for integration story
import { ExtensionSidebar } from "./extension-sidebar"

// ... (Rest of the previous code: MOCK_RESUME, Field, ResumeOverviewCard, ResumeEditorDrawer) ...

// --- RE-DECLARING COMPONENTS FOR THIS FILE TO BE SELF-CONTAINED IF IMPORTS FAIL ---
// In a real app, these would be imported. For this prototype, we keep them here for stability.

const MOCK_RESUME = {
    fileName: "Sureel_Resume_J_12.pdf",
    lastUpdated: "Just now",
    personalInfo: {
        fullName: "Alex Chen",
        email: "alex@example.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        linkedin: "linkedin.com/in/alexc",
        website: "alexchen.design"
    },
    skills: ["Figma", "React", "TypeScript", "Design Systems", "Prototyping", "User Research", "Principle", "Origami Studio"],
    experience: [
        {
            id: "exp-1",
            title: "Senior Product Designer",
            company: "Tech Corp",
            startDate: "Jan 2021",
            endDate: "Present",
            highlights: [
                "Reduced design drift by 40% through strict token usage.",
                "Mentored 3 junior designers."
            ]
        },
        {
            id: "exp-2",
            title: "Product Designer",
            company: "Startup Inc",
            startDate: "Jun 2018",
            endDate: "Dec 2020",
            highlights: [
                "Shipped the first MVP of the mobile app.",
                "Conducted 50+ user interviews."
            ]
        }
    ],
    education: [
        {
            id: "edu-1",
            school: "Rhode Island School of Design",
            degree: "BFA in Interaction Design",
            year: "2018"
        }
    ]
}

const Field = ({ label, value, isEdit, onCopy, copied }: any) => (
    <div className="space-y-1.5 group cursor-pointer" onClick={!isEdit ? onCopy : undefined}>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
        {isEdit ? (
            <Input defaultValue={value} />
        ) : (
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                <span className="text-sm font-medium truncate">{value}</span>
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500 animate-in zoom-in" />
                ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        )}
    </div>
)

const ResumeOverviewCard = ({
    resume,
    onOpen
}: {
    resume: typeof MOCK_RESUME,
    onOpen: () => void
}) => {
    return (
        <Card className="shadow-sm border-l-4 border-l-green-500 bg-card hover:bg-accent/5 transition-colors cursor-pointer group" onClick={onOpen}>
            <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
                    <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{resume.fileName}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-green-50 text-green-700 border-green-200">
                            Verified
                        </Badge>
                        <span>• {resume.lastUpdated}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onOpen(); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
            </CardContent>
        </Card>
    )
}

const ResumeEditorDrawer = ({
    isOpen,
    onClose,
    initialResume
}: {
    isOpen: boolean,
    onClose: () => void,
    initialResume: typeof MOCK_RESUME
}) => {
    const [isEditMode, setIsEditMode] = useState(false)
    const [resumeData, setResumeData] = useState(initialResume)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleSave = () => {
        setIsEditMode(false)
        alert("Changes saved to context!")
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
            <SheetContent
                side="right"
                className="w-full sm:w-[500px] sm:max-w-none p-0 flex flex-col gap-0 shadow-2xl border-l"
                onInteractOutside={(e) => e.preventDefault()} // Keep drawer open when interacting with sidebar if needed, or remove for standard modal behavior
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur z-10 sticky top-0">
                    <div>
                        <SheetTitle className="text-base flex items-center gap-2">
                            {isEditMode ? "Edit Resume Context" : "Resume Details"}
                            {!isEditMode && <Badge variant="secondary" className="text-xs font-normal bg-muted text-muted-foreground">Read-Only</Badge>}
                        </SheetTitle>
                        <SheetDescription className="text-xs">
                            {isEditMode ? "Correct any parsing errors manually." : "Click any field to copy it."}
                        </SheetDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditMode ? (
                            <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)} className="h-8">
                                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                Edit
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setIsEditMode(false)} className="h-8">
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleSave} className="h-8">
                                    <Save className="h-3.5 w-3.5 mr-1.5" />
                                    Save
                                </Button>
                            </div>
                        )}
                        <Button size="icon-sm" variant="ghost" onClick={onClose} className="h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <ScrollArea className="flex-1 bg-muted/10">
                    <div className="p-6 space-y-8">

                        {/* Personal Info */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                                <span className="bg-primary/10 text-primary p-1 rounded"><FileText className="h-3 w-3" /></span>
                                Personal Info
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                <Field
                                    label="Full Name"
                                    value={resumeData.personalInfo.fullName}
                                    isEdit={isEditMode}
                                    onCopy={() => handleCopy(resumeData.personalInfo.fullName, "name")}
                                    copied={copiedId === "name"}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field
                                        label="Email"
                                        value={resumeData.personalInfo.email}
                                        isEdit={isEditMode}
                                        onCopy={() => handleCopy(resumeData.personalInfo.email, "email")}
                                        copied={copiedId === "email"}
                                    />
                                    <Field
                                        label="Phone"
                                        value={resumeData.personalInfo.phone}
                                        isEdit={isEditMode}
                                        onCopy={() => handleCopy(resumeData.personalInfo.phone, "phone")}
                                        copied={copiedId === "phone"}
                                    />
                                </div>
                                <Field
                                    label="Location"
                                    value={resumeData.personalInfo.location}
                                    isEdit={isEditMode}
                                    onCopy={() => handleCopy(resumeData.personalInfo.location, "loc")}
                                    copied={copiedId === "loc"}
                                />
                                <Field
                                    label="LinkedIn"
                                    value={resumeData.personalInfo.linkedin}
                                    isEdit={isEditMode}
                                    onCopy={() => handleCopy(resumeData.personalInfo.linkedin, "li")}
                                    copied={copiedId === "li"}
                                />
                            </div>
                        </section>

                        <Separator />

                        {/* Skills */}
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                                <span className="bg-primary/10 text-primary p-1 rounded"><Hammer className="h-3 w-3" /></span>
                                Skills
                            </h3>
                            {isEditMode ? (
                                <Textarea
                                    defaultValue={resumeData.skills.join(", ")}
                                    className="min-h-[100px] font-mono text-sm"
                                    placeholder="Enter skills separated by commas..."
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {resumeData.skills.map((skill, i) => (
                                        <Badge
                                            key={i}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-all active:scale-95 select-none py-1.5 px-3"
                                            onClick={() => handleCopy(skill, `skill-${i}`)}
                                        >
                                            {skill}
                                            {copiedId === `skill-${i}` && <Check className="ml-1.5 h-3 w-3 text-green-600" />}
                                        </Badge>
                                    ))}
                                    <Button variant="outline" size="sm" className="h-7 text-xs ml-auto rounded-full border-dashed" onClick={() => handleCopy(resumeData.skills.join(", "), 'all-skills')}>
                                        <Copy className="h-3 w-3 mr-1" /> Copy All
                                    </Button>
                                </div>
                            )}
                        </section>

                        <Separator />

                        {/* Experience */}
                        <section className="space-y-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                                <span className="bg-primary/10 text-primary p-1 rounded"><Briefcase className="h-3 w-3" /></span>
                                Experience
                            </h3>
                            <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted/50">
                                {resumeData.experience.map((exp, i) => (
                                    <div key={exp.id} className="relative pl-6">
                                        <div className="absolute left-[2px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground/30 ring-4 ring-background"></div>
                                        {/* Role Header */}
                                        <div className="mb-3">
                                            {isEditMode ? (
                                                <div className="space-y-3 p-4 border rounded-lg bg-card">
                                                    <Input defaultValue={exp.title} className="font-bold" placeholder="Job Title" />
                                                    <Input defaultValue={exp.company} placeholder="Company" />
                                                    <div className="flex gap-2">
                                                        <Input defaultValue={exp.startDate} placeholder="Start" />
                                                        <Input defaultValue={exp.endDate} placeholder="End" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                                                        {exp.company}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                                        <span className="font-semibold text-foreground/80">{exp.title}</span>
                                                        <span>•</span>
                                                        <span>{exp.startDate} - {exp.endDate}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Highlights */}
                                        <div className="space-y-2">
                                            {exp.highlights.map((point, j) => (
                                                <div
                                                    key={j}
                                                    className="group rounded-md p-2 -ml-2 hover:bg-muted/50 transition-colors cursor-pointer text-sm leading-relaxed text-muted-foreground hover:text-foreground"
                                                    onClick={() => !isEditMode && handleCopy(point, `exp-${i}-pt-${j}`)}
                                                >
                                                    <div className="flex gap-2 items-start">
                                                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                                        <p className="flex-1">{point}</p>
                                                        {copiedId === `exp-${i}-pt-${j}` && <Check className="h-3 w-3 text-green-500 shrink-0 mt-1" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

// Full Integration Component
const FullIntegration = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    return (
        <div className="h-[600px] w-[900px] border rounded-xl overflow-hidden shadow-2xl flex bg-background relative">
            <div className="w-[300px] border-r shrink-0 z-0">
                {/* This simulates the ExtensionSidebar content structure */}
                <div className="h-full flex flex-col bg-muted/10">
                    <div className="p-4 border-b h-14 flex items-center font-bold">
                        RoleScout
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {/* Navigation Items (Mock) */}
                            <div className="space-y-1">
                                <div className="h-9 px-4 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium">Dashboard</div>
                                <div className="h-9 px-4 py-2 text-muted-foreground rounded-md text-sm font-medium hover:bg-muted">Settings</div>
                            </div>

                            {/* THE NEW INTEGRATION POINT */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Resume</h3>
                                <ResumeOverviewCard resume={MOCK_RESUME} onOpen={() => setIsDrawerOpen(true)} />
                            </div>

                            {/* Other Sidebar Content */}
                            <div className="space-y-2 opacity-50">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Jobs</h3>
                                <div className="h-24 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20"></div>
                                <div className="h-24 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20"></div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Main Content Area (Mock) */}
            <div className="flex-1 bg-muted/5 p-8 flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                    <Globe className="h-12 w-12 mx-auto opacity-20" />
                    <p>LinkedIn / Job Board Content</p>
                </div>
            </div>

            {/* The Drawer - Mounted here to be absolutely positioned over the container if needed, 
          but usually Sheets are portals. For this demo, we use standard Shadcn Sheet behavior. 
      */}
            <ResumeEditorDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                initialResume={MOCK_RESUME}
            />
        </div>
    )
}

const meta = {
    title: "Custom/ResumeEditorDrawer",
    component: ResumeOverviewCard,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ResumeOverviewCard>

export default meta
type Story = StoryObj<typeof meta>

export const EntryPointInSidebar: Story = {
    args: {
        resume: MOCK_RESUME,
        onOpen: () => alert("Drawer Open Triggered"),
    },
}

export const DrawerReadMode: Story = {
    render: () => <ResumeEditorDrawer isOpen={true} onClose={() => { }} initialResume={MOCK_RESUME} />,
}

export const DrawerEditMode: Story = {
    render: () => <ResumeEditorDrawer isOpen={true} onClose={() => { }} initialResume={MOCK_RESUME} />, // We can simulate edit mode inside the component interaction
}

export const IntegratedWithSidebar: Story = {
    render: () => <FullIntegration />,
    parameters: {
        layout: 'centered'
    }
}
