# Story 4.2: Answer & Outreach Generation API

Status: done

## Story

As a **user**,
I want **to generate answers to application questions and recruiter outreach messages**,
So that **I can complete applications faster and reach out to hiring teams professionally**.

## Acceptance Criteria

### AC1: Generate Application Question Answer

**Given** an authenticated user with an active resume and a job context
**When** a request is made to `POST /v1/ai/answer`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "question": "Why do you want to work at Acme Corp?",
  "max_length": 500,
  "ai_provider": "claude"
}
```
**Then** the AI generates a tailored answer within 5 seconds (NFR2)
**And** response returns:
```json
{
  "success": true,
  "data": {
    "content": "I'm drawn to Acme Corp's mission to...",
    "ai_provider_used": "claude",
    "tokens_used": 450
  }
}
```
**And** content is NOT stored on server (FR36)
**And** usage balance is decremented by 1

### AC2: Answer Length Control

**Given** `max_length` is provided
**When** generating answer
**Then** AI generates answer that respects the character limit
**And** supported lengths are: 150 (short), 300 (medium), 500 (standard), 1000 (detailed)

**Given** `max_length` is NOT provided
**When** generating answer
**Then** default to 500 characters (standard)

**Given** invalid `max_length` is provided
**When** request is validated
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message lists valid length options

### AC3: Regenerate Answer with Feedback (FR32)

**Given** a user wants to regenerate answer with feedback
**When** request includes `feedback` and `previous_content`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "question": "Why do you want to work at Acme Corp?",
  "feedback": "Make it more specific about the company's recent product launch",
  "previous_content": "I'm drawn to Acme Corp's mission..."
}
```
**Then** AI generates improved version based on feedback
**And** this counts as a new generation (decrements usage)

**Given** `feedback` is provided but `previous_content` is missing
**When** request is validated
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message: "previous_content required when providing feedback"

### AC4: Generate Outreach Message

