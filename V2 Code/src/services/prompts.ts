export const PROMPTS = {
  resume_parsing: {
    system:
      "You are a resume parsing assistant. Extract data into structured JSON. Do not summarize. Maintain original content.",
    user: (truncatedText: string) => `
Extract the following from this resume text into valid JSON format:
1. "personal_info" (object with "name", "email", "phone", "linkedin", "portfolio")
2. "summary" (concise 2-3 sentence overview)
3. "skills" (array of strings)
4. "experience" (array of objects with "title", "company", "dates", "description")
    - "description": Keep bullet points, details, and metrics.
    - "dates": start - end.
5. "education" (array of objects with "school", "degree", "dates")
6. "projects" (array of objects with "name", "technologies", "description")
    - Extract significant projects listed.
    - "technologies": string or array of used tech.
    - "description": brief summary of what was built/accomplished.
7. "certifications" (array of objects with "name", "issuer", "date")

RESUME TEXT:
${truncatedText}

JSON Output only. No markdown.`,
  },

  match_analysis: {
    system:
      "You are an experienced recruiter and job coach. Understand the requirements and give targeted insights and guidance. Verify matches strictly to avoid hallucinations.",
    user: (resumeText: string, jobTitle: string, jobDesc: string) => `
You are analyzing a potential mismatch. Be skeptical.

JOB DESCRIPTION (THE GROUND TRUTH):
${jobTitle}
${jobDesc.substring(0, 4000)}

RESUME (THE CANDIDATE):
${resumeText.substring(0, 4000)}

Task:
Return a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<1 sentence explanation>",
  "matchedSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "tips": ["tip1", "tip2", "tip3"]
}

Rules for missingSkills:
- Identify hard skills explicitly required in the Job Description that are NOT in the Resume.
- DEEP SEMANTIC CHECK: Do not perform a simple keyword search. Understand the concept.
  - If the JD asks for "CI/CD" and the Resume has "Jenkins pipelines", that IS a match. Do NOT list it as missing.
  - If the JD asks for "Leadership" and the Resume shows "Managed a team of 5", that IS a match.
- List only skills where the candidate truly lacks the core competency.
- Rank by importance (Deal-breakers first). Max 5.

Return ONLY valid JSON. No markdown, no code fences.`,
  },

  job_description_extraction: {
    system:
      "You are a job posting extraction expert. Extract ONLY the job description content from messy web page text. Be precise and thorough.",
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

Return ONLY the extracted job description text. No explanations or commentary.`,
  },

  answer_question: {
    system: (tone: string) =>
      `You are a job applicant assistant. Generate natural, personalized answers to job application questions based on the candidate's resume. Write in first person as the candidate. Use a ${tone} tone throughout your response.`,
    user: (
      question: string,
      resumeSummary: string,
      jobTitle: string,
      companyName: string,
      length: string,
      tone: string
    ) => {
      const lengthGuide: Record<string, string> = {
        short: "1-2 sentences only. Be very concise.",
        medium: "2-4 sentences. Balanced detail.",
        long: "4-6 sentences. Provide thorough detail and examples.",
      };
      const toneGuide: Record<string, string> = {
        professional: "formal and business-appropriate",
        friendly: "warm and approachable while still professional",
        confident: "assertive and self-assured without being arrogant",
        enthusiastic: "excited and passionate about the opportunity",
      };
      return `
Generate an answer to this job application question.

QUESTION: ${question}

CANDIDATE BACKGROUND:
${resumeSummary}

JOB CONTEXT:
- Position: ${jobTitle || "Not specified"}
- Company: ${companyName || "Not specified"}

STYLE REQUIREMENTS:
- Length: ${lengthGuide[length] || lengthGuide.medium}
- Tone: ${toneGuide[tone] || toneGuide.professional}

INSTRUCTIONS:
1. Be specific and reference real experience from the candidate's background
2. Tailor to the job and company if context is provided
3. Write in first person ("I...")
4. Be genuine, not generic
5. Match the requested length and tone exactly

Return ONLY the answer text. No quotes, no preamble.`;
    },
  },

  cover_letter: {
    system: (tone: string) =>
      `You are a professional cover letter writer. Write compelling, personalized cover letters that highlight the candidate's relevant experience. Use a ${tone} tone. Write in first person.`,
    user: (
      resumeData: string,
      jobDescription: string,
      jobTitle: string,
      companyName: string,
      length: string,
      tone: string
    ) => {
      const wordCount: Record<string, string> = {
        short: "150 words",
        medium: "250 words",
        long: "400 words",
        very_long: "600 words",
      };
      const toneDesc: Record<string, string> = {
        professional: "formal and business-appropriate",
        friendly: "warm and approachable",
        confident: "assertive and self-assured",
        enthusiastic: "excited and passionate",
      };
      return `
Write a cover letter for this job application.

CANDIDATE RESUME:
${resumeData}

JOB DESCRIPTION:
${jobDescription || "Not provided"}

JOB DETAILS:
- Position: ${jobTitle || "Not specified"}
- Company: ${companyName || "Not specified"}

REQUIREMENTS:
- Length: Approximately ${wordCount[length] || wordCount.medium}
- Tone: ${toneDesc[tone] || toneDesc.professional}

STRUCTURE:
1. Salutation: "Dear Hiring Team at ${companyName || "the company"},"
2. Opening paragraph: Express interest and mention the specific role
3. Body paragraph(s): Connect your experience to job requirements (At least 2 Experiences)
4. Closing paragraph: Call to action and thank you
5. Sign-off: "Sincerely," followed by candidate's name in the next line (ONLY ONCE)

INSTRUCTIONS:
- Reference specific skills/experience from the resume that match the job
- Be specific about why this company/role is a good fit
- Write naturally, not robotically
- Do NOT include date or address headers (only the salutation)
- Do NOT output any HTML tags or markdown formatting
- Return ONLY plain text

Return ONLY the cover letter text.`;
    },
  },

  regenerate_with_feedback: {
    system:
      "You are a helpful assistant that refines text based on user feedback. Maintain the same general structure and purpose while incorporating the requested changes.",
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

Return the refined ${contentType}:`,
  },

  outreach_message: {
    system:
      "You are a professional career coach and networking expert. You write concise, high-converting cold emails and LinkedIn messages. Your goal is to get a response.",
    user: (
      resumeData: string,
      jobTitle: string,
      companyName: string,
      managerName: string,
      type: string,
      tone: string
    ) => {
      const typeRules: Record<string, string> = {
        linkedin_connection:
          " STRICT LIMIT: MAX 300 CHARACTERS. Be extremely concise. No subject line.",
        linkedin_inmail:
          "Subject line required. Body max 1500 chars (keep it under 1000).",
        cold_email: "Subject line required. Professional email format.",
        follow_up: "Subject line required (RE: ...). Brief check-in.",
      };
      return `
Draft a ${type.replace("_", " ")} to a hiring manager/recruiter.

CONTEXT:
- Sender (Candidate): See resume below
- Recipient: ${managerName || "Hiring Manager"} (at ${companyName || "the company"})
- Role Interest: ${jobTitle || "Open Role"}
- Message Type: ${type} (${typeRules[type]})
- Tone: ${tone}

CANDIDATE RESUME SUMMARY:
${resumeData}

INSTRUCTIONS:
1. Write in first person.
2. Mention 1 specific relevant achievement/skill from resume that prompts interest.
3. Be strictly professional but distinct.
4. Call to Action: appropriate for the platform (e.g., "connect", "chat briefly").
5. ${type === "linkedin_connection" ? "CRITICAL: MUST BE UNDER 300 CHARACTERS TOTAL. NO SUBJECT LINE." : 'Include a compelling Subject Line at the top.'}

OUTPUT FORMAT:
${type !== "linkedin_connection" ? "Subject: [Subject Line]\n\n[Body]" : "[Body]"}`;
    },
  },
} as const;
