import React, { useEffect, useState } from 'react';
import { ExtensionSidebar, TooltipProvider, SettingsDialog } from '@jobswyft/ui';
import { Settings, Moon, Sun, Sparkles } from 'lucide-react';
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
                <div className="flex flex-col w-full h-full min-w-[320px] max-w-[600px] bg-background text-foreground overflow-hidden">
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
                                <span className="font-bold">JobSwyft V3</span>
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
                            <ResumesList />
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