**Given** an authenticated user wants to reach out to a recruiter/hiring manager
**When** a request is made to `POST /v1/ai/outreach`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "recipient_type": "recruiter",
  "recipient_name": "Sarah Chen",
  "platform": "linkedin",
  "ai_provider": "gpt"
}
```
**Then** the AI generates an outreach message within 5 seconds
**And** response returns:
```json
{
  "success": true,
  "data": {
    "content": "Hi Sarah,\n\nI came across the Senior Engineer role at Acme Corp...",
    "ai_provider_used": "gpt",
    "tokens_used": 380
  }
}
```
**And** content is NOT stored on server (FR36)
**And** usage balance is decremented by 1

### AC5: Recipient Name Handling

**Given** `recipient_name` is provided
**When** generating outreach message
**Then** message includes personalized greeting: "Hi {name},"

**Given** `recipient_name` is NOT provided
**When** generating outreach message
**Then** message starts directly with the opening statement (no greeting)
**And** NO placeholder text like "[Name]" or "Hi there" appears
**And** message is immediately copy-paste ready

### AC6: Recipient Type Adaptation

**Given** valid recipient types
**When** generating outreach
**Then** supported types are: `recruiter`, `hiring_manager`, `referral`
**And** message style adapts to recipient type:
- `recruiter`: Professional, concise, highlights relevant experience, focuses on fit for role
- `hiring_manager`: More technical depth, shows understanding of team challenges, demonstrates value-add
- `referral`: Warmer tone, mentions mutual connection context, asks for guidance/introduction

**Given** invalid `recipient_type`
**When** request is validated
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message lists valid recipient types

### AC7: Platform-Specific Formatting

**Given** valid platforms
**When** generating outreach
**Then** supported platforms are: `linkedin`, `email`, `twitter`
**And** message length/format adapts to platform constraints:
- `linkedin`: Connection request style, <300 characters for InMail intro
- `email`: Full professional email format, subject line included, 150-300 words
- `twitter`: Concise DM style, <280 characters, casual professional tone

**Given** invalid `platform`
**When** request is validated
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message lists valid platforms

### AC8: Regenerate Outreach with Feedback (FR34)

**Given** a user wants to regenerate outreach with feedback
**When** request includes `feedback` and `previous_content`:
```json
{
  "job_id": "uuid",
  "resume_id": "uuid",
  "recipient_type": "hiring_manager",
  "platform": "email",
  "feedback": "Make it shorter and mention my cloud migration experience",
  "previous_content": "Dear Ms. Chen,\n\nI am writing to express..."
}
```
**Then** AI generates improved version based on feedback
**And** this counts as a new generation (decrements usage)

### AC9: AI Provider Selection & Fallback

**Given** `ai_provider` is specified in request
**When** generating answer or outreach
**Then** use the specified provider (override user preference and system default)

**Given** `ai_provider` is NOT specified
**When** generating answer or outreach
**Then** use `profiles.preferred_ai_provider` if set, else default to Claude

**Given** the primary AI provider fails (500 error or timeout)
**When** the request is made
**Then** the system falls back to secondary provider
**And** response still succeeds (NFR31)
**And** failure is logged with provider name and error details

**Given** both AI providers fail
**When** the request is made
**Then** response returns `503` with error code `AI_PROVIDER_UNAVAILABLE`
**And** user's usage balance is NOT decremented (NFR24)

### AC10: Resume & Job Validation

**Given** user has no active resume and no `resume_id` provided
**When** requesting answer or outreach generation
**Then** response returns `400` with error code `VALIDATION_ERROR`
**And** message: "No resume selected. Upload or select a resume first."

**Given** `job_id` does not exist or belongs to another user
**When** requesting answer or outreach generation
**Then** response returns `404` with error code `JOB_NOT_FOUND`

**Given** `resume_id` does not exist or belongs to another user
**When** requesting answer or outreach generation
**Then** response returns `404` with error code `RESUME_NOT_FOUND`

### AC11: Usage Balance Check

**Given** user has zero remaining credits
**When** attempting to generate answer or outreach
**Then** response returns `422` with error code `CREDIT_EXHAUSTED`
**And** message: "You've used all your credits. Upgrade to continue."
**And** no AI call is made

### AC12: Unauthenticated Access

**Given** an unauthenticated request
**When** attempting to generate answer or outreach
**Then** response returns `401` with error code `AUTH_REQUIRED`

### AC13: Ephemeral Output (FR36)

**Given** any successful AI generation (answer or outreach)
**When** content is returned
**Then** content is NEVER persisted to backend storage
**And** no database record of generated content exists
**And** only usage event is recorded (operation type, not content)

---

## Tasks / Subtasks

### Task 1: Extend AI Provider Infrastructure (AC: #9) - INDEPENDENT

**Done when:** AI providers support answer and outreach generation

**🔴 CRITICAL - Return Type Pattern:**
- **Provider methods** return `Tuple[str, int]` → `(content, tokens_used)`
- **Factory methods** return `Tuple[str, int, str]` → `(content, tokens_used, provider_name)` - factory adds provider name

- [x] Add `generate_answer()` method to `AIProvider` base class in `app/services/ai/provider.py`:
  - Abstract method signature: `async def generate_answer(self, resume_data: dict, job_description: str, question: str, max_length: int, feedback: Optional[str] = None, previous_content: Optional[str] = None) -> Tuple[str, int]`
  - Returns: Tuple of (content: str, tokens_used: int)
- [x] Add `generate_outreach()` method to `AIProvider` base class:
  - Abstract method signature: `async def generate_outreach(self, resume_data: dict, job_description: str, recipient_type: str, platform: str, recipient_name: Optional[str] = None, feedback: Optional[str] = None, previous_content: Optional[str] = None) -> Tuple[str, int]`
  - Returns: Tuple of (content: str, tokens_used: int)
- [x] Add `answer_with_fallback()` method to `AIProviderFactory` in `app/services/ai/factory.py`:
  - Follow existing `cover_letter_with_fallback()` pattern exactly
  - Return tuple: `(content: str, tokens_used: int, provider_name: str)` - THREE values
- [x] Add `outreach_with_fallback()` method to `AIProviderFactory`:
  - Follow existing `cover_letter_with_fallback()` pattern exactly
  - Return tuple: `(content: str, tokens_used: int, provider_name: str)` - THREE values

### Task 2: Implement Claude Answer & Outreach Generation (AC: #1-#8) - DEPENDS ON: Task 1, Task 4

**Done when:** Claude provider generates answers and outreach messages

**AI Model:** `claude-sonnet-4-20250514` (matches Story 4.1)

- [x] Add `generate_answer()` method to `ClaudeProvider` in `app/services/ai/claude.py`:
  - Load prompt template from `prompts.py`
  - Parse structured JSON response
  - Timeout: 10 seconds (shorter content than cover letters)
- [x] Add `generate_outreach()` method to `ClaudeProvider`:
  - Load prompt template from `prompts.py`
  - Adapt output based on platform constraints
  - Timeout: 10 seconds
- [x] Add error handling matching existing patterns

### Task 3: Implement OpenAI Answer & Outreach Generation (AC: #9) - DEPENDS ON: Task 1, Task 4

**Done when:** GPT provider generates answers and outreach (fallback)

**AI Model:** `gpt-4o-mini` (matches Story 4.1)

- [x] Add `generate_answer()` method to `OpenAIProvider` in `app/services/ai/openai.py`:
  - Use same prompt template as Claude
  - Use `response_format={"type": "json_object"}` for structured output
  - Timeout: 10 seconds
- [x] Add `generate_outreach()` method to `OpenAIProvider`:
  - Use same prompt template as Claude
  - Timeout: 10 seconds
- [x] Add error handling matching existing patterns

### Task 4: Create Answer & Outreach Prompts (AC: #1-#8) - INDEPENDENT

**Done when:** Prompts produce contextual answers and professional outreach messages

- [x] Add `ANSWER_PROMPT` to `app/services/ai/prompts.py`:
  - Input variables: `{resume_data}`, `{job_description}`, `{question}`, `{max_length}`, `{feedback}`, `{previous_content}`
  - Output format: JSON with `content` (string), `tokens_used` (integer)
  - Include length constraint guidance for each max_length option
  - Works with both Claude and GPT
- [x] Add `format_answer_prompt(resume_data, job_description, question, max_length, feedback, previous_content) -> str` helper function
- [x] Add `OUTREACH_PROMPT` to `app/services/ai/prompts.py`:
  - Input variables: `{resume_data}`, `{job_description}`, `{recipient_type}`, `{platform}`, `{recipient_name}`, `{feedback}`, `{previous_content}`
  - Output format: JSON with `content` (string), `tokens_used` (integer)
  - Include recipient type style guidelines
  - Include platform-specific formatting rules
- [x] Add `format_outreach_prompt(resume_data, job_description, recipient_type, platform, recipient_name, feedback, previous_content) -> str` helper function
- [x] Add platform length constants:
  - `PLATFORM_LENGTHS = {"linkedin": 300, "email": 1500, "twitter": 280}`

### Task 5: Create Answer Service (AC: #1-#3, #9-#13) - DEPENDS ON: Task 1, Task 4

**Done when:** AnswerService orchestrates validation, AI calls, and usage tracking

- [x] Create `app/services/answer_service.py`
- [x] Add `_hash_id()` helper function (copy from `cover_letter_service.py`)
- [x] Import existing services: `UsageService`, `JobService`, `ResumeService`, `AIProviderFactory`
- [x] Add `generate_answer(user_id, job_id, resume_id, question, max_length, feedback, previous_content, ai_provider) -> dict` method:
  1. **Validate question:** Must be non-empty, max 2000 characters
  2. **Validate max_length:** Check against valid lengths [150, 300, 500, 1000], default to 500
  3. **Validate feedback/previous_content:** If feedback provided, previous_content required
  4. **Check credits:** `usage_service.check_credits(user_id)`
  5. **Validate resume:** Get resume via `resume_service.get_resume()` or `profiles.active_resume_id`
  6. **Validate job:** Get job via `job_service.get_job()`
  7. **Get user preference:** Query `profiles.preferred_ai_provider`
  8. **Generate answer:** Call `AIProviderFactory.answer_with_fallback()`
  9. **Record usage:** `usage_service.record_usage(user_id, "answer", provider_used, credits_used=1)`
  10. **Return:** `{"content": content, "ai_provider_used": provider_used, "tokens_used": tokens_used}`
- [x] Add privacy-safe logging using `_hash_id()`

### Task 6: Create Outreach Service (AC: #4-#9, #10-#13) - DEPENDS ON: Task 1, Task 4

**Done when:** OutreachService orchestrates validation, AI calls, and usage tracking

- [x] Create `app/services/outreach_service.py`
- [x] Add `_hash_id()` helper function (copy from `cover_letter_service.py`)
- [x] Import existing services: `UsageService`, `JobService`, `ResumeService`, `AIProviderFactory`
- [x] Add `generate_outreach(user_id, job_id, resume_id, recipient_type, platform, recipient_name, feedback, previous_content, ai_provider) -> dict` method:
  1. **Validate recipient_type:** Check against valid types ["recruiter", "hiring_manager", "referral"]
  2. **Validate platform:** Check against valid platforms ["linkedin", "email", "twitter"]
  3. **Validate feedback/previous_content:** If feedback provided, previous_content required
  4. **Check credits:** `usage_service.check_credits(user_id)`
  5. **Validate resume:** Get resume via `resume_service.get_resume()` or `profiles.active_resume_id`
  6. **Validate job:** Get job via `job_service.get_job()`
  7. **Get user preference:** Query `profiles.preferred_ai_provider`
  8. **Generate outreach:** Call `AIProviderFactory.outreach_with_fallback()`
  9. **Record usage:** `usage_service.record_usage(user_id, "outreach", provider_used, credits_used=1)`
  10. **Return:** `{"content": content, "ai_provider_used": provider_used, "tokens_used": tokens_used}`
- [x] Add privacy-safe logging using `_hash_id()`

### Task 7: Create API Endpoints & Models (AC: #1-#13) - DEPENDS ON: Task 5, Task 6

**Done when:** POST /v1/ai/answer and POST /v1/ai/outreach endpoints implemented

- [x] Add to `app/models/ai.py`:
  ```python
  from pydantic import BaseModel, Field, field_validator
  from typing import Optional, Literal
  from uuid import UUID

  class AnswerRequest(BaseModel):
      job_id: UUID
      resume_id: Optional[UUID] = None
      question: str = Field(..., min_length=1, max_length=2000)
      max_length: Literal[150, 300, 500, 1000] = 500
      feedback: Optional[str] = Field(None, max_length=2000)
      previous_content: Optional[str] = Field(None, max_length=5000)
      ai_provider: Optional[Literal["claude", "gpt"]] = None

      @field_validator("feedback")
      @classmethod
      def validate_feedback_requires_previous(cls, v, info):
          if v and not info.data.get("previous_content"):
              raise ValueError("previous_content required when providing feedback")
          return v

  class AnswerResponse(BaseModel):
      content: str
      ai_provider_used: str
      tokens_used: int

  class OutreachRequest(BaseModel):
      job_id: UUID
      resume_id: Optional[UUID] = None
      recipient_type: Literal["recruiter", "hiring_manager", "referral"]
      platform: Literal["linkedin", "email", "twitter"]
      recipient_name: Optional[str] = Field(None, max_length=100)
      feedback: Optional[str] = Field(None, max_length=2000)
      previous_content: Optional[str] = Field(None, max_length=5000)
      ai_provider: Optional[Literal["claude", "gpt"]] = None

      @field_validator("feedback")
      @classmethod
      def validate_feedback_requires_previous(cls, v, info):
          if v and not info.data.get("previous_content"):
              raise ValueError("previous_content required when providing feedback")
          return v

  class OutreachResponse(BaseModel):
      content: str
      ai_provider_used: str
      tokens_used: int
  ```
- [x] Add to `app/routers/ai.py`:
  - `POST /answer` endpoint (router prefix handles `/v1/ai`)
  - `POST /outreach` endpoint
  - Use `CurrentUser` dependency
  - Return `ok(response_data)`
- [x] Export new models in `app/models/__init__.py`

### Task 8: Add Tests (AC: #1-#13) - DEPENDS ON: All implementation tasks

**Done when:** All tests pass with `pytest`

- [x] Create `apps/api/tests/test_ai_answer.py`
- [x] Create `apps/api/tests/test_ai_outreach.py`
- [x] Mock AI providers (follow existing pattern from `test_ai_cover_letter.py`)
- [x] Answer test cases:
  - ✅ Successful generation with Claude (default)
  - ✅ Successful generation with GPT (explicit provider)
  - ✅ All max_length options work correctly
  - ✅ Regeneration with feedback works
  - ✅ Fallback from Claude to GPT on failure
  - ✅ Both providers fail → 503 AI_PROVIDER_UNAVAILABLE
  - ✅ Invalid max_length → 400 VALIDATION_ERROR
  - ✅ Empty question → 400 VALIDATION_ERROR
  - ✅ Feedback without previous_content → 400 VALIDATION_ERROR
  - ✅ No resume selected → 400 VALIDATION_ERROR
  - ✅ Job not found → 404 JOB_NOT_FOUND
  - ✅ Credit exhausted → 422 CREDIT_EXHAUSTED
  - ✅ Unauthenticated → 401 AUTH_REQUIRED
  - ✅ Usage recorded after success
  - ✅ Usage NOT recorded on failure
- [x] Outreach test cases:
  - ✅ Successful generation for all recipient_types
  - ✅ Successful generation for all platforms
  - ✅ With recipient_name includes personalized greeting
  - ✅ Without recipient_name no placeholder appears
  - ✅ Regeneration with feedback works
  - ✅ Fallback from Claude to GPT on failure
  - ✅ Both providers fail → 503 AI_PROVIDER_UNAVAILABLE
  - ✅ Invalid recipient_type → 400 VALIDATION_ERROR
  - ✅ Invalid platform → 400 VALIDATION_ERROR
  - ✅ Feedback without previous_content → 400 VALIDATION_ERROR
  - ✅ No resume selected → 400 VALIDATION_ERROR
  - ✅ Job not found → 404 JOB_NOT_FOUND
  - ✅ Credit exhausted → 422 CREDIT_EXHAUSTED
  - ✅ Unauthenticated → 401 AUTH_REQUIRED
  - ✅ Usage recorded after success
  - ✅ Usage NOT recorded on failure

### Task 9: Update OpenAPI Spec (AC: #1-#13) - DEPENDS ON: Task 7

**Done when:** OpenAPI spec includes answer and outreach endpoints

- [x] Add to `specs/openapi.yaml` under `/v1/ai` tag section:
  - `POST /v1/ai/answer` endpoint with full documentation
  - `POST /v1/ai/outreach` endpoint with full documentation
  - Add schemas:
    - `AnswerRequest`, `AnswerResponse`
    - `OutreachRequest`, `OutreachResponse`
  - [x] Error responses: 400, 401, 404, 422, 503
  - [x] Include request/response examples

---

## Dev Notes

### 🔴 CRITICAL: Existing Infrastructure to Reuse

Import and extend existing components - **DO NOT RECREATE**:

| Component | File | What to Do |
|-----------|------|-----------|
| AI Providers | `app/services/ai/claude.py`, `openai.py` | Add `generate_answer()` and `generate_outreach()` methods |
| Factory Pattern | `app/services/ai/factory.py` | Add `answer_with_fallback()` and `outreach_with_fallback()` |
| Services | `usage_service.py`, `job_service.py`, `resume_service.py` | Import and call existing methods |
| Exceptions | `app/core/exceptions.py` | Raise existing exception classes |
| Models | `app/models/base.py`, `app/models/ai.py` | Use `ok()` helper, add new models to `ai.py` |
| Router | `app/routers/ai.py` | Add endpoints to existing `/v1/ai` router |

### 🔴 CRITICAL: Exception Imports

```python
# Use these existing exceptions - DO NOT create new ones
from app.core.exceptions import (
    ValidationError,           # 400 - invalid input
    CreditExhaustedError,      # 422 - no credits
    JobNotFoundError,          # 404 - job doesn't exist
    ResumeNotFoundError,       # 404 - resume doesn't exist
    AIProviderUnavailableError, # 503 - both providers failed
)
```

### 🔴 CRITICAL: Validation Order (Performance-Optimized)

Services MUST validate in this order:
1. **Schema validation** (Pydantic - automatic, fast)
2. **Business validation** (lengths, enums - fast)
3. **Credit check** (fast DB query - fail fast before expensive operations)
4. **Resource validation** (resume, job exist - DB queries)
5. **AI generation** (expensive - only after all validations pass)
6. **Usage recording** (post-success only)

### 🟡 IMPORTANT: JSON Output Format

All AI prompts MUST instruct the model to return this exact JSON structure:

```json
{
  "content": "Generated answer or outreach text here...",
  "tokens_used": 450
}
```

**Both Claude and GPT must return this format.** OpenAI uses `response_format={"type": "json_object"}` to enforce JSON.

### 🔴 CRITICAL: Prompt Template Skeletons

**ANSWER_PROMPT skeleton** (add to `prompts.py`):
```python
ANSWER_PROMPT = """
You are an expert career advisor helping a job applicant craft a compelling answer to an application question.

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

Do not include any text outside the JSON object.
"""
```

**OUTREACH_PROMPT skeleton** (add to `prompts.py`):
```python
OUTREACH_PROMPT = """
You are an expert career coach helping a job seeker craft a professional outreach message.

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
"""
```

### Answer Generation Guidelines

**Question Types to Handle:**
1. **Why this company?** - Match company mission/values with user background
2. **Why this role?** - Connect skills/experience to role requirements
3. **Tell us about yourself** - Professional summary highlighting relevance
4. **Describe a challenge** - Draw from resume experience, STAR format
5. **What are your salary expectations?** - Professional deflection or range based on research
6. **Any questions for us?** - Thoughtful questions showing research

**Length Constraints:**
| max_length | Description | Use Case |
|------------|-------------|----------|
| 150 | Short | Quick text fields, tight character limits |
| 300 | Medium | Standard application questions |
| 500 | Standard | Detailed questions, "tell us more" prompts |
| 1000 | Detailed | Essay-style questions, complex scenarios |

### Outreach Message Guidelines

**Recipient Type Characteristics:**

| Type | Tone | Focus | Key Elements |
|------|------|-------|--------------|
| `recruiter` | Professional, efficient | Fit for role, availability | Clear ask, relevant experience, easy to respond |
| `hiring_manager` | Technical, strategic | Value-add, understanding of challenges | Domain expertise, specific contributions, curiosity |
| `referral` | Warm, appreciative | Connection context, guidance request | Mutual benefit, gratitude, clear but soft ask |

**Platform Constraints:** (Reference: Architecture doc - AI Operations section)

| Platform | Max Length | Format | Notes |
|----------|------------|--------|-------|
| `linkedin` | 300 chars | Connection request / InMail intro | Punchy, professional, clear value prop |
| `email` | ~1500 chars | Full email with subject line | Include subject, greeting, 2-3 paragraphs, sign-off |
| `twitter` | 280 chars | DM style | Casual professional, concise, direct |

**Platform Length Constants** (add to `prompts.py`):
```python
PLATFORM_LENGTHS = {
    "linkedin": 300,
    "email": 1500,
    "twitter": 280
}
```

**Email Format Example:**
```
Subject: [Generated subject line]

