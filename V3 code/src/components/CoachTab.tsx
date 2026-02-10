import React, { useState, useEffect, useRef } from 'react';
import { Coach } from '@jobswyft/ui';
import { openAIService } from '@/services/openai';
import { JobData, ResumeData } from '@/types';

// Define Message interface locally (matches Coach component expectation)
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface CoachTabProps {
    jobData: JobData | null;
    resumeData: ResumeData | null;
    resumeContent: string | null;
}

export function CoachTab({ jobData, resumeData, resumeContent }: CoachTabProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const messageIdRef = useRef(0);

    // Check if coach should be locked (no job scanned)
    const isLocked = !jobData?.title;

    // Build context strings
    const jobContext = jobData
        ? `Title: ${jobData.title}\nCompany: ${jobData.company || 'Unknown'}\nLocation: ${jobData.location || 'Not specified'}\nDescription: ${jobData.description?.substring(0, 2000) || 'No description'}`
        : '';

    const resumeContextStr = resumeData
        ? `Name: ${resumeData.personalInfo?.fullName || 'Unknown'}\nSkills: ${resumeData.skills?.slice(0, 15).join(', ') || 'None listed'}\nExperience: ${resumeData.experience?.map((e: any) => `${e.title} at ${e.company}`).join(', ') || 'None listed'}`
        : '';


    const handleSendMessage = async (content: string) => {
        // Add user message
        const userMessage: Message = {
            id: `msg_${++messageIdRef.current}`,
            role: 'user',
            content,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        try {
            const response = await openAIService.coachChat(
                content,
                jobData?.title || '',
                jobData?.company || '',
                jobContext,
                resumeContextStr
            );

            const assistantMessage: Message = {
                id: `msg_${++messageIdRef.current}`,
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            const errorMessage: Message = {
                id: `msg_${++messageIdRef.current}`,
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please check your API key in settings.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-full">
            <Coach
                messages={messages}
                onSendMessage={handleSendMessage}
                isLocked={isLocked}
                isTyping={isTyping}
                job={jobData}
                resume={resumeData ? {
                    id: 'active',
                    fileName: 'Resume',
                    personalInfo: resumeData.personalInfo,
                    skills: resumeData.skills || [],
                    experience: resumeData.experience || [],
                    education: resumeData.education || []
                } : null}
                className="h-full"
            />
        </div>
    );
}
