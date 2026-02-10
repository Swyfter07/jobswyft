import React, { useEffect, useState } from 'react';
import {
    ExtensionSidebar,
    TooltipProvider,
    SettingsDialog,
    Badge,
    Button,
    ScrollArea,
    ResumeSection,
    PersonalInfoContent,
    SkillsContent,
    ExperienceContent,
    EducationContent,
    cn
} from '@jobswyft/ui';
import {
    Settings,
    Moon,
    Sun,
    Sparkles,
    ChevronLeft,
    Maximize2,
    Wrench,
    Upload,
    User,
    Briefcase,
    GraduationCap,
    Pencil
} from 'lucide-react';
import { ScanTab } from './ScanTab';
import { ResumesList } from './ResumesList';
import { AIStudioTab } from './AIStudioTab';
import { AutofillTab } from './AutofillTab';
import { CoachTab } from './CoachTab';
import { ToastProvider } from './ToastContext';
import { storageService } from '@/services/storage';
import { JobData, Resume, ResumeData, EEOPreferences } from '@/types';
import '@/entrypoints/styles.css';

function App() {
    const [activeTab, setActiveTab] = useState('scan');
    const [autofillRefreshKey, setAutofillRefreshKey] = useState(0);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
    const [jobData, setJobData] = useState<JobData | null>(null);

    // Settings state
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gpt-4o-mini');
    const [darkMode, setDarkMode] = useState(false);
    const [autoAnalysis, setAutoAnalysis] = useState(true);
    const [eeoPreferences, setEeoPreferences] = useState<EEOPreferences>({});

    // Layered Sidebar State
    const [view, setView] = useState<"main" | "resume_detail">("main");
    const [isEditing, setIsEditing] = useState(false);

    const handleMainResumeClick = () => {
        setView("resume_detail");
    };

    const handleBack = () => {
        setView("main");
        setIsEditing(false);
    };

    const handleResumeUpdate = (section: keyof ResumeData, data: any) => {
        if (!activeResumeId) return;

        const updatedResumes = resumes.map(r => {
            if (r.id === activeResumeId) {
                return {
                    ...r,
                    data: {
                        ...r.data,
                        [section]: data
                    }
                };
            }
            return r;
        });

        setResumes(updatedResumes);
        storageService.saveResumes(updatedResumes);
    };

    useEffect(() => {
        // Initial load
        loadData();
        loadSettings();

        // Listen for storage changes (resumes, active resume)
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes['job_jet_resumes'] || changes['job_jet_active_resume_id']) {
                loadData();
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    // Apply dark mode class to document
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const loadData = async () => {
        const storedResumes = await storageService.getResumes();
        setResumes(storedResumes);
        const currentId = await storageService.getActiveResumeId();
        setActiveResumeId(currentId);
    };

    const loadSettings = async () => {
        const key = await storageService.getOpenAIKey();
        const savedModel = await storageService.getOpenAIModel();
        const savedDarkMode = await storageService.getDarkMode();
        const savedAutoAnalysis = await storageService.getAutoAnalysisEnabled();
        const savedEEO = await storageService.getEEOPreferences();
        if (key) setApiKey(key);
        if (savedModel) setModel(savedModel);
        setDarkMode(savedDarkMode);
        setAutoAnalysis(savedAutoAnalysis);
        setEeoPreferences(savedEEO);
    };

    const handleSaveSettings = async (newKey: string, newModel: string) => {
        setApiKey(newKey);
        setModel(newModel);
        await storageService.setOpenAIKey(newKey);
        // @ts-ignore - model type string vs generic
        await storageService.setOpenAIModel(newModel);
    };

    const toggleDarkMode = async () => {
        const newValue = !darkMode;
        setDarkMode(newValue);
        await storageService.setDarkMode(newValue);
    };

    const handleAutoAnalysisChange = async (enabled: boolean) => {
        console.log('[JobSwyft] Toggling auto-analysis to:', enabled);
        setAutoAnalysis(enabled);
        await storageService.setAutoAnalysisEnabled(enabled);
        console.log('[JobSwyft] Auto-analysis saved:', enabled);
    };

    const handleEEOPreferencesChange = async (prefs: EEOPreferences) => {
        setEeoPreferences(prefs);
        await storageService.setEEOPreferences(prefs);
    };

    const activeResume = resumes.find(r => r.id === activeResumeId);
    const activeResumeData = activeResume?.data as ResumeData | null;

    return (
        <TooltipProvider>
            <ToastProvider>
                <div className="relative w-full h-full min-w-[320px] max-w-[600px] bg-background text-foreground overflow-hidden">
                    {/* LEVEL 1: MAIN SIDEBAR */}
                    <div
                        className={cn(
                            "absolute inset-0 w-full h-full transition-transform duration-500 ease-in-out",
                            view === "resume_detail" ? "-translate-x-1/4 opacity-50 scale-95" : "translate-x-0 opacity-100 scale-100"
                        )}
                    >
                        <ExtensionSidebar
                            mode="sidepanel"
                            className="flex-1 w-full flex flex-col"
                            activeTab={activeTab}
                            onTabChange={(tab: string) => {
                                setActiveTab(tab);
                                if (tab === 'autofill') {
                                    setAutofillRefreshKey(k => k + 1);
                                }
                            }}
                            header={
                                <div className="p-4 border-b bg-background flex items-center justify-between">
                                    <span className="font-bold">JobSwyft V4</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleAutoAnalysisChange(!autoAnalysis)}
                                            className={`p-2 rounded-full transition-colors ${autoAnalysis ? 'bg-primary/20 text-primary' : 'hover:bg-muted opacity-50'}`}
                                            title={autoAnalysis ? "Auto-analysis ON (click to disable)" : "Auto-analysis OFF (click to enable)"}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={toggleDarkMode}
                                            className="p-2 hover:bg-muted rounded-full transition-colors"
                                            title={darkMode ? "Light mode" : "Dark mode"}
                                        >
                                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => setSettingsOpen(true)}
                                            className="p-2 hover:bg-muted rounded-full transition-colors"
                                            title="Settings"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            }

                            scanContent={
                                <ScanTab
                                    jobData={jobData}
                                    onJobUpdate={setJobData}
                                    resumeContent={activeResume?.content || null}
                                    autoAnalysis={autoAnalysis}
                                />
                            }

                            contextContent={
                                <div className="mb-1">
                                    <ResumesList
                                        isCompactTrigger={true}
                                        onDrillDown={handleMainResumeClick}
                                    />
                                </div>
                            }

                            studioContent={
                                <AIStudioTab
                                    jobData={jobData}
                                    resumeData={activeResumeData}
                                    resumeContent={activeResume?.content || null}
                                />
                            }

                            autofillContent={
                                <AutofillTab
                                    resumeData={activeResumeData}
                                    activeResume={activeResume}
                                    jobData={jobData}
                                    refreshKey={autofillRefreshKey}
                                />
                            }

                            coachContent={
                                <CoachTab
                                    jobData={jobData}
                                    resumeData={activeResumeData}
                                    resumeContent={activeResume?.content || null}
                                />
                            }
                        />
                    </div>

                    {/* LEVEL 2: RESUME DETAIL SIDEBAR (SLIDES IN) */}
                    <div
                        className={cn(
                            "absolute inset-0 w-full h-full bg-background z-20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-2xl border-l overflow-hidden",
                            view === "resume_detail" ? "translate-x-0" : "translate-x-full"
                        )}
                    >
                        {/* Secondary Header */}
                        <div className="h-14 border-b flex items-center px-4 gap-3 bg-muted/10 shrink-0">
                            <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-2">
                                <ChevronLeft className="size-5" />
                            </Button>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-sm truncate">{activeResume?.fileName || "No Resume Selected"}</h2>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="h-4 px-1 text-[10px] border-green-200 text-green-700 bg-green-50">Verified</Badge>
                                    <span>{activeResume?.timestamp ? new Date(activeResume.timestamp).toLocaleDateString() : ""}</span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant={isEditing ? "default" : "ghost"}
                                    size={isEditing ? "sm" : "icon"}
                                    onClick={() => setIsEditing(!isEditing)}
                                    title={isEditing ? "Done Editing" : "Edit Resume"}
                                >
                                    {isEditing ? (
                                        <span className="text-xs">Done</span>
                                    ) : (
                                        <Pencil className="size-4 text-muted-foreground" />
                                    )}
                                </Button>
                                <Button variant="ghost" size="icon" title="Download">
                                    <Upload className="size-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>

                        {/* Resume Content (Full Scrollable) */}
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-4 pb-20 space-y-6 max-w-2xl mx-auto">
                                {activeResumeData ? (
                                    <>
                                        <ResumeSection icon={<User />} title="Personal Info" defaultOpen={true}>
                                            <PersonalInfoContent
                                                data={activeResumeData.personalInfo}
                                                isEditing={isEditing}
                                                onChange={(data) => handleResumeUpdate('personalInfo', data)}
                                            />
                                        </ResumeSection>

                                        <ResumeSection icon={<Wrench />} title="Skills" defaultOpen={true}>
                                            <SkillsContent
                                                skills={activeResumeData.skills}
                                                isEditing={isEditing}
                                                onChange={(data) => handleResumeUpdate('skills', data)}
                                            />
                                        </ResumeSection>

                                        <ResumeSection icon={<Briefcase />} title="Experience" defaultOpen={true}>
                                            <ExperienceContent
                                                entries={activeResumeData.experience}
                                                isEditing={isEditing}
                                                onChange={(data) => handleResumeUpdate('experience', data)}
                                            />

                                        </ResumeSection>

                                        <ResumeSection icon={<GraduationCap />} title="Education" defaultOpen={true}>
                                            <EducationContent
                                                entries={activeResumeData.education}
                                                isEditing={isEditing}
                                                onChange={(data) => handleResumeUpdate('education', data)}
                                            />
                                        </ResumeSection>
                                    </>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No resume data available.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Secondary Footer if needed */}
                        <div className="p-3 border-t bg-muted/5 shrink-0">
                            <Button className="w-full" onClick={handleBack}>Done</Button>
                        </div>
                    </div>

                    <SettingsDialog
                        open={settingsOpen}
                        onOpenChange={setSettingsOpen}
                        apiKey={apiKey}
                        onApiKeyChange={(key: string) => handleSaveSettings(key, model)}
                        model={model}
                        onModelChange={(m: string) => handleSaveSettings(apiKey, m)}
                        autoAnalysis={autoAnalysis}
                        onAutoAnalysisChange={handleAutoAnalysisChange}
                        eeoPreferences={eeoPreferences}
                        onEEOPreferencesChange={handleEEOPreferencesChange}
                    />
                </div>
            </ToastProvider>
        </TooltipProvider>
    );
}

export default App;