[Greeting if recipient_name provided]

[Body - 2-3 short paragraphs]

[Professional sign-off]
```

### 🔴 CRITICAL: AI Provider Resolution Reference

**Models Used (January 2026):**
| Provider | Model | Why |
|----------|-------|-----|
| Claude | `claude-sonnet-4-20250514` | Consistent with Story 4.1, excellent contextual generation |
| GPT | `gpt-4o-mini` | Cost-effective fallback, good quality |

**Resolution Order (MUST follow exactly):**
1. Request body `ai_provider` param (highest priority - explicit override)
2. User's `profiles.preferred_ai_provider` (user preference)
3. System default: `"claude"`

**Timeout Settings:**
- Answer generation: 10 seconds (shorter content)
- Outreach generation: 10 seconds (shorter content)
- max_tokens: 1500 for both (sufficient for all lengths)

### 🔴 CRITICAL: Usage Decrement Rules (NFR24)

| Scenario | Decrement? |
|----------|------------|
| Answer generation succeeds | ✅ Yes |
| Outreach generation succeeds | ✅ Yes |
| Balance exhausted (pre-check) | ❌ No |
| Validation error | ❌ No |
| All AI providers fail (503) | ❌ No |

**Usage must ONLY be recorded AFTER successful AI generation, never before.**

### Usage Recording

- Answer: `operation_type = "answer"`
- Outreach: `operation_type = "outreach"`
- Both count as 1 credit each (lighter than cover letters)

### Logging Pattern (Privacy-Safe)

```python
import hashlib

