import { useState, useEffect } from 'react';

import { JobData } from '@/components/custom/job-card';

export function useJobTracking() {
    const [savedJobs, setSavedJobs] = useState<JobData[]>([]);
    const [currentJob, setCurrentJob] = useState<JobData | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);

    useEffect(() => {
        // Load saved jobs
        const loadJobs = async () => {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const result = await chrome.storage.local.get(['savedJobs']);
                if (result.savedJobs) {
                    setSavedJobs(result.savedJobs);
                }
            }
        };
        loadJobs();
    }, []);

    const saveJob = async (job: JobData) => {
        const newJob = { ...job, id: job.id || Date.now().toString(), status: 'saved' as const };
        const updatedJobs = [...savedJobs, newJob];
        setSavedJobs(updatedJobs);

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ savedJobs: updatedJobs });
        }
    };

    const updateJobStatus = async (id: string, status: JobData['status']) => {
        const updatedJobs = savedJobs.map(job =>
            job.id === id ? { ...job, status } : job
        );
        setSavedJobs(updatedJobs);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ savedJobs: updatedJobs });
        }
    };

    const scanJob = async () => {
        if (typeof chrome === 'undefined' || !chrome.tabs) return;

        setIsScanning(true);
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab?.id) {
                console.log("scanJob: Sending message to tab", tab.id);

                // Send message to content script
                chrome.tabs.sendMessage(tab.id, { action: "scan_job" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("scanJob: Error sending message:", chrome.runtime.lastError);
                        // Likely content script not injected or page not ready
                        setCurrentJob(null);
                    } else {
                        console.log("scanJob: Message sent, response:", response);

                        if (response && response.title) {
                            // Check if already saved
                            const isSaved = savedJobs.some(j => j.company === response.company && j.title === response.title);

                            const scannedJob: JobData = {
                                ...response,
                                id: isSaved ? savedJobs.find(j => j.company === response.company && j.title === response.title)?.id : undefined,
                                status: isSaved ? 'saved' : undefined
                            };

                            setCurrentJob(scannedJob);
                        } else {
                            console.warn("scanJob: No valid job data in response");
                            setCurrentJob(null);
                        }
                    }
                    setIsScanning(false);
                });
            } else {
                console.warn("scanJob: No active tab found");
                setCurrentJob(null);
                setIsScanning(false);
            }
        } catch (error) {
            console.error("scanJob: Unexpected error:", error);
            setCurrentJob(null);
            setIsScanning(false);
        }
    };

    // Listen for background updates (auto-scan)
    useEffect(() => {
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local' && changes.scannedJob) {
                const newJob = changes.scannedJob.newValue as JobData;
                if (newJob) {
                    // Check if saved
                    const isSaved = savedJobs.some(j => j.company === newJob.company && j.title === newJob.title);
                    setCurrentJob({
                        ...newJob,
                        id: isSaved ? savedJobs.find(j => j.company === newJob.company && j.title === newJob.title)?.id : undefined,
                        status: isSaved ? 'saved' : undefined
                    });
                }
                setIsScanning(false);
            }
        };

        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener(handleStorageChange);
        }

        return () => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.onChanged.removeListener(handleStorageChange);
            }
        };
    }, [savedJobs]);

    return {
        savedJobs,
        currentJob,
        setCurrentJob,
        saveJob,
        updateJobStatus,
        scanJob,
        isScanning
    };
}
