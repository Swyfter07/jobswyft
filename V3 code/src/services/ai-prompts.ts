/**
 * AI Prompt Templates
 * Ported from V1 prompts.js
 */

export interface ResumeParsingPrompt {
    system: string;
    user: (truncatedText: string) => string;
}

export interface MatchAnalysisPrompt {
    system: string;
    user: (resumeText: string, jobTitle: string, jobDesc: string) => string;
}

export interface JobDescriptionExtractionPrompt {
    system: string;
    user: (rawText: string, pageTitle: string) => string;
}

export interface AnswerQuestionPrompt {
    system: (tone: string) => string;
    user: (question: string, resumeSummary: string, jobTitle: string, companyName: string, jobDescription: string, length: string, tone: string) => string;
}

export interface CoverLetterPrompt {
    system: (tone: string) => string;
    user: (resumeData: string, jobDescription: string, jobTitle: string, companyName: string, length: string, tone: string) => string;
}

export interface RegeneratePrompt {
    system: string;
    user: (originalContent: string, feedback: string, contentType: string) => string;
}

export interface OutreachMessagePrompt {
    system: string;
    user: (resumeData: string, jobTitle: string, companyName: string, managerName: string, type: string, tone: string) => string;
}

export const AI_PROMPTS = {
    // Prompt for Resume Parsing (Smart Blocks)
    resume_parsing: {
        system: "You are a resume parsing assistant. Extract data into structured JSON. EXTRACT VERBATIM TEXT from the resume. DO NOT SUMMARIZE or rewrite content unless explicitly asked. Maintain original formatting and details.",
        user: (truncatedText: string) => `
          Extract the following from this resume text into valid JSON format:
          1. "personalInfo" (object with "fullName", "email", "phone", "linkedin", "website", "location")
              - Extract standard contact details.
              - "linkedin" should be full URL.
              - "website" is personal website URL or portfolio.
          2. "summary" (professional summary as a string)
          3. "skills" (array of strings)
              - EXTRACT ALL individual technical skills, tools, and languages found in the resume. 
              - Do not group them (e.g., instead of "Java/Python", list "Java", "Python").
          4. "experience" (array of objects with "title", "company", "startDate", "endDate", "description", "highlights")
              - "startDate" and "endDate": Use "MM/YYYY" or "Present".
              - "description": Brief summary of the role if present (optional).
              - "highlights": Array of strings. EXTRACT ALL BULLET POINTS VERBATIM. Do not summarize or combine them.
          5. "education" (array of objects with "school", "degree", "startDate", "endDate", "gpa", "highlights")
          6. "projects" (array of objects with "name", "techStack", "description", "url")
              - "techStack": Array of strings (technologies used).
              - "description": Brief summary of what was built/accomplished.
              - "url": Link to project if available.

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
          1. Match Score (0-100%) and a 1-sentence explanation.
          2. Matched Skills (List UP TO 10):
              - Identify hard skills explicitly required in the **Job Description** that ARE PRESENT in the Resume.
              - DEEP SEMANTIC CHECK: Understand the *concept*, don't just match keywords.
                - If the JD asks for "CI/CD" and the Resume has "Jenkins pipelines", that IS a match.
                - If the JD asks for "Leadership" and the Resume shows "Managed a team of 5", that IS a match.
          3. Critical Missing Skills (List UP TO 10):
              - Identify hard skills explicitly required in the **Job Description** that are **NOT** in the Resume.
              - Apply the same deep semantic check. List only skills where the candidate truly lacks the core competency.
              - Rank by importance (Deal-breakers first).
          4. Three specific improvement tips.

          Format as valid JSON with this structure:
          {
            "score": number (0-100),
            "explanation": "1 short sentence summary",
            "matchedSkills": ["skill1", "skill2", ...] (up to 10 matched skills),
            "missingSkills": ["skill1", "skill2", ...] (up to 10 critical missing skills),
            "tips": ["tip1", "tip2", "tip3"] (3 actionable improvement tips)
          }

          IMPORTANT:
          - "matchedSkills" must only include SKILLS FROM THE JD that ARE in the resume.
          - "missingSkills" must only include SKILLS FROM THE JD that are MISSING in the resume. 
          - Do not list soft skills unless critical.
          - Return ONLY valid JSON. No markdown formatting.
      `
    },

    // Prompt for AI-Powered Job Description Extraction (Fallback)
    job_description_extraction: {
        system: "You are a job posting extraction expert. Extract ONLY the job description content from messy web page text. Be precise and thorough.",
        user: (rawText: string, pageTitle: string) => `
          Extract the complete job description from this raw webpage text.

          PAGE TITLE: ${pageTitle}

          RAW PAGE TEXT (may contain navigation, ads, and other noise):
          ${rawText.substring(0, 8000)}

          Instructions:
          1. Find and extract ONLY the job posting content.
          2. Include: Job title, responsibilities, requirements, qualifications, benefits, and company info if present.
          3. EXCLUDE: Navigation menus, ads, "similar jobs", login prompts, cookie notices, footer links.
          4. Preserve the original formatting with line breaks and bullet points.
          5. If you cannot find a clear job description, respond with: "NO_JOB_DESCRIPTION_FOUND"

          Return ONLY the extracted job description text. No explanations or commentary.
      `
    },

    // Prompt for AI-Powered Answer Generation (Non-Standard Questions)
    answer_question: {
        system: (tone: string) => `You are a job applicant assistant. Generate natural, personalized answers to job application questions based on the candidate's resume and job description. Write in first person as the candidate. Use a ${tone} tone throughout your response.`,
        user: (question: string, resumeSummary: string, jobTitle: string, companyName: string, jobDescription: string, length: string, tone: string) => {
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

          JOB DESCRIPTION:
          ${jobDescription ? jobDescription.substring(0, 3000) : 'Not provided'}

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

    // Regenerate with Feedback prompt
    regenerate_with_feedback: {
        system: "You are a helpful assistant that refines text based on user feedback. Maintain the same general structure and purpose while incorporating the requested changes.",
        user: (originalContent: string, feedback: string, contentType: string) => `
          Refine the following ${contentType} based on the user's feedback.

          ORIGINAL ${contentType.toUpperCase()}:
          ${originalContent}

          USER FEEDBACK:
          ${feedback}

          INSTRUCTIONS:
          1. Keep the same general purpose and structure
          2. Apply the user's feedback precisely
          3. Maintain first-person voice
          4. Keep approximately the same length unless asked to change it
          5. Return ONLY the refined ${contentType}, no preamble or explanation

          Return the refined ${contentType}:
      `
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

    // Career Coach Chat Prompt
    coach_chat: {
        system: (jobTitle: string, companyName: string) => `You are a helpful, knowledgeable career coach. You're having a conversation with a job seeker about their application to ${companyName || 'a company'} for the ${jobTitle || 'position'} role.

Your role is to:
- Answer questions about the job, company, or application process
- Provide interview preparation tips specific to this role
- Help craft answers to potential interview questions
- Give honest, actionable feedback on their fit for the role
- Suggest ways to improve their candidacy

Keep responses concise (2-4 sentences unless asked for more detail). Be encouraging but realistic. Reference specific details from the job description and resume when relevant.`,
        user: (message: string, jobContext: string, resumeContext: string) => `
CURRENT JOB CONTEXT:
${jobContext || 'No job currently scanned'}

CANDIDATE'S RESUME SUMMARY:
${resumeContext || 'No resume selected'}

USER MESSAGE:
${message}

Provide a helpful, focused response.`
    }
};

