import { useState } from 'react';

export function useAI() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    const analyzeJob = async (jobDescription: string, resumeContent: string) => {
        setIsAnalyzing(true);
        try {
            // Simulate AI analysis
            await new Promise(resolve => setTimeout(resolve, 2000));

            const result = {
                matchScore: 85,
                strengths: ["Experience with React", "Product sense"],
                weaknesses: ["No strict typing experience"],
                suggestion: "Highlight your TypeScript projects."
            };

            setAnalysisResult(result);
            return result;
        } catch (error) {
            console.error("AI Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return {
        isAnalyzing,
        analysisResult,
        analyzeJob
    };
}
