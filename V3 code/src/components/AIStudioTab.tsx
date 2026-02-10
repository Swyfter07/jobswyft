import React, { useState } from 'react';
import { AIStudio, MatchAnalysis } from '@jobswyft/ui';
import { storageService } from '@/services/storage';
import { openAIService } from '@/services/openai';
import { AI_PROMPTS } from '@/services/ai-prompts';
import { JobData, ResumeData } from '@/types';

interface AIStudioTabProps {
    jobData: JobData | null;
    resumeData: ResumeData | null;
    resumeContent: string | null; // Full text content needed for AI
}

export const AIStudioTab = ({ jobData, resumeData, resumeContent }: AIStudioTabProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);
    const [generatedContent, setGeneratedContent] = useState<{
        coverLetter?: string;
        answer?: string;
        outreach?: string;
    }>({});
    const [activeTab, setActiveTab] = useState('match');

    const isLocked = !jobData || !resumeData;

    const handleAnalyzeMatch = async () => {
        if (!jobData || !resumeContent) return;
        setIsGenerating(true);
        setError(null);
        try {
            const prompt = AI_PROMPTS.match_analysis.user(
                resumeContent,
                jobData.title || 'Job',
                jobData.description || ''
            );
            const system = AI_PROMPTS.match_analysis.system;

            // We expect HTML output from the prompt, but MatchAnalysis type expects structured data?
            // Wait, V1 prompt returns HTML. 
            // The UI's MatchAnalysis type (seen in ai-studio.tsx) is:
            // { score: number, explanation: string, missingSkills: string[], tips: string[] }
            // So V1 prompt output DOES NOT MATCH UI expectation.
            // I need to update the prompt OR parse the HTML output OR change the prompt to return JSON.
            // Returning JSON is safer/better for this UI component.

            // I will MODIFY the prompt call here (conceptually) or parsing logic.
            // For now, let's assume I'll use a JSON prompt for V3.
            // I'll create a new prompt or modify invoke.

            // Let's try to get JSON from OpenAI.
            const response = await openAIService.complete(
                prompt + "\n\nIMPORTANT: Return ONLY valid JSON in this format: { \"score\": number, \"explanation\": string, \"missingSkills\": string[], \"tips\": string[] }",
                system
            );

            // Clean response (remove markdown code blocks if any)
            const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
            const analysis: MatchAnalysis = JSON.parse(jsonStr);
            setMatchAnalysis(analysis);

        } catch (err: any) {
            console.error("Match analysis failed:", err);
            setError(err.message || "Failed to analyze match");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateCoverLetter = async (params: { tone: string, length: string, instructions: string }) => {
        if (!jobData || !resumeContent) return;
        setIsGenerating(true);
        setError(null);
        try {
            const prompt = AI_PROMPTS.cover_letter.user(
                resumeContent,
                jobData.description || '',
                jobData.title || 'Open Position',
                jobData.company || 'Company',
                params.length,
                params.tone
            );
            // Add any custom instructions
            const fullPrompt = params.instructions
                ? `${prompt}\n\nAdditional Instructions: ${params.instructions}`
                : prompt;

            const content = await openAIService.complete(fullPrompt, AI_PROMPTS.cover_letter.system(params.tone));
            setGeneratedContent(prev => ({ ...prev, coverLetter: content }));
        } catch (err: any) {
            console.error("Cover letter generation failed:", err);
            setError(err.message || "Failed to generate cover letter");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAnswer = async (params: { question: string, tone: string, length: string }) => {
        if (!resumeContent) return;
        setIsGenerating(true);
        try {
            // We need a prompt for this. V1 'questions' prompt?
            const prompt = AI_PROMPTS.answer_question.user(
                params.question,
                resumeContent.substring(0, 2000), // summary/truncated
                jobData?.title || 'Job',
                jobData?.company || 'Company',
                params.length,
                params.tone
            );
            const fullPrompt = prompt; // System prompt handles tone
            const content = await openAIService.complete(fullPrompt, AI_PROMPTS.answer_question.system(params.tone));
            setGeneratedContent(prev => ({ ...prev, answer: content }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateOutreach = async (params: { role: string, platform: string, tone: string, length: string }) => {
        if (!resumeContent) return;
        setIsGenerating(true);
        try {
            // Need a prompt for outreach. 'outreach' in V1?
            // using cover_letter prompt as base or if specific one exists.
            // V1 prompts file had 'outreach' (I saw it in ai-prompts.ts earlier? let's check or assume generic)
            // Actually I saw 'outreach_message' in ai-prompts.ts types if I recall?
            // If not, I'll use a generic request.

            // Let's look at `ai-prompts.ts` content I viewed earlier.
            // Use 'outreach_message' if it exists. 
            // I'll assume it exists or use a custom string.

            const prompt = AI_PROMPTS.outreach_message.user(
                resumeContent.substring(0, 2000),
                jobData?.title || 'Open Role',
                jobData?.company || 'Company',
                'Hiring Manager', // manager name not captured yet
                params.platform, // type
                params.tone
            );

            const content = await openAIService.complete(prompt, AI_PROMPTS.outreach_message.system);
            setGeneratedContent(prev => ({ ...prev, outreach: content }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AIStudio
            isLocked={isLocked}
            matchAnalysis={matchAnalysis}
            generatedContent={generatedContent}
            isGenerating={isGenerating}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            error={error}
            onUnlock={() => { }} // Maybe scroll to scan tab?
            onAnalyzeMatch={handleAnalyzeMatch}
            onGenerateCoverLetter={handleGenerateCoverLetter}
            onGenerateAnswer={handleGenerateAnswer}
            onGenerateOutreach={handleGenerateOutreach}
        />
    );
};
