
import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { parseResumeToProfile, extractPersonalInfo, ResumeProfile } from '../utils/resume-parser';

// Set worker source for extension environment
if (typeof chrome !== 'undefined' && chrome.runtime) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');
}

// Interfaces matching packages/ui/src/components/custom/resume-card.tsx
export interface ResumeSummary {
    id: string;
    fileName: string;
}

export interface ResumeData {
    id: string;
    fileName: string;
    personalInfo: any;
    skills: string[];
    experience: any[];
    education: any[];
    certifications?: any[];
    projects?: any[];
}

export function useResumes() {
    const [resumes, setResumes] = useState<ResumeSummary[]>([]);
    const [activeResumeId, setActiveResumeId] = useState<string | undefined>(undefined);
    const [activeResumeData, setActiveResumeData] = useState<ResumeData | null>(null);
    const [loading, setLoading] = useState(true);

    // Storage keys matching V1 for compatibility
    const STORAGE_KEY_RESUMES = 'job_jet_resumes';
    const STORAGE_KEY_ACTIVE_ID = 'job_jet_active_resume_id';

    useEffect(() => {
        // Load initial state from storage
        const loadFromStorage = async () => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    const result = await chrome.storage.local.get([STORAGE_KEY_RESUMES, STORAGE_KEY_ACTIVE_ID]);
                    const storedResumes = result[STORAGE_KEY_RESUMES] || [];

                    if (storedResumes.length > 0) {
                        // Map V1 structure to V2 Summary
                        const mappedResumes = storedResumes.map((r: any) => ({
                            id: r.id,
                            fileName: r.fileName || `Resume ${new Date(parseInt(r.id)).toLocaleDateString()}`
                        }));
                        setResumes(mappedResumes);

                        if (result[STORAGE_KEY_ACTIVE_ID]) {
                            setActiveResumeId(result[STORAGE_KEY_ACTIVE_ID]);
                        } else {
                            setActiveResumeId(mappedResumes[0].id);
                        }
                    } else {
                        console.log("No resumes found in storage.");
                        setResumes([]);
                    }
                } else {
                    // Dev mode / Mock
                    setResumes([]);
                }
            } catch (error) {
                console.error("Failed to load resumes:", error);
            } finally {
                setLoading(false);
            }
        };

        loadFromStorage();
    }, []);

    useEffect(() => {
        const loadActiveResumeData = async () => {
            if (!activeResumeId) {
                setActiveResumeData(null);
                return;
            }

            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const result = await chrome.storage.local.get([STORAGE_KEY_RESUMES]);
                const storedResumes = result[STORAGE_KEY_RESUMES] || [];
                const fullResume = storedResumes.find((r: any) => r.id === activeResumeId);

                if (fullResume) {
                    // If V1 data (has 'profile'), map it. If V2, use as is.
                    let profile = fullResume.profile;

                    // If profile is missing but we have text, parse it (migration fix)
                    if (!profile && fullResume.text) {
                        profile = parseResumeToProfile(fullResume.text);
                    }

                    // If logic still fails, default to empty
                    if (!profile) {
                        profile = { personal_info: {}, skills: [], experience: [], education: [] };
                    }

                    setActiveResumeData({
                        id: fullResume.id,
                        fileName: fullResume.fileName || `Resume`,
                        personalInfo: profile.personal_info || extractPersonalInfo(fullResume.text || ""),
                        skills: profile.skills || [],
                        experience: profile.experience || [],
                        education: profile.education || [],
                        projects: profile.projects || []
                    });
                }
            } else {
                // Dev fallback
                setActiveResumeData(null);
            }
        };

        loadActiveResumeData();
    }, [activeResumeId]);

    const handleResumeSelect = (id: string) => {
        setActiveResumeId(id);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ [STORAGE_KEY_ACTIVE_ID]: id });
        }
    };

    const handleUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';

        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                // 1. Read file
                const arrayBuffer = await file.arrayBuffer();

                // 2. Parse PDF
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;

                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }

                // 3. Parse Text to Profile
                const profile = parseResumeToProfile(fullText);
                const info = extractPersonalInfo(fullText);
                profile.personal_info = info;

                // 4. Construct V1-compatible object
                const newResumeId = Date.now().toString();
                const newResume = {
                    id: newResumeId,
                    fileName: file.name,
                    date: new Date().toISOString(),
                    data: await fileToBase64(file), // Store Base64 for viewing if needed
                    text: fullText,
                    profile: profile
                };

                // 5. Save to Storage
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    const result = await chrome.storage.local.get([STORAGE_KEY_RESUMES]);
                    const currentResumes = result[STORAGE_KEY_RESUMES] || [];
                    const updatedResumes = [...currentResumes, newResume];

                    await chrome.storage.local.set({
                        [STORAGE_KEY_RESUMES]: updatedResumes,
                        [STORAGE_KEY_ACTIVE_ID]: newResumeId
                    });

                    // Update State
                    setResumes(updatedResumes.map((r: any) => ({
                        id: r.id,
                        fileName: r.fileName
                    })));
                    setActiveResumeId(newResumeId);
                }

            } catch (error) {
                console.error("Resume Upload Error:", error);
                alert("Failed to parse resume. Please ensure it is a valid PDF.");
            }
        };

        input.click();
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleDelete = async (id: string) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get([STORAGE_KEY_RESUMES, STORAGE_KEY_ACTIVE_ID]);
            const currentResumes = result[STORAGE_KEY_RESUMES] || [];
            const updatedResumes = currentResumes.filter((r: any) => r.id !== id);

            let newActiveId = result[STORAGE_KEY_ACTIVE_ID];
            if (id === newActiveId) {
                newActiveId = updatedResumes.length > 0 ? updatedResumes[0].id : undefined;
            }

            await chrome.storage.local.set({
                [STORAGE_KEY_RESUMES]: updatedResumes,
                [STORAGE_KEY_ACTIVE_ID]: newActiveId
            });

            setResumes(updatedResumes.map((r: any) => ({ id: r.id, fileName: r.fileName })));
            setActiveResumeId(newActiveId);
        }
    };

    return {
        resumes,
        activeResumeId,
        resumeData: activeResumeData,
        handleResumeSelect,
        handleUpload,
        handleDelete,
        loading
    };
}
