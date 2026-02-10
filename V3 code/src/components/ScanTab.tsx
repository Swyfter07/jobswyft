import React, { useEffect, useState } from 'react';
import { JobCard, JobData, MatchData } from '@jobswyft/ui';
import { Button } from '@jobswyft/ui';
import { openAIService } from '@/services/openai';
import { storageService } from '@/services/storage'; // Import storageService
import { detectJobSite } from '@/utils/job-detection';

interface ScanTabProps {
    jobData: JobData | null;
    onJobUpdate: (data: JobData | null) => void;
    resumeContent?: string | null;
    autoAnalysis?: boolean;
}

export const ScanTab = ({ jobData, onJobUpdate, resumeContent, autoAnalysis = true }: ScanTabProps) => {

    const [isScanning, setIsScanning] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const [isAutoScanEnabled, setIsAutoScanEnabled] = useState(true);

    useEffect(() => {
        // Load initial auto-scan setting
        storageService.getAutoScanEnabled().then(setIsAutoScanEnabled);
        checkCurrentTab();

        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes['job_jet_auto_scan_request']?.newValue) {
                // Check if auto-scan is enabled before proceeding
                storageService.getAutoScanEnabled().then(enabled => {
                    if (enabled) {
                        const request = changes['job_jet_auto_scan_request'].newValue;
                        handleScan(request.url);
                    }
                });
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);
        return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }, []);

    const checkCurrentTab = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) setCurrentUrl(tab.url);
    };

    const handleScan = async (url: string = currentUrl) => {
        setIsScanning(true);
        setMatchData(null); // Clear previous match
        try {
            // Get current tab and send message to content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) {
                console.error('No active tab found');
                return;
            }

            // Send message to content script to scrape the page
            const scrapedData = await chrome.tabs.sendMessage(tab.id, { action: 'SCAN_PAGE' });

            if (scrapedData && scrapedData.title) {
                const newJobData = {
                    title: scrapedData.title || 'Unknown Title',
                    company: scrapedData.company || 'Unknown Company',
                    location: scrapedData.location || '',
                    description: scrapedData.description || '',
                    url: url,
                    status: 'saved' as const,
                    postDate: scrapedData.postedDate || new Date().toISOString(),
                    salary: scrapedData.salary,
                    employmentType: scrapedData.employmentType,
                };

                onJobUpdate(newJobData);
            } else {
                console.warn('No job data scraped from page');
                onJobUpdate(null);
            }
        } catch (error) {
            console.error('Scan failed:', error);
            // If content script not loaded, show error but don't crash
            onJobUpdate(null);
        } finally {
            setIsScanning(false);
        }
    };

    // Effect to handle auto-analysis when dependencies change
    useEffect(() => {
        const analyzeJob = async () => {
            // Trigger if:
            // 1. Auto-analysis is enabled
            // 2. We have resume content
            // 3. We have job description
            // 4. No previous match data exists (or we want to re-analyze? for now stay safe)
            // 5. Not currently analyzing
            // 6. Not currently scanning (wait for scan to finish and update jobData)
            if (autoAnalysis && resumeContent && jobData?.description && !matchData && !isAnalyzing && !isScanning) {
                console.log('[JobSwyft] Triggering auto-analysis...', {
                    autoAnalysis,
                    hasResume: !!resumeContent,
                    hasJobDesc: !!jobData.description,
                    isScanning
                });

                setIsAnalyzing(true);
                try {
                    const analysis = await openAIService.analyzeMatch(
                        resumeContent,
                        jobData.title,
                        jobData.description
                    );
                    setMatchData(analysis);
                } catch (err) {
                    console.error("Match analysis failed", err);
                } finally {
                    setIsAnalyzing(false);
                }
            }
        };

        analyzeJob();
    }, [autoAnalysis, resumeContent, jobData, matchData, isAnalyzing, isScanning]);

    const toggleAutoScan = async () => {
        const newState = !isAutoScanEnabled;
        setIsAutoScanEnabled(newState);
        await storageService.setAutoScanEnabled(newState);
    };

    if (jobData) {
        return (
            <JobCard
                job={jobData}
                match={matchData || undefined}
                isScanning={isScanning}
                isAnalyzing={isAnalyzing}
                onScan={() => handleScan(currentUrl)}
                isAutoScanEnabled={isAutoScanEnabled}
                onToggleAutoScan={toggleAutoScan}
                onClear={() => onJobUpdate(null)}
            />
        );
    }

    // Loading state while scanning
    if (isScanning) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 h-full">
                <div className="bg-muted/30 p-4 rounded-full">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-search animate-pulse"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Scanning Page...</h3>
                    <p className="text-sm text-muted-foreground">Detecting job information from the current page.</p>
                </div>
                <div className="h-1 w-32 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full animate-[slidingBar_1.5s_ease-in-out_infinite]" />
                </div>
            </div>
        );
    }

    // Empty state - no job detected
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 h-full">
            <div className="bg-muted/30 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-muted-foreground"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold text-lg">No Job Detected</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">Navigate to a job post on LinkedIn, Indeed, or other supported sites, then scan to analyze.</p>
            </div>
            <Button onClick={() => handleScan()} disabled={!currentUrl}>
                Scan This Page
            </Button>
        </div>
    );
};