def _hash_id(uuid_str: str) -> str:
    """Hash UUID for privacy-safe logging."""
    return hashlib.sha256(uuid_str.encode()).hexdigest()[:16]

logger.info(f"Answer generation - user: {_hash_id(str(user_id))}, job: {_hash_id(str(job_id))}, max_length: {max_length}, provider: {provider}, duration: {duration_ms}ms")
logger.info(f"Outreach generation - user: {_hash_id(str(user_id))}, job: {_hash_id(str(job_id))}, recipient_type: {recipient_type}, platform: {platform}, provider: {provider}, duration: {duration_ms}ms")
```

### ℹ️ REFERENCE: Project Structure Notes

**New Files (4):**
- `apps/api/app/services/answer_service.py`
- `apps/api/app/services/outreach_service.py`
- `apps/api/tests/test_ai_answer.py`
- `apps/api/tests/test_ai_outreach.py`

**Modified Files (8):**
- `apps/api/app/services/ai/provider.py` - Add abstract `generate_answer()` and `generate_outreach()` methods
- `apps/api/app/services/ai/claude.py` - Add implementations
- `apps/api/app/services/ai/openai.py` - Add implementations
- `apps/api/app/services/ai/factory.py` - Add `answer_with_fallback()` and `outreach_with_fallback()` methods
- `apps/api/app/services/ai/prompts.py` - Add answer and outreach prompts + helpers + `PLATFORM_LENGTHS`
- `apps/api/app/models/ai.py` - Add request/response models
- `apps/api/app/models/__init__.py` - Export new models
- `apps/api/app/routers/ai.py` - Add `/answer` and `/outreach` endpoints
- `specs/openapi.yaml` - Add endpoints and schemas

### 🔴 CRITICAL: Previous Story Patterns to Follow

**From Story 4.1 (Cover Letter Generation) - MUST FOLLOW:**
1. Factory `*_with_fallback()` methods return `(content, tokens_used, provider_name)` - THREE values
2. Services import existing services (never recreate)
3. Privacy-safe logging with `_hash_id()` helper at module level
4. Pydantic `field_validator` with `@classmethod` for cross-field validation (feedback requires previous_content)
5. Consistent error handling via `register_exception_handlers()`
6. Test patterns: mock AI providers, test all validation paths, verify usage recording

**From Story 3.2 (Match Analysis) - MUST FOLLOW:**
1. Abstract methods in base provider class with `@abstractmethod` decorator
2. Concrete implementations in Claude/OpenAI providers with same signature
3. Prompt templates in `prompts.py` with `format_*_prompt()` helper functions

**Code Reference Files:**
- `apps/api/app/services/cover_letter_service.py` - Service pattern reference
- `apps/api/app/services/ai/factory.py` - Factory fallback pattern
- `apps/api/tests/test_ai_cover_letter.py` - Test mock pattern

### FR Coverage

| FR | Description | Implementation |
|----|-------------|----------------|
| FR31 | Generate answers to application questions | `POST /v1/ai/answer` |
| FR32 | Regenerate answers with feedback | `feedback` + `previous_content` params |
| FR33 | Generate outreach messages | `POST /v1/ai/outreach` |
| FR34 | Regenerate outreach with feedback | `feedback` + `previous_content` params |
| FR35 | Edit AI output before using | Frontend responsibility (output is editable text) |
| FR36 | AI outputs not stored on server | Ephemeral - only usage event recorded |
| FR37 | Copy to clipboard | Frontend responsibility |
| FR38 | Visual feedback on copy | Frontend responsibility |

### Testing Strategy

**Approach:**
- Mock AI provider calls (don't hit real APIs) - follow `test_ai_cover_letter.py` pattern
- Test all validation paths for both endpoints
- Separate test files for answer and outreach (keeps tests focused)

**🟡 IMPORTANT: Reuse Test Fixtures from `conftest.py`:**

```python
# Available fixtures (DO NOT recreate):
@pytest.fixture
def authenticated_user():
    """Returns mock user with valid credits and active resume"""

