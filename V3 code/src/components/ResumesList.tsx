import React, { useEffect, useState } from 'react';
import { ResumeCard } from '@jobswyft/ui';
import { storageService } from '@/services/storage';
import { Resume, ResumeData } from '@/types';
import { resumeParserService } from '@/services/resume-parser';

export const ResumesList = () => {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [activeResumeId, setActiveResumeId] = useState<string>('');
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isResumeCardOpen, setIsResumeCardOpen] = useState(false);

    useEffect(() => {
        loadResumes();
    }, []);

    const loadResumes = async () => {
        const storedResumes = await storageService.getResumes();
        setResumes(storedResumes);
        const activeId = await storageService.getActiveResumeId();
        if (activeId) setActiveResumeId(activeId);
        else if (storedResumes.length > 0) setActiveResumeId(storedResumes[0].id);
    };

    const handleResumeSelect = async (id: string) => {
        setActiveResumeId(id);
        await storageService.setActiveResumeId(id);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setParseError(null);

        try {
            const apiKey = await storageService.getOpenAIKey();
            const model = await storageService.getOpenAIModel();

            // Read file as base64
            const fileDataPromise = new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Parse resume
            const [parseResult, fileData] = await Promise.all([
                resumeParserService.parseResume(file, apiKey || null, model || 'gpt-4o-mini'),
                fileDataPromise
            ]);

            if (parseResult.data) {
                // Ensure ID is unique
                const newResume: Resume = {
                    id: parseResult.id || crypto.randomUUID(),
                    fileName: parseResult.fileName || file.name,
                    content: parseResult.content || '',
                    data: parseResult.data as ResumeData,
                    timestamp: parseResult.timestamp || new Date().toISOString(),
                    fileData: fileData,
                    fileType: file.type
                };

                const updatedResumes = [newResume, ...resumes];
                await storageService.saveResumes(updatedResumes);
                setResumes(updatedResumes);
                handleResumeSelect(newResume.id);
            }
        } catch (error) {
            console.error('Resume parsing error:', error);
            setParseError(error instanceof Error ? error.message : 'Failed to parse resume');
        } finally {
            setIsParsing(false);
            // Reset input value to allow uploading same file again
            e.target.value = '';
        }
    };

    const handleUpload = async () => {
        // Trigger file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = (e) => {
            handleFileUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
        };
        input.click();
    };

    const handleDelete = async (id: string) => {
        const updatedResumes = resumes.filter(r => r.id !== id);
        await storageService.saveResumes(updatedResumes);
        setResumes(updatedResumes);
        if (activeResumeId === id && updatedResumes.length > 0) {
            handleResumeSelect(updatedResumes[0].id);
        }
    };

    const activeResume = resumes.find(r => r.id === activeResumeId);

    // Map resumes to summary format expected by ResumeCard
    const resumeSummaries = resumes.map(r => ({
        id: r.id,
        fileName: r.fileName
    }));

    return (
        <ResumeCard
            resumes={resumeSummaries}
            activeResumeId={activeResumeId}
            resumeData={activeResume?.data}
            onResumeSelect={handleResumeSelect}
            onUpload={handleUpload}
            onDelete={handleDelete}
            isParsing={isParsing}
            parseError={parseError || undefined}
            variant="default"
            isCollapsible={!!activeResumeId}
            isOpen={isResumeCardOpen}
            onOpenChange={setIsResumeCardOpen}
        />
    );
};
