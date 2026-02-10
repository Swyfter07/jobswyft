"""AI prompts for resume parsing."""

RESUME_PARSE_PROMPT = """You are a resume parser. Extract structured data from the following resume text.

Return ONLY valid JSON with this exact structure (use null for missing fields):

{{
  "contact": {{
    "first_name": "string or null",
    "last_name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin_url": "string or null"
  }},
  "summary": "professional summary or objective statement, or null",
  "experience": [
    {{
      "title": "job title",
      "company": "company name",
      "start_date": "start date as string",
      "end_date": "end date as string or null if current",
      "description": "job description or responsibilities"
    }}
  ],
  "education": [
    {{
      "degree": "degree name",
      "institution": "school name",
      "graduation_year": "year as string"
    }}
  ],
  "skills": ["skill1", "skill2", "skill3"]
}}

Important rules:
- Return ONLY the JSON object, no markdown code blocks or extra text
- Use null for any field you cannot find
- For dates, use the format found in the resume (e.g., "Jan 2020", "2020-01", "2020")
- Extract all work experiences and education entries found
- Skills should be a flat array of strings

Resume text:
{resume_text}"""


MATCH_ANALYSIS_PROMPT = """You are a career advisor analyzing how well a candidate's resume matches a job posting.

Analyze the resume data and job description, then return ONLY valid JSON with this exact structure:

{{
  "match_score": <integer 0-100>,
  "strengths": [
    "<strength 1: specific skill/experience that matches a job requirement>",
    "<strength 2>",
    "<strength 3>"
  ],
  "gaps": [
    "<gap 1: specific requirement in job not found in resume>",
    "<gap 2>"
  ],
  "recommendations": [
    "<recommendation 1: actionable advice to address gaps or highlight strengths>",
    "<recommendation 2>"
  ]
}}

Scoring criteria:
- 90-100: Excellent match, meets most requirements with standout qualifications
- 75-89: Strong match, meets core requirements with some transferable skills
- 60-74: Moderate match, meets some requirements but has notable gaps
- 40-59: Weak match, significant gaps in required skills/experience
- 0-39: Poor match, does not meet most basic requirements

Important rules:
- Return ONLY the JSON object, no markdown code blocks or extra text
- match_score must be an integer between 0 and 100
- strengths: 3-5 specific, concrete items that align with job requirements
- gaps: 2-4 specific requirements or preferences not met
- recommendations: 2-3 actionable suggestions for the candidate

RESUME DATA:
{resume_data}

JOB DESCRIPTION:
{job_description}"""


def format_match_prompt(resume_data: dict, job_description: str) -> str:
    """Format the match analysis prompt with resume data and job description.

    Args:
        resume_data: Parsed resume data dictionary.
        job_description: Job posting description text.

    Returns:
        Formatted prompt string.
    """
    import json

    resume_str = json.dumps(resume_data, indent=2)
    return MATCH_ANALYSIS_PROMPT.format(
        resume_data=resume_str,
        job_description=job_description,
    )



COVER_LETTER_PROMPT = """You are a professional cover letter writer. Generate a compelling, tailored cover letter based on the candidate's resume and the job description.

Return ONLY valid JSON with this exact structure:

{{
  "content": "string containing the complete cover letter text",
  "tokens_used": <integer token count>
}}

**Tone: {tone}**

Tone characteristics:
- **confident**: Assertive language, highlight achievements with impact metrics, show expertise boldly
- **friendly**: Warm opening, personable language, show genuine interest in company culture
- **enthusiastic**: Express passion for role, show excitement about opportunity, energetic but professional
- **professional**: Traditional business tone, balanced, formal but approachable
- **executive**: Strategic thinking, leadership emphasis, high-level impact focus

**Custom Instructions:**
{custom_instructions_text}

{feedback_instructions}

**Cover Letter Structure:**
1. **Opening paragraph**: Express specific interest in the role and company
2. **Body (2-3 paragraphs)**:
   - Highlight relevant experience matching job requirements
   - Show understanding of company/role
   - Demonstrate value you'll bring
3. **Closing paragraph**: Express enthusiasm, call to action, professional sign-off

**Quality Guidelines:**
- Length: 250-400 words (ideal for hiring managers)
- Use specific examples from the resume
- Address key requirements from the job description
- Sound natural and authentic, not generic AI-generated
- Professional formatting with clear paragraphs
- No placeholders like [Your Name] - leave signature line blank

**IMPORTANT RULES:**
- Return ONLY the JSON object, no markdown code blocks or extra text
- content must be the complete, ready-to-use cover letter
- Preserve paragraph breaks with \\n\\n
- tokens_used should be approximate count of tokens in the response
- Do NOT include date, salutation, or signature - just the letter content
- Follow the specified tone closely

RESUME DATA:
{resume_data}

JOB DESCRIPTION:
{job_description}"""


