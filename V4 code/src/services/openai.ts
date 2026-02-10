import OpenAI from 'openai';
import { storageService } from './storage';
import { AI_PROMPTS } from './ai-prompts';

export interface MatchResult {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    summary: string;
}

export const openAIService = {
    async getClient(): Promise<OpenAI> {
        const apiKey = await storageService.getOpenAIKey();

        if (!apiKey) {
            throw new Error("OpenAI API Key is missing. Please add it in settings.");
        }

        return new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Required for extension environment
        });
    },

    async complete(
        prompt: string,
        systemPrompt: string,
        temp: number = 0.7
    ): Promise<string> {
        const client = await this.getClient();
        const model = await storageService.getOpenAIModel();

        try {
            const completion = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: temp,
            });

            return completion.choices[0]?.message?.content || '';
        } catch (error: any) {
            console.error("OpenAI API Error:", error);
            throw new Error(error.message || "Failed to call OpenAI API");
        }
    },

    /**
     * Analyze resume-job match using AI
     * Returns MatchData compatible with JobCard component
     */
    async analyzeMatch(
        resumeText: string,
        jobTitle: string,
        jobDescription: string
    ): Promise<MatchResult> {
        const systemPrompt = AI_PROMPTS.match_analysis.system;
        const userPrompt = AI_PROMPTS.match_analysis.user(resumeText, jobTitle, jobDescription);

        const rawResponse = await this.complete(userPrompt, systemPrompt, 0.4);

        // Parse JSON response
        try {
            // Clean any markdown formatting
            const cleanJson = rawResponse.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Convert to UI-compatible MatchData format
            // The prompt returns: score, explanation, missingSkills, tips
            // The UI expects: score, matchedSkills, missingSkills, summary
            return {
                score: parsed.score ?? 0,
                matchedSkills: parsed.matchedSkills || [], // May be empty if prompt doesn't return them
                missingSkills: parsed.missingSkills || [],
                summary: parsed.explanation || parsed.summary || ''
            };
        } catch (e) {
            console.error('[JobSwyft] Failed to parse match analysis:', e, rawResponse);
            return {
                score: 0,
                matchedSkills: [],
                missingSkills: [],
                summary: 'Failed to analyze match. Please try again.'
            };
        }
    },

    /**
     * Coach chat for career advice with job/resume context
     */
    async coachChat(
        message: string,
        jobTitle: string,
        companyName: string,
        jobContext: string,
        resumeContext: string
    ): Promise<string> {
        const systemPrompt = AI_PROMPTS.coach_chat.system(jobTitle, companyName);
        const userPrompt = AI_PROMPTS.coach_chat.user(message, jobContext, resumeContext);

        return await this.complete(userPrompt, systemPrompt, 0.7);
    },

    /**
     * Generate AI answer for a job application question
     * Uses resume and job context to create personalized responses
     */
    async answerQuestion(
        question: string,
        resumeSummary: string,
        jobTitle: string,
        companyName: string,
        jobDescription: string = '',
        length: 'short' | 'medium' | 'long' = 'medium',
        tone: 'professional' | 'friendly' | 'confident' | 'enthusiastic' = 'professional'
    ): Promise<string> {
        const systemPrompt = AI_PROMPTS.answer_question.system(tone);
        const userPrompt = AI_PROMPTS.answer_question.user(
            question,
            resumeSummary,
            jobTitle,
            companyName,
            jobDescription,
            length,
            tone
        );


        return await this.complete(userPrompt, systemPrompt, 0.7);
    },


    /**
     * Segment form fields using AI (Low Token)
     */
    async segmentFields(fields: any[]): Promise<Record<string, string>> {
        // Minimal payload to save tokens
        const simplified = fields.map(f => ({
            id: f.id,
            // If the content script defaulted to "Question" or "Attach", clear it so AI isn't biased
            label: (f.label === 'Question' || f.label === 'Attach') ? '' : (f.label || '').substring(0, 50),
            placeholder: (f.placeholder || '').substring(0, 30),
            name: (f.name || '').substring(0, 30),
            type: f.type
        }));

        const systemPrompt = AI_PROMPTS.field_segmentation.system;
        const userPrompt = AI_PROMPTS.field_segmentation.user(JSON.stringify(simplified));

        try {
            const rawResponse = await this.complete(userPrompt, systemPrompt, 0.3); // Low temp for classification
            const cleanJson = rawResponse.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error('[JobSwyft] AI Segmentation failed:', e);
            return {};
        }
    }
};