@pytest.fixture
def test_resume():
    """Returns mock resume with parsed_data JSON"""

@pytest.fixture
def test_job():
    """Returns mock job record with description"""

@pytest.fixture
def mock_ai_factory():
    """Mocks AIProviderFactory - set return values for testing"""
    # Example usage:
    # mock_ai_factory.answer_with_fallback.return_value = ("Generated answer", 450, "claude")
```

**Mock Pattern** (from `test_ai_cover_letter.py`):
```python
@pytest.fixture
def mock_answer_generation(mocker):
    """Mock the AI factory for answer generation"""
    mock = mocker.patch("app.services.answer_service.AIProviderFactory")
    mock.answer_with_fallback = AsyncMock(
        return_value=("Generated answer content", 450, "claude")
    )
    return mock
```

### References

**Source Documents:**
1. Epic: `_bmad-output/planning-artifacts/epics.md` - Lines 936-1044 (Story 4.2 definition)
2. Architecture: `_bmad-output/planning-artifacts/architecture.md` - AI Provider Architecture
3. Previous Story: `_bmad-output/implementation-artifacts/4-1-cover-letter-generation-api.md` - Pattern reference
4. PRD: `_bmad-output/planning-artifacts/prd.md` - FR31-FR38 definitions

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - Implementation proceeded without issues.

### Completion Notes List

- ✅ Task 1: Extended AI provider infrastructure with `generate_answer()` and `generate_outreach()` abstract methods in base class, added `answer_with_fallback()` and `outreach_with_fallback()` methods to factory
- ✅ Task 2: Implemented Claude answer and outreach generation with 10s timeout, JSON parsing, and error handling
- ✅ Task 3: Implemented OpenAI answer and outreach generation with `response_format={"type": "json_object"}`, matching Claude patterns
- ✅ Task 4: Created ANSWER_PROMPT and OUTREACH_PROMPT templates with helper functions and PLATFORM_LENGTHS constant
- ✅ Task 5: Created AnswerService with full validation pipeline, credit checking, and usage recording
- ✅ Task 6: Created OutreachService with recipient_type and platform validation, usage tracking
- ✅ Task 7: Added Pydantic models (AnswerRequest, AnswerResponse, OutreachRequest, OutreachResponse) and API endpoints
- ✅ Task 8: Created comprehensive test suites (40 tests total - 18 answer, 22 outreach) - all passing
- ✅ Task 9: Updated OpenAPI spec with full endpoint documentation and schemas
- ✅ All 141 tests pass (no regressions)

**Code Review Fixes:**
- ✅ Fixed Pydantic validators to use `@field_validator("feedback")` + `@classmethod` pattern for architectural consistency
- ✅ Optimized validation order in services - resource checks now happen before profile fetch (fail-fast optimization)
- ✅ Verified all model exports and OpenAPI documentation complete

### File List

**New Files (4):**
- `apps/api/app/services/answer_service.py`
- `apps/api/app/services/outreach_service.py`
- `apps/api/tests/test_ai_answer.py`
- `apps/api/tests/test_ai_outreach.py`

**Modified Files (8):**
- `apps/api/app/services/ai/provider.py` - Added `generate_answer()` and `generate_outreach()` abstract methods
- `apps/api/app/services/ai/claude.py` - Added answer and outreach implementations
- `apps/api/app/services/ai/openai.py` - Added answer and outreach implementations
- `apps/api/app/services/ai/factory.py` - Added `answer_with_fallback()` and `outreach_with_fallback()` methods
- `apps/api/app/services/ai/prompts.py` - Added ANSWER_PROMPT, OUTREACH_PROMPT, helpers, and PLATFORM_LENGTHS
- `apps/api/app/models/ai.py` - Added AnswerRequest, AnswerResponse, OutreachRequest, OutreachResponse
- `apps/api/app/models/__init__.py` - Exported new models
- `apps/api/app/routers/ai.py` - Added `/answer` and `/outreach` endpoints
- `specs/openapi.yaml` - Added full API documentation for new endpoints

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-31 | Story created with comprehensive context analysis. Includes: Epic/PRD requirements (FR31-FR38), Architecture patterns, Previous story learnings (AI provider architecture from 4.1, privacy-safe logging, validation patterns, factory fallback pattern), Complete technical specifications for answer generation with length control and outreach generation with recipient type and platform adaptation. | BMad Create Story Workflow |
| 2026-01-31 | **Validation Review Applied:** (1) Fixed Pydantic validator pattern from `model_validator` to `field_validator` with `@classmethod` for consistency with Story 4.1; (2) Added clarifying note about provider vs factory return types (2-tuple vs 3-tuple); (3) Added explicit JSON output format specification; (4) Added complete prompt template skeletons for ANSWER_PROMPT and OUTREACH_PROMPT; (5) Added exception imports reference; (6) Added validation order documentation; (7) Added test fixture references from conftest.py; (8) Added PLATFORM_LENGTHS constant; (9) Added priority markers (🔴 CRITICAL, 🟡 IMPORTANT, ℹ️ REFERENCE) throughout Dev Notes; (10) Added timeout settings and code reference files; (11) Fixed file paths to use full `apps/api/` prefix. | Validation Review |
| 2026-01-31 | **Story Implementation Complete:** Implemented all 9 tasks (Tasks 1-9). All acceptance criteria met: AC1-AC3 (answer generation with length control and feedback), AC4-AC8 (outreach generation with recipient types and platform adaptation), AC9 (AI provider selection and fallback), AC10-AC12 (validation and auth), AC13 (ephemeral output). 40 new tests added, all 141 tests pass. | Dev Agent |
| 2026-01-31 | **Code Review Fixes Applied:** (1) Fixed Pydantic validator pattern - changed from `@model_validator(mode="after")` to `@field_validator("feedback")` with `@classmethod` in AnswerRequest and OutreachRequest models for consistency with Story 4.1 pattern; (2) Fixed validation order in answer_service.py and outreach_service.py - moved resource validation (resume/job checks) BEFORE profile fetch to fail fast and avoid unnecessary DB queries per architecture guidelines; (3) Verified model exports in __init__.py (already present); (4) Verified OpenAPI spec complete with /v1/ai/answer and /v1/ai/outreach endpoints. Minor environmental changes to package.json and pnpm-lock.yaml documented. | Code Review Agent |