def format_cover_letter_prompt(
    resume_data: dict,
    job_description: str,
    tone: str,
    custom_instructions: str | None = None,
    feedback: str | None = None,
    previous_content: str | None = None,
) -> str:
    """Format the cover letter prompt with all parameters.

    Args:
        resume_data: Parsed resume data dictionary.
        job_description: Job posting description text.
        tone: Desired tone (confident, friendly, enthusiastic, professional, executive).
        custom_instructions: Optional user instructions to incorporate.
        feedback: Optional feedback for regeneration.
        previous_content: Previous cover letter content (required with feedback).

    Returns:
        Formatted prompt string.
    """
    import json

    resume_str = json.dumps(resume_data, indent=2)
    
    # Format custom instructions text
    if custom_instructions:
        custom_instructions_text = f"User wants you to: {custom_instructions}"
    else:
        custom_instructions_text = "None - generate based on resume and job match only."
    
    # Format feedback instructions
    if feedback and previous_content:
        feedback_instructions = f"""**REGENERATION MODE - Revise based on feedback:**

Previous cover letter:
{previous_content}

User feedback: {feedback}

Instructions: Revise the previous cover letter based on the feedback above. Maintain the original structure unless the feedback requests changes. Make targeted improvements while keeping what worked well."""
    else:
        feedback_instructions = ""
    
    return COVER_LETTER_PROMPT.format(
        tone=tone,
        custom_instructions_text=custom_instructions_text,
        feedback_instructions=feedback_instructions,
        resume_data=resume_str,
        job_description=job_description,
    )


# Platform-specific length constraints
PLATFORM_LENGTHS = {
    "linkedin": 300,
    "email": 1500,
    "twitter": 280,
}


ANSWER_PROMPT = """You are an expert career advisor helping a job applicant craft a compelling answer to an application question.

## Resume Data:
{resume_data}

## Job Description:
{job_description}

## Application Question:
{question}

## Length Constraint:
Generate an answer of approximately {max_length} characters.
- 150 chars: Brief, direct response
- 300 chars: Concise with one supporting point
- 500 chars: Standard with 2-3 supporting points
- 1000 chars: Detailed with examples and context

{feedback_instructions}

## Output Format:
Return ONLY valid JSON with this exact structure:
{{
  "content": "Your generated answer here",
  "tokens_used": <integer estimate of tokens in your response>
}}

Do not include any text outside the JSON object."""


def format_answer_prompt(
    resume_data: dict,
    job_description: str,
    question: str,
    max_length: int,
    feedback: str | None = None,
    previous_content: str | None = None,
) -> str:
    """Format the answer prompt with all parameters.

    Args:
        resume_data: Parsed resume data dictionary.
        job_description: Job description text.
        question: The application question to answer.
        max_length: Target character length (150, 300, 500, 1000).
        feedback: Optional feedback for regeneration.
        previous_content: Previous answer (required with feedback).

    Returns:
        Formatted prompt string.
    """
    import json

    resume_str = json.dumps(resume_data, indent=2)

    # Format feedback instructions
    if feedback and previous_content:
        feedback_instructions = f"""**REGENERATION MODE - Revise based on feedback:**

Previous answer:
{previous_content}

User feedback: {feedback}

Instructions: Revise the previous answer based on the feedback above. Maintain the original structure unless the feedback requests changes. Make targeted improvements while keeping what worked well."""
    else:
        feedback_instructions = ""

    return ANSWER_PROMPT.format(
        resume_data=resume_str,
        job_description=job_description,
        question=question,
        max_length=max_length,
        feedback_instructions=feedback_instructions,
    )


OUTREACH_PROMPT = """You are an expert career coach helping a job seeker craft a professional outreach message.

## Resume Data:
{resume_data}

## Job Description:
{job_description}

## Message Parameters:
- Recipient Type: {recipient_type}
- Platform: {platform}
- Recipient Name: {recipient_name}

## Recipient Type Guidelines:
- recruiter: Professional, concise, highlight relevant experience, focus on fit
- hiring_manager: Technical depth, show understanding of challenges, demonstrate value
- referral: Warm tone, mention connection context, ask for guidance/introduction

## Platform Constraints:
- linkedin: Max 300 characters, punchy and professional
- email: Full email with subject line, 150-300 words, include greeting and sign-off
- twitter: Max 280 characters, casual professional, direct

{feedback_instructions}

## Output Format:
Return ONLY valid JSON with this exact structure:
{{
  "content": "Your generated message here",
  "tokens_used": <integer estimate of tokens in your response>
}}

Do not include any text outside the JSON object.

## Important Notes:
- If recipient_name is provided, include a personalized greeting (e.g., "Hi Sarah,")
- If recipient_name is NOT provided, start directly with the opening statement (no greeting, no placeholder like "[Name]")
- For email platform, include "Subject: " line at the beginning of content"""


COACH_CHAT_SYSTEM_PROMPT = """You are a career coach assistant for Jobswyft, an AI-powered job application tool. You help job seekers with career advice, interview preparation, application strategy, and professional development.

Your personality:
- Supportive and encouraging, but honest
- Practical and actionable advice
- Concise responses (2-4 paragraphs max)
- Use the job and resume context when available to give personalized advice

{job_context_section}

{resume_context_section}

Guidelines:
- If the user asks about a specific job, reference the job context
- If the user asks about their qualifications, reference the resume context
- Give specific, actionable advice rather than generic platitudes
- If you don't have enough context, ask clarifying questions
- Keep responses focused and practical"""


