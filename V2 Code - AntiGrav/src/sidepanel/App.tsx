import { useEffect, useState, useMemo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ExtensionSidebar } from '@/components/custom/extension-sidebar';
import { AppHeader } from '@/components/custom/app-header';
import { JobCard, JobData, MatchData } from '@/components/custom/job-card';
import { ResumeCard } from '@/components/custom/resume-card';
import { AIStudio } from '@/components/custom/ai-studio';
import { Coach, Message } from '@/components/custom/coach';
import { useResumes } from '~/lib/hooks/use-resumes';
import { useJobTracking } from '~/lib/hooks/use-job-tracking';
import { useSettings } from '~/hooks/use-settings';
import { useTheme } from '~/hooks/use-theme';
import { fillForm } from '~/lib/utils/autofill-script';
import { Autofill, AutofillField } from '@/components/custom/autofill';
import { SettingsDialog } from '@/components/custom/settings-dialog';
import { generateCompletion } from '~/lib/utils/openai';
import { JOB_JET_PROMPTS } from '~/lib/utils/prompts';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

function App() {
    const [activeTab, setActiveTab] = useState("scan");
    const [isAutofilling, setIsAutofilling] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isManualEdit, setIsManualEdit] = useState(false);

    // Coach State
    const [coachMessages, setCoachMessages] = useState<Message[]>([]);
    const [isCoachTyping, setIsCoachTyping] = useState(false);

    // Hooks
    const {
        resumes,
        activeResumeId,
        resumeData,
        handleResumeSelect,
        handleUpload,
        handleDelete
    } = useResumes();

    const { currentJob, setCurrentJob, scanJob, isScanning, saveJob } = useJobTracking();
    const { apiKey, setApiKey, model, setModel } = useSettings();
    const { isDarkMode, toggleTheme } = useTheme();

    // Prepare Autofill Data
    const autofillData = useMemo(() => {
        if (!resumeData) return null;
        const nameParts = (resumeData.personalInfo.name || '').split(' ');
        return {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: resumeData.personalInfo.email || '',
            phone: resumeData.personalInfo.phone || '',
            linkedin: resumeData.personalInfo.linkedin || '',
            website: resumeData.personalInfo.website || '',
            github: resumeData.personalInfo.github || '',
            portfolio: resumeData.personalInfo.portfolio || '',
        };
    }, [resumeData]);

    // Generate UI Fields for Autofill Component
    const autofillFields: AutofillField[] = useMemo(() => {
        if (!autofillData) return [];
        return [
            {
                id: "fname",
                label: "First Name",
                value: autofillData.firstName,
                status: autofillData.firstName ? "ready" : "missing",
                category: "personal"
            },
            {
                id: "lname",
                label: "Last Name",
                value: autofillData.lastName,
                status: autofillData.lastName ? "ready" : "missing",
                category: "personal"
            },
            {
                id: "email",
                label: "Email",
                value: autofillData.email,
                status: autofillData.email ? "ready" : "missing",
                category: "personal"
            },
            {
                id: "phone",
                label: "Phone",
                value: autofillData.phone,
                status: autofillData.phone ? "ready" : "missing",
                category: "personal"
            },
            {
                id: "linkedin",
                label: "LinkedIn",
                value: autofillData.linkedin,
                status: autofillData.linkedin ? "ready" : "missing",
                category: "questions"
            },
            {
                id: "website",
                label: "Website",
                value: autofillData.website,
                status: autofillData.website ? "ready" : "missing",
                category: "questions"
            }
        ];
    }, [autofillData]);

    const handleAutofill = async () => {
        if (!autofillData) return;
        setIsAutofilling(true);
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: fillForm,
                    args: [autofillData]
                });
            }
        } catch (error) {
            console.error("Autofill failed:", error);
        } finally {
            setTimeout(() => setIsAutofilling(false), 500);
        }
    };

    // Handle Coach Messages
    const handleCoachMessage = async (message: string) => {
        if (!message.trim() || isCoachTyping) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: message,
            timestamp: new Date(),
        };

        setCoachMessages(prev => [...prev, newMessage]);
        setIsCoachTyping(true);

        try {
            if (!apiKey) {
                setTimeout(() => {
                    const errorMsg: Message = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: "Please set your OpenAI API key in Settings to start chatting.",
                        timestamp: new Date(),
                    };
                    setCoachMessages(prev => [...prev, errorMsg]);
                    setIsCoachTyping(false);
                }, 500);
                return;
            }

            // Construct System Prompt
            const systemPrompt = JOB_JET_PROMPTS.career_coach.system;
            const jobContext = currentJob
                ? `\nJOB TITLE: ${currentJob.title}\nCOMPANY: ${currentJob.company}\nDESCRIPTION: ${currentJob.description}`
                : "\nNo specific job active.";

            const resumeContext = resumeData
                ? `\nRESUME CONTENT: ${JSON.stringify(resumeData.experience)} ${JSON.stringify(resumeData.skills)}`
                : "\nNo resume active.";

            const fullSystemPrompt = `${systemPrompt}\n\nCONTEXT:${jobContext}${resumeContext}`;

            const response = await generateCompletion({
                apiKey,
                model: model || 'gpt-4o-mini',
                messages: [
                    { role: "system", content: fullSystemPrompt },
                    ...coachMessages.map(m => ({ role: m.role, content: m.content })),
                    { role: "user", content: newMessage.content }
                ]
            });

            if (response) {
                const aiResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: response,
                    timestamp: new Date(),
                };
                setCoachMessages(prev => [...prev, aiResponse]);
            }
        } catch (error) {
            console.error("Coach API Error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "I'm having trouble connecting. Please check your API key and internet connection.",
                timestamp: new Date(),
            };
            setCoachMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsCoachTyping(false);
        }
    };

    // Auto-scan when on Scan tab
    useEffect(() => {
        if (activeTab === "scan" && !currentJob) {
            scanJob();
        }
    }, [activeTab]);

    // AI Studio State
    const [matchAnalysis, setMatchAnalysis] = useState<any | null>(null);
    const [generatedContent, setGeneratedContent] = useState<{
        coverLetter?: string;
        answer?: string;
        outreach?: string;
    }>({});
    const [isStudioGenerating, setIsStudioGenerating] = useState(false);
    const [studioLabel, setStudioLabel] = useState("Generating...");

    // Helper to get contexts
    const getContexts = () => {
        const jobContext = currentJob ? `Job Title: ${currentJob.title}\nCompany: ${currentJob.company}\nDescription: ${currentJob.description}` : "";
        const resumeContext = resumeData ? JSON.stringify(resumeData) : "";
        return { jobContext, resumeContext };
    };

    const handleAnalyzeMatch = async () => {
        if (!currentJob || !resumeData) return;
        setIsStudioGenerating(true);
        setStudioLabel("Analyzing Match...");
        try {
            const { jobContext, resumeContext } = getContexts();
            // Use the prompt function directly
            const userPrompt = JOB_JET_PROMPTS.match_analysis.user(resumeContext, currentJob.title, currentJob.description || "");
            const systemPrompt = JOB_JET_PROMPTS.match_analysis.system;

            const response = await generateCompletion({
                apiKey,
                model: model || 'gpt-4o-mini',
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                responseFormat: "json_object"
            });

            if (response) {
                try {
                    const analysis = JSON.parse(response);
                    setMatchAnalysis(analysis);
                } catch (e) {
                    console.error("Failed to parse match analysis JSON", e);
                }
            }
        } catch (error) {
            console.error("Match Analysis Error:", error);
        } finally {
            setIsStudioGenerating(false);
            setStudioLabel("Generating...");
        }
    };

    const handleGenerateCoverLetter = async (params: { tone: string, length: string, instructions: string }) => {
        if (!currentJob || !resumeData) return;
        setIsStudioGenerating(true);
        setStudioLabel("Drafting Cover Letter...");
        try {
            const { resumeContext } = getContexts();
            const userPrompt = JOB_JET_PROMPTS.cover_letter.user(
                resumeContext,
                currentJob.description || "",
                currentJob.title,
                currentJob.company,
                params.length,
                params.tone
            ) + (params.instructions ? `\n\nADDITIONAL INSTRUCTIONS: ${params.instructions}` : "");

            const systemPrompt = JOB_JET_PROMPTS.cover_letter.system(params.tone);

            const response = await generateCompletion({
                apiKey,
                model: model || 'gpt-4o-mini',
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            });

            if (response) {
                setGeneratedContent(prev => ({ ...prev, coverLetter: response }));
            }
        } catch (error) {
            console.error("Cover Letter Error:", error);
        } finally {
            setIsStudioGenerating(false);
            setStudioLabel("Generating...");
        }
    };

    const handleGenerateAnswer = async (params: { question: string, tone: string, length: string }) => {
        if (!currentJob || !resumeData) return;
        setIsStudioGenerating(true);
        setStudioLabel("Drafting Answer...");
        try {
            const { resumeContext } = getContexts();
            const userPrompt = JOB_JET_PROMPTS.answer_question.user(
                params.question,
                resumeContext,
                currentJob.title,
                currentJob.company,
                params.length,
                params.tone
            );
            const systemPrompt = JOB_JET_PROMPTS.answer_question.system(params.tone);

            const response = await generateCompletion({
                apiKey,
                model: model || 'gpt-4o-mini',
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            });

            if (response) {
                setGeneratedContent(prev => ({ ...prev, answer: response }));
            }
        } catch (error) {
            console.error("Answer Generation Error:", error);
        } finally {
            setIsStudioGenerating(false);
            setStudioLabel("Generating...");
        }
    };

    const handleGenerateOutreach = async (params: { role: string, platform: string, tone: string, length: string }) => {
        if (!currentJob || !resumeData) return;
        setIsStudioGenerating(true);
        setStudioLabel("Drafting Message...");
        try {
            const { resumeContext } = getContexts();
            const userPrompt = JOB_JET_PROMPTS.outreach_message.user(
                resumeContext,
                currentJob.title,
                currentJob.company,
                params.role, // managerName/Role
                params.platform, // Type
                params.tone
            );
            const systemPrompt = JOB_JET_PROMPTS.outreach_message.system;

            const response = await generateCompletion({
                apiKey,
                model: model || 'gpt-4o-mini',
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            });

            if (response) {
                setGeneratedContent(prev => ({ ...prev, outreach: response }));
            }
        } catch (error) {
            console.error("Outreach Generation Error:", error);
        } finally {
            setIsStudioGenerating(false);
            setStudioLabel("Generating...");
        }
    };

    // Derived Match Data for JobCard
    const matchData = useMemo(() => {
        if (!matchAnalysis) return undefined;
        return {
            score: matchAnalysis.score,
            matchedSkills: [], // Not currently returned by AI
            missingSkills: matchAnalysis.missingSkills || [],
            summary: matchAnalysis.explanation || "No analysis available"
        };
    }, [matchAnalysis]);

    const handleManualAddJob = () => {
        setIsManualEdit(true);
        setCurrentJob({
            title: "New Job",
            company: "Company",
            location: "",
            description: "",
            status: "saved"
        });
    };

    const handleJobUpdate = (data: Partial<JobData>) => { // Used by onAnalyze
        if (!currentJob) return;
        const updatedJob = { ...currentJob, ...data };
        setCurrentJob(updatedJob);
        // Also trigger analysis if description is present?
        // Logic handled in handleAnalyzeMatch which reads currentJob
        // But we need to make sure state is updated before calling it.
        // The JobCard calls onAnalyze with data, we should update state then Analyze.
        // Wait, handleAnalyzeMatch uses currentJob state.
        // We should update the state then trigger analysis.
        // Since React state update is async, we shouldn't call handleAnalyzeMatch immediately unless we pass the new data.
        // But for now, let's just update the job.
        saveJob(updatedJob);
        // If we want to analyze immediately:
        // That logic is bit complex for this refactor. Let's assume user clicks analyze again in AI Studio?
        // Or JobCard calls onAnalyze which we can hook up to update job THEN analyze.
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "scan":
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {currentJob ? (
                            <JobCard
                                job={currentJob}
                                match={matchData}
                                onCoach={() => setActiveTab("coach")}
                                onDiveDeeper={() => setActiveTab("ai-studio")}
                                isSaved={!!currentJob.id}
                                isScanning={isScanning}
                                onScan={scanJob}
                                isEditing={isManualEdit}
                                onAnalyze={(data) => {
                                    if (currentJob) {
                                        const updated = { ...currentJob, ...data };
                                        setCurrentJob(updated);
                                        // Trigger AI Studio analysis if needed, but JobCard onAnalyze button label says "Update Analysis" or "Analyze Job".
                                        // Effectively we want to set currentJob and maybe jump to AI Studio? or stay here?
                                        // JobCard usage implies staying here.
                                        saveJob(updated);
                                        // Trigger match analysis
                                        // valid point: we need to wait for state, or pass explicit data.
                                        // Let's rely on user clicking "Dive Deeper" or we can trigger it.
                                        // For now just save.
                                        setIsManualEdit(false);
                                    }
                                }}
                                onSave={() => {
                                    if (currentJob) saveJob(currentJob);
                                    setIsManualEdit(false);
                                }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                                {isScanning ? (
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        <p className="text-sm text-muted-foreground">Scanning job details...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-3 rounded-full bg-muted/50">
                                            <svg
                                                className="w-6 h-6 text-muted-foreground"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-medium">No Job Detected</h3>
                                            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                                                Navigate to a job post on LinkedIn, Indeed, or other supported sites to scan.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => scanJob()}
                                            disabled={isScanning}
                                            className="text-xs text-primary hover:underline mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Retry Scan
                                        </button>

                                        <div className="pt-4">
                                            <Button variant="outline" size="sm" onClick={handleManualAddJob}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Job Manually
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                );
            case "ai-studio":
                return (
                    <AIStudio
                        isLocked={!currentJob}
                        isGenerating={isStudioGenerating}
                        generatingLabel={studioLabel}
                        matchAnalysis={matchAnalysis}
                        generatedContent={generatedContent}
                        onUnlock={scanJob}
                        onAnalyzeMatch={handleAnalyzeMatch}
                        onGenerateCoverLetter={handleGenerateCoverLetter}
                        onGenerateAnswer={handleGenerateAnswer}
                        onGenerateOutreach={handleGenerateOutreach}
                    />
                );
            case "autofill":
                return (
                    <Autofill
                        fields={autofillFields}
                        isFilling={isAutofilling}
                        onFill={handleAutofill}
                    />
                );
            case "coach":
                return (
                    <Coach
                        messages={coachMessages}
                        onSendMessage={handleCoachMessage}
                        isTyping={isCoachTyping}
                        job={currentJob}
                        resume={resumeData}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <TooltipProvider>
            <div className="w-full h-screen bg-background text-foreground overflow-hidden">
                <ExtensionSidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    header={
                        <AppHeader
                            appName="JobSwyft"
                            onSettingsClick={() => setIsSettingsOpen(true)}
                            onThemeToggle={toggleTheme}
                            isDarkMode={isDarkMode}
                        />
                    }
                    contextContent={
                        <ResumeCard
                            resumes={resumes}
                            activeResumeId={activeResumeId}
                            resumeData={resumeData}
                            onResumeSelect={handleResumeSelect}
                            onUpload={handleUpload}
                            onDelete={handleDelete}
                            isCompact
                            isCollapsible
                            className="mb-4"
                        />
                    }
                    scanContent={activeTab === "scan" ? renderTabContent() : null}
                    studioContent={activeTab === "ai-studio" ? renderTabContent() : null}
                    autofillContent={activeTab === "autofill" ? renderTabContent() : null}
                    coachContent={activeTab === "coach" ? renderTabContent() : null}
                    apiKey={apiKey}
                    onApiKeyChange={setApiKey}
                />

                <SettingsDialog
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    apiKey={apiKey}
                    onApiKeyChange={setApiKey}
                    model={model}
                    onModelChange={setModel}
                />
            </div>
        </TooltipProvider>
    );
}

export default App;
