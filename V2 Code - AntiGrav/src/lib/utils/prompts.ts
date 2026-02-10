
export const JOB_JET_PROMPTS = {
    // Prompt for Resume Parsing (Smart Blocks)
    resume_parsing: {
        system: "You are a resume parsing assistant. Extract data into structured JSON. Do not summarize. Maintain original content.",
        user: (truncatedText: string) => `
            Extract the following from this resume text into valid JSON format:
            1. "personal_info" (object with "name", "email", "phone", "linkedin", "portfolio")
                - Extract standard contact details.
                - "linkedin" should be full URL.
                - "portfolio" is personal website URL.
            2. "summary" (professional summary as a string)
            3. "skills" (array of strings)
                - List individual technical skills, tools, and languages found in the resume.
            4. "experience" (array of objects with "title", "company", "dates", "description")
                - IMPORTANT: For "description", include ALL bullet points and responsibilities from the resume.
                - key formatting: Use plain text bullet points (e.g., "- Led team...") and newlines. Do not lose details.
            5. "education" (array of objects with "school", "degree", "dates")
            6. "projects" (array of objects with "name", "technologies", "description")
                - Extract significant projects listed.
                - "technologies": string or array of used tech.
                - "description": brief summary of what was built/accomplished.

            RESUME TEXT:
            ${truncatedText}

            JSON Output only. No markdown.
        `
    },

    // Prompt for Match Analysis (AI Insights)
    match_analysis: {
        system: "You are an experienced recruiter and job coach. Understand the requirements and give targeted insights and guidance. Verify matches strictly to avoid hallucinations.",
        user: (resumeText: string, jobTitle: string, jobDesc: string) => `
            You are analyzing a potential mismatch. Be skeptical.

            JOB DESCRIPTION (THE GROUND TRUTH):
            ${jobTitle}
            ${jobDesc.substring(0, 4000)}

            RESUME (THE CANDIDATE):
            ${resumeText.substring(0, 4000)}

            Task:
            1. Match Score (0-100%).
            2. 1-sentence explanation.
            3. Critical Missing Skills (List UP TO 5):
                - Identify hard skills explicitly required in the **Job Description** that are **NOT** in the Resume.
                - DEEP SEMANTIC CHECK: Do not perform a simple keyword search. Understand the *concept*.
            4. Three specific improvement tips.

            Return a valid JSON object with the following structure:
            {
                "score": number, // 0-100
                "explanation": "string",
                "missingSkills": ["string", "string"],
                "tips": ["string", "string"]
            }

            JSON Output only. No markdown.
        `
    },

    // Prompt for AI-Powered Answer Generation (Non-Standard Questions)
    answer_question: {
        system: (tone: string) => `You are a job applicant assistant. Generate natural, personalized answers to job application questions based on the candidate's resume. Write in first person as the candidate. Use a ${tone} tone throughout your response.`,
        user: (question: string, resumeSummary: string, jobTitle: string, companyName: string, length: string, tone: string) => {
            const lengthGuide: Record<string, string> = {
                short: '1-2 sentences only. Be very concise.',
                medium: '2-4 sentences. Balanced detail.',
                long: '4-6 sentences. Provide thorough detail and examples.'
            };
            const toneGuide: Record<string, string> = {
                professional: 'formal and business-appropriate',
                friendly: 'warm and approachable while still professional',
                confident: 'assertive and self-assured without being arrogant',
                enthusiastic: 'excited and passionate about the opportunity'
            };
            return `
            Generate an answer to this job application question.

            QUESTION: ${question}

            CANDIDATE BACKGROUND:
            ${resumeSummary}

            JOB CONTEXT:
            - Position: ${jobTitle || 'Not specified'}
            - Company: ${companyName || 'Not specified'}

            STYLE REQUIREMENTS:
            - Length: ${lengthGuide[length] || lengthGuide.medium}
            - Tone: ${toneGuide[tone] || toneGuide.professional}

            INSTRUCTIONS:
            1. Be specific and reference real experience from the candidate's background
            2. Tailor to the job and company if context is provided
            3. Write in first person ("I...")
            4. Be genuine, not generic
            5. Match the requested length and tone exactly

            Return ONLY the answer text. No quotes, no preamble.
            `;
        }
    },

    // Cover Letter Generation Prompt
    cover_letter: {
        system: (tone: string) => `You are a professional cover letter writer. Write compelling, personalized cover letters that highlight the candidate's relevant experience. Use a ${tone} tone. Write in first person.`,
        user: (resumeData: string, jobDescription: string, jobTitle: string, companyName: string, length: string, tone: string) => {
            const wordCount: Record<string, string> = {
                short: '150 words',
                medium: '250 words',
                long: '400 words',
                very_long: '600 words'
            };
            const toneDesc: Record<string, string> = {
                professional: 'formal and business-appropriate',
                friendly: 'warm and approachable',
                confident: 'assertive and self-assured',
                enthusiastic: 'excited and passionate'
            };
            return `
            Write a cover letter for this job application.

            CANDIDATE RESUME:
            ${resumeData}

            JOB DESCRIPTION:
            ${jobDescription || 'Not provided'}

            JOB DETAILS:
            - Position: ${jobTitle || 'Not specified'}
            - Company: ${companyName || 'Not specified'}

            REQUIREMENTS:
            - Length: Approximately ${wordCount[length] || wordCount.medium}
            - Tone: ${toneDesc[tone] || toneDesc.professional}

            STRUCTURE:
            1. Salutation: "Dear Hiring Team at ${companyName || 'the company'},"
            2. Opening paragraph: Express interest and mention the specific role
            3. Body paragraph(s): Connect your experience to job requirements (Atleast 2 Experiences)
            4. Closing paragraph: Call to action and thank you
            5. Sign-off: "Sincerely," followed by candidate's name in the next line (ONLY ONCE)

            INSTRUCTIONS:
            - Reference specific skills/experience from the resume that match the job
            - Be specific about why this company/role is a good fit
            - Write naturally, not robotically
            - Do NOT include date or address headers (only the salutation)
            - Do NOT output any HTML tags or markdown formatting
            - Return ONLY plain text

            Return ONLY the cover letter text.
            `;
        }
    },

    // Outreach Message Prompt (Email / InMail / Connection Request)
    outreach_message: {
        system: "You are a professional career coach and networking expert. You write concise, high-converting cold emails and LinkedIn messages. Your goal is to get a response.",
        user: (resumeData: string, jobTitle: string, companyName: string, managerName: string, type: string, tone: string) => {
            const typeRules: Record<string, string> = {
                linkedin_connection: ' STRICT LIMIT: MAX 300 CHARACTERS. Be extremely concise. No subject line.',
                linkedin_inmail: 'Subject line required. Body max 1500 chars (keep it under 1000).',
                cold_email: 'Subject line required. Professional email format.',
                follow_up: 'Subject line required (RE: ...). Brief check-in.'
            };
            return `
            Draft a ${type.replace('_', ' ')} to a hiring manager/recruiter.

            CONTEXT:
            - Sender (Candidate): See resume below
            - Recipient: ${managerName || 'Hiring Manager'} (at ${companyName || 'the company'})
            - Role Interest: ${jobTitle || 'Open Role'}
            - Message Type: ${type} (${typeRules[type]})
            - Tone: ${tone}

            CANDIDATE RESUME SUMMARY:
            ${resumeData}

            INSTRUCTIONS:
            1. Write in first person.
            2. Mention 1 specific relevant achievement/skill from resume that prompts interest.
            3. Be strictly professional but distinct.
            4. Call to Action: appropriate for the platform (e.g., "connect", "chat briefly").
            5. ${type === 'linkedin_connection' ? 'CRITICAL: MUST BE UNDER 300 CHARACTERS TOTAL. NO SUBJECT LINE.' : 'Include a compelling Subject Line at the top.'}

            OUTPUT FORMAT:
            ${type !== 'linkedin_connection' ? 'Subject: [Subject Line]\n\n[Body]' : '[Body]'}
            `;
        }
    },

    // Career Coach Prompt
    career_coach: {
        system: "You are an expert career coach and interview prep assistant. You are helpful, encouraging, and provide tactical advice. You have access to the candidate's resume and the job description they are applying for.",
        user: (resumeData: string, jobTitle: string, companyName: string, jobDescription: string, history: string) => `
            You are helping a candidate apply for:
            - Role: ${jobTitle}
            - Company: ${companyName}
            
            JOB DESCRIPTION:
            ${jobDescription.substring(0, 3000)}
            
            CANDIDATE RESUME:
            ${resumeData.substring(0, 3000)}
            
            CONVERSATION HISTORY:
            ${history}
            
            Respond to the user's latest message.
            - If they ask for interview questions, give 3 relevant behavioral or technical questions based on the JD.
            - If they ask about salary, allow general advice but disclaim you don't have real-time market data unless it's in the JD.
            - If they feel discouraged, be motivating.
            - Keep responses concise (under 200 words) unless deeper explanation is requested.
        `
    }
};