def format_coach_chat_prompt(
    message: str,
    job_context: dict | None = None,
    resume_context: str | None = None,
    history: list[dict] | None = None,
) -> tuple[str, list[dict]]:
    """Format the coach chat prompt with context.

    Args:
        message: User's message.
        job_context: Optional job context dict with title, company, description.
        resume_context: Optional resume summary text.
        history: Optional chat history list of {role, content} dicts.

    Returns:
        Tuple of (system_prompt, messages_list).
    """
    # Build job context section
    if job_context:
        title = job_context.get("title", "Unknown")
        company = job_context.get("company", "Unknown")
        description = job_context.get("description", "")[:2000]
        job_context_section = f"""Current Job Context:
- Title: {title}
- Company: {company}
- Description: {description}"""
    else:
        job_context_section = "No job context available."

    # Build resume context section
    if resume_context:
        resume_context_section = f"Resume Summary:\n{resume_context[:2000]}"
    else:
        resume_context_section = "No resume context available."

    system_prompt = COACH_CHAT_SYSTEM_PROMPT.format(
        job_context_section=job_context_section,
        resume_context_section=resume_context_section,
    )

    # Build messages list from history
    messages: list[dict] = []
    if history:
        for entry in history[-10:]:  # Last 10 messages
            role = entry.get("role", "user")
            content = entry.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    # Add current user message
    messages.append({"role": "user", "content": message})

    return system_prompt, messages


JOB_EXTRACT_PROMPT = """You are a job posting data extractor. Extract structured job information from the following HTML content.

Return ONLY valid JSON with this exact structure (use null for missing fields):

{{
  "title": "job title or null",
  "company": "company name or null",
  "description": "full job description text or null",
  "location": "job location or null",
  "salary": "salary range or null",
  "employment_type": "Full-time, Part-time, Contract, etc. or null"
}}

Important rules:
- Return ONLY the JSON object, no markdown code blocks or extra text
- Use null for any field you cannot find
- For title, extract the specific job title (e.g., "Senior Software Engineer"), not the page title
- For company, extract the hiring company name
- For description, extract the full job description including responsibilities, requirements, and qualifications
- For location, include city, state/country, and remote status if mentioned
- For salary, include the full range if available (e.g., "$120,000 - $160,000/year")
- For employment_type, normalize to standard values (Full-time, Part-time, Contract, Internship, Temporary)
- If partial_data is provided, use it to fill in or validate fields you're less confident about

Source URL: {source_url}

{partial_data_section}

HTML Content:
{html_content}"""


def format_job_extract_prompt(
    html_content: str,
    source_url: str,
    partial_data: dict | None = None,
) -> str:
    """Format the job extraction prompt.

    Args:
        html_content: Cleaned HTML from the job page.
        source_url: URL of the job page.
        partial_data: Optional partial data from CSS/OG extraction.

    Returns:
        Formatted prompt string.
    """
    import json

    if partial_data and any(v for v in partial_data.values() if v):
        partial_str = f"Partial data already extracted (use to validate/supplement):\n{json.dumps(partial_data, indent=2)}"
    else:
        partial_str = "No partial data available."

    return JOB_EXTRACT_PROMPT.format(
        source_url=source_url,
        partial_data_section=partial_str,
        html_content=html_content,
    )


def format_outreach_prompt(
    resume_data: dict,
    job_description: str,
    recipient_type: str,
    platform: str,
    recipient_name: str | None = None,
    feedback: str | None = None,
    previous_content: str | None = None,
) -> str:
    """Format the outreach prompt with all parameters.

    Args:
        resume_data: Parsed resume data dictionary.
        job_description: Job description text.
        recipient_type: Type of recipient (recruiter, hiring_manager, referral).
        platform: Target platform (linkedin, email, twitter).
        recipient_name: Optional recipient name for personalized greeting.
        feedback: Optional feedback for regeneration.
        previous_content: Previous message (required with feedback).

    Returns:
        Formatted prompt string.
    """
    import json

    resume_str = json.dumps(resume_data, indent=2)

    # Format recipient name
    if recipient_name:
        name_str = recipient_name
    else:
        name_str = "Not provided - do NOT use any placeholder or generic greeting"

    # Format feedback instructions
    if feedback and previous_content:
        feedback_instructions = f"""**REGENERATION MODE - Revise based on feedback:**

Previous message:
{previous_content}

User feedback: {feedback}

Instructions: Revise the previous message based on the feedback above. Maintain the platform constraints and recipient type tone. Make targeted improvements while keeping what worked well."""
    else:
        feedback_instructions = ""

    return OUTREACH_PROMPT.format(
        resume_data=resume_str,
        job_description=job_description,
        recipient_type=recipient_type,
        platform=platform,
        recipient_name=name_str,
        feedback_instructions=feedback_instructions,
    )
