
import { useState } from "react"
import {
    Pencil,
    Check,
    Copy,
    X,
    Save,
    FileText,
    Briefcase,
    Hammer
} from "lucide-react"

import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from "../ui/sheet"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"

import { ResumeData, Field } from "./resume-overview-card"

interface ResumeEditorDrawerProps {
    isOpen: boolean
    onClose: () => void
    initialResume: ResumeData
}

export const ResumeEditorDrawer = ({
    isOpen,
    onClose,
    initialResume
}: ResumeEditorDrawerProps) => {
    const [isEditMode, setIsEditMode] = useState(false)
    // In a real app, we would use a form library or proper state management
    const [resumeData] = useState(initialResume)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleSave = () => {
        setIsEditMode(false)
        // alert("Changes saved to context!")
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
            <SheetContent
                side="right"
                className="w-full sm:w-[500px] sm:max-w-none p-0 flex flex-col gap-0 shadow-2xl border-l"
                onInteractOutside={(e) => e.preventDefault()}
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
