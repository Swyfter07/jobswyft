import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import {
    ResumeCard,
    CopyChip,
    ResumeSection,
    type ResumeData,
    type ResumeExperienceEntry,
    type ResumeEducationEntry,
    type ResumeProjectEntry
} from "./resume-card"
import {
    ChevronLeft,
    ChevronRight,
    X,
    Briefcase,
    GraduationCap,
    Wrench,
    User,
    ChevronDown,
    ExternalLink,
    MapPin,
    Mail,
    Phone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ─── MOCK DATA ─────────────────────────────────────────────────────────────

const mockUsageData: ResumeData = {
    id: "resume-1",
    fileName: "Marcus_Chen_SWE_2026.pdf",
    personalInfo: {
        fullName: "Marcus Chen",
        email: "marcus.chen@email.com",
        phone: "+1 (415) 555-0192",
        location: "San Francisco, CA",
        linkedin: "linkedin.com/in/marcuschen",
        website: "marcuschen.dev",
    },
    skills: ["TypeScript", "React", "Node.js", "Python", "AWS", "Docker", "Kubernetes"],
    experience: [
        {
            title: "Senior Software Engineer",
            company: "TechCorp Inc.",
            startDate: "Jan 2023",
            endDate: "Present",
            description: "Led development of the core platform serving 2M+ daily active users. Managed a team of 5 engineers and drove architecture decisions for the microservices migration.",
            highlights: [
                "Reduced API response time by 60% through Redis caching",
                "Led migration from monolith to microservices",
                "Mentored 3 junior developers",
            ],
        },
        {
            title: "Software Engineer",
            company: "StartupXYZ",
            startDate: "Jun 2020",
            endDate: "Dec 2022",
            description: "Full-stack engineer on the payments platform team. Built and maintained critical financial infrastructure processing $50M+ monthly.",
            highlights: [
                "Built payment reconciliation system handling 100K+ daily transactions",
                "Designed and implemented PCI-compliant checkout flow",
            ],
        },
        {
            title: "Junior Developer",
            company: "WebAgency Co",
            startDate: "Aug 2018",
            endDate: "May 2020",
            description: "Developed responsive web applications for clients across finance, healthcare, and e-commerce sectors.",
            highlights: [
                "Delivered 12+ client projects on time",
                "Introduced component library that reduced development time by 30%",
            ],
        },
    ],
    education: [
        {
            degree: "B.S. Computer Science",
            school: "University of California, Berkeley",
            startDate: "2014",
            endDate: "2018",
            gpa: "3.8",
            highlights: []
        },
    ],
    projects: [],
    certifications: []
}

// ─── PROTOTYPE 1: DRILL-DOWN (SLIDE OVER) ──────────────────────────────────

function DrillDownCard({ data }: { data: ResumeData }) {
    const [view, setView] = React.useState<"list" | "detail">("list")
    const [selectedItem, setSelectedItem] = React.useState<any>(null)
    const [category, setCategory] = React.useState<string>("")

    const handleSelect = (item: any, cat: string) => {
        setSelectedItem(item)
        setCategory(cat)
        setView("detail")
    }

    const goBack = () => {
        setView("list")
        setTimeout(() => setSelectedItem(null), 300)
    }

    return (
        <div className="w-[400px] h-[600px] border border-border rounded-xl bg-background overflow-hidden relative font-sans shadow-xl flex flex-col">
            {/* HEADER */}
            <div className="h-12 border-b border-border flex items-center px-4 bg-muted/20 shrink-0 z-20 relative">
                {view === "detail" && (
                    <button onClick={goBack} className="mr-2 p-1 hover:bg-muted rounded-full transition-colors">
                        <ChevronLeft className="size-5 text-muted-foreground" />
                    </button>
                )}
                <span className="font-semibold text-sm">
                    {view === "list" ? "Resume (Drill-Down)" : category}
                </span>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 relative w-full overflow-hidden bg-background">

                {/* LIST VIEW */}
                <div className={cn(
                    "absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out bg-background overflow-y-auto p-4 space-y-6",
                    view === "detail" ? "-translate-x-full opacity-50" : "translate-x-0 opacity-100"
                )}>
                    {/* Personal Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <User className="size-3.5" /> Personal Info
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-muted/30 rounded border text-xs">
                                <div className="text-muted-foreground text-[10px] mb-0.5">Full Name</div>
                                <div className="font-medium truncate">{data.personalInfo.fullName}</div>
                            </div>
                            <div className="p-2 bg-muted/30 rounded border text-xs">
                                <div className="text-muted-foreground text-[10px] mb-0.5">Location</div>
                                <div className="font-medium truncate">{data.personalInfo.location || "Remote"}</div>
                            </div>
                        </div>
                    </div>

                    {/* Experience List */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <Briefcase className="size-3.5" /> Experience
                        </div>
                        <div className="space-y-1">
                            {data.experience.map((job, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSelect(job, "Experience")}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-all group active:scale-[0.99]"
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="font-medium text-sm truncate">{job.title}</div>
                                        <div className="text-xs text-muted-foreground truncate">{job.company}</div>
                                    </div>
                                    <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Education List */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <GraduationCap className="size-3.5" /> Education
                        </div>
                        <div className="space-y-1">
                            {data.education.map((edu, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleSelect(edu, "Education")}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-all group active:scale-[0.99]"
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="font-medium text-sm truncate">{edu.degree}</div>
                                        <div className="text-xs text-muted-foreground truncate">{edu.school}</div>
                                    </div>
                                    <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* DETAIL VIEW */}
                <div className={cn(
                    "absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out bg-background overflow-y-auto z-10",
                    view === "detail" ? "translate-x-0" : "translate-x-full"
                )}>
                    {selectedItem && (
                        <div className="min-h-full bg-background p-5 space-y-5 animate-in fade-in duration-500">
                            <div>
                                <h2 className="text-xl font-bold leading-tight tracking-tight">
                                    {(selectedItem as ResumeExperienceEntry).title || (selectedItem as ResumeEducationEntry).degree}
                                </h2>
                                <div className="text-primary font-medium mt-1.5 text-base">
                                    {(selectedItem as ResumeExperienceEntry).company || (selectedItem as ResumeEducationEntry).school}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 inline-flex items-center bg-muted/50 px-2 py-1 rounded">
                                    {selectedItem.startDate} - {selectedItem.endDate}
                                </div>
                            </div>

                            <div className="h-px bg-border w-full" />

                            {selectedItem.description && (
                                <div className="text-sm leading-relaxed text-foreground/80">
                                    {selectedItem.description}
                                </div>
                            )}

                            {selectedItem.highlights && selectedItem.highlights.length > 0 && (
                                <div className="space-y-3 bg-muted/10 p-4 rounded-lg border border-border/50">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Highlights</h3>
                                    <ul className="space-y-3">
                                        {selectedItem.highlights.map((h: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
                                                <div className="text-primary mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                                                <span>{h}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

// ─── PROTOTYPE 2: FOCUS MODAL (SHEET OVERLAY) ──────────────────────────────

function FocusModalCard({ data }: { data: ResumeData }) {
    const [selectedItem, setSelectedItem] = React.useState<any>(null)


    return (
        <div className="w-[400px] h-[600px] border border-border rounded-xl bg-background overflow-hidden relative font-sans shadow-xl flex flex-col">
            <div className="h-12 border-b border-border flex items-center px-4 bg-muted/20 shrink-0 z-10">
                <span className="font-semibold text-sm">Resume (Focus Modal)</span>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Experience List */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <Briefcase className="size-3.5" /> Experience
                        </div>
                        <div className="space-y-2">
                            {data.experience.map((job, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedItem(job)}
                                    className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all group space-y-2 active:scale-[0.98]"
                                >
                                    <div>
                                        <div className="font-medium text-sm group-hover:text-primary transition-colors">{job.title}</div>
                                        <div className="text-xs text-muted-foreground flex justify-between mt-0.5">
                                            <span>{job.company}</span>
                                            <span>{job.startDate} - {job.endDate}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded">
                                        {job.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Education List (reused logic) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <GraduationCap className="size-3.5" /> Education
                        </div>
                        <div className="space-y-2">
                            {data.education.map((edu, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedItem(edu)}
                                    className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all group active:scale-[0.98]"
                                >
                                    <div className="font-medium text-sm group-hover:text-primary transition-colors">{edu.degree}</div>
                                    <div className="text-xs text-muted-foreground">{edu.school}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </ScrollArea>

            {/* MODAL OVERLAY */}
            <div
                className={cn(
                    "absolute inset-0 bg-background/80 backdrop-blur-sm z-30 transition-all duration-300 flex flex-col justify-end",
                    selectedItem ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                )}
                onClick={() => setSelectedItem(null)}
            >
                <div
                    className={cn(
                        "w-full bg-card border-t border-border rounded-t-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out max-h-[85%] flex flex-col",
                        selectedItem ? "translate-y-0" : "translate-y-full"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle */}
                    <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0" onClick={() => setSelectedItem(null)}>
                        <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2">
                        {selectedItem && (
                            <div className="space-y-5 animate-in slide-in-from-bottom-5 duration-300 fade-in">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold leading-tight">{selectedItem.title || selectedItem.degree}</h2>
                                        <div className="text-primary font-medium mt-1">{selectedItem.company || selectedItem.school}</div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)} className="-mr-2 -mt-2 rounded-full h-8 w-8 hover:bg-muted">
                                        <X className="size-4" />
                                    </Button>
                                </div>


                                <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full inline-flex items-center font-medium">
                                    {selectedItem.startDate} - {selectedItem.endDate}
                                </div>

                                {selectedItem.description && (
                                    <div className="text-sm leading-relaxed text-foreground/90">
                                        {selectedItem.description}
                                    </div>
                                )}

                                {selectedItem.highlights && selectedItem.highlights.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Achievements</h3>
                                        <ul className="space-y-3">
                                            {selectedItem.highlights.map((h: string, i: number) => (
                                                <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                                                    <div className="text-primary mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                                                    <span>{h}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── PROTOTYPE 3: HORIZONTAL DECK ──────────────────────────────────────────

function HorizontalDeckCard({ data }: { data: ResumeData }) {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = React.useState(0)

    const handleScroll = () => {
        if (!scrollRef.current) return
        const scrollLeft = scrollRef.current.scrollLeft
        const width = scrollRef.current.offsetWidth
        // Very rough index calculation
        const index = Math.round(scrollLeft / (280 + 16)) // card width + gap
        setActiveIndex(index)
    }

    return (
        <div className="w-[400px] h-[600px] border border-border rounded-xl bg-muted/5 overflow-hidden relative font-sans shadow-xl flex flex-col">
            <div className="h-12 border-b border-border flex items-center px-4 bg-background shrink-0 z-10 justify-between">
                <span className="font-semibold text-sm">Deck View</span>
                <span className="text-xs text-muted-foreground">{activeIndex + 1} / {data.experience.length + 1}</span>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-x-auto snap-x snap-mandatory flex items-center px-8 gap-4 py-8 scrollbar-hide"
            >
                {/* Intro Card */}
                <div className="snap-center shrink-0 w-[280px] h-[460px] bg-background border border-border rounded-3xl shadow-sm p-6 flex flex-col items-center justify-center text-center space-y-6 transition-transform duration-300 hover:scale-[1.02]">
                    <div className="size-24 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-2 border border-primary/10">
                        <User className="size-10 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">{data.personalInfo.fullName}</h2>
                        <p className="text-muted-foreground text-sm">{data.personalInfo.location}</p>
                    </div>

                    <div className="w-full h-px bg-border/50" />

                    <div className="flex flex-wrap justify-center gap-1.5">
                        {data.skills.slice(0, 5).map(s => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-2 py-0.5">{s}</Badge>
                        ))}
                        {data.skills.length > 5 && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5">+{data.skills.length - 5}</Badge>
                        )}
                    </div>
                </div>

                {/* Jobs Cards */}
                {data.experience.map((job, i) => (
                    <div key={i} className="snap-center shrink-0 w-[280px] h-[460px] bg-background border border-border rounded-3xl shadow-sm flex flex-col overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
                        <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
                            <h3 className="font-bold text-lg leading-tight mb-1">{job.title}</h3>
                            <div className="text-primary text-sm font-medium">{job.company}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-3 opacity-70">{job.startDate} - {job.endDate}</div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-4 scrollbar-thin">
                            {job.description && (
                                <p className="text-muted-foreground leading-relaxed text-xs">{job.description}</p>
                            )}
                            <ul className="space-y-3">
                                {job.highlights.map((h, j) => (
                                    <li key={j} className="flex gap-2.5">
                                        <span className="text-primary mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                                        <span className="text-xs leading-relaxed">{h}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Dots */}
            <div className="h-8 shrink-0 flex justify-center items-center gap-1.5 pb-2">
                {Array.from({ length: data.experience.length + 1 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "size-1.5 rounded-full transition-all duration-300",
                            activeIndex === i ? "bg-primary w-3" : "bg-border"
                        )}
                    />
                ))}
            </div>
        </div>
    )
}


// ─── STORYBOOK META ────────────────────────────────────────────────────────

const meta = {
    title: "Custom/ResumeUIPrototypes",
    parameters: {
        layout: "centered",
    },
} satisfies Meta<typeof DrillDownCard>

export default meta
type Story = StoryObj<typeof meta>

export const Concept_1_DrillDown: Story = {
    render: () => <DrillDownCard data={mockUsageData} />,
}

export const Concept_2_FocusModal: Story = {
    render: () => <FocusModalCard data={mockUsageData} />,
}

export const Concept_3_HorizontalDeck: Story = {
    render: () => <HorizontalDeckCard data={mockUsageData} />,
}
