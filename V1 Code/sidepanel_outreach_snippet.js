// ----------------------------------------------------
// Hiring Manager Outreach Generator
// ----------------------------------------------------

const generateOutreachBtn = document.getElementById('generate-outreach-btn');
if (generateOutreachBtn) {
    generateOutreachBtn.addEventListener('click', async () => {
        const managerName = document.getElementById('outreach-manager-name').value.trim();
        const outreachType = document.getElementById('outreach-type').value;
        const outreachTone = document.getElementById('outreach-tone').value;

        // Get necessary context
        const jobTitle = document.getElementById('job-title').value.trim();
        const jobCompany = document.getElementById('job-company').value.trim();

        if (!jobTitle || !jobCompany) {
            alert('Please enter a Job Title and Company in the tracker first.');
            return;
        }

        // Get API Key
        const result = await chrome.storage.local.get(['job_jet_openai_key', 'job_jet_profile']);
        const apiKey = result.job_jet_openai_key;
        const profile = result.job_jet_profile;

        if (!apiKey) {
            document.getElementById('api-key-section').scrollIntoView({ behavior: 'smooth' });
            alert('Please enter your OpenAI API Key securely below.');
            return;
        }

        const resumeData = constructResumeSummaryForAI(profile);
        if (!resumeData || resumeData.length < 50) {
            alert('Please upload a resume or convert to PDF first.');
            return;
        }

        const originalText = generateOutreachBtn.textContent;
        generateOutreachBtn.textContent = '🧠 Drafting...';
        generateOutreachBtn.disabled = true;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: JOB_JET_PROMPTS.outreach_message.system },
                        { role: 'user', content: JOB_JET_PROMPTS.outreach_message.user(resumeData, jobTitle, jobCompany, managerName, outreachType, outreachTone) }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            const message = data.choices[0].message.content.trim();

            document.getElementById('outreach-output').style.display = 'block';
            document.getElementById('outreach-text').innerText = message;
            generateOutreachBtn.textContent = '✅ Done!';
        } catch (e) {
            console.error(e);
            alert('Error: ' + e.message);
            generateOutreachBtn.textContent = '❌ Error';
        } finally {
            setTimeout(() => {
                generateOutreachBtn.textContent = originalText;
                generateOutreachBtn.disabled = false;
            }, 2000);
        }
    });
}

// Copy Outreach Message
const copyOutreachBtn = document.getElementById('copy-outreach-btn');
if (copyOutreachBtn) {
    copyOutreachBtn.addEventListener('click', () => {
        const text = document.getElementById('outreach-text').innerText;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyOutreachBtn.textContent;
            copyOutreachBtn.textContent = '✅ Copied!';
            setTimeout(() => copyOutreachBtn.textContent = originalText, 1500);
        });
    });
}

// Regenerate Outreach with Feedback
const regenerateOutreachBtn = document.getElementById('regenerate-outreach-btn');
if (regenerateOutreachBtn) {
    regenerateOutreachBtn.addEventListener('click', async () => {
        const originalMessage = document.getElementById('outreach-text').innerText;
        const feedback = document.getElementById('outreach-feedback-input').value.trim();

        if (!feedback) {
            alert('Please enter feedback.');
            return;
        }

        const result = await chrome.storage.local.get(['job_jet_openai_key']);
        const apiKey = result.job_jet_openai_key;

        if (!apiKey) return;

        const originalText = regenerateOutreachBtn.textContent;
        regenerateOutreachBtn.textContent = '🔄 Refining...';
        regenerateOutreachBtn.disabled = true;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: JOB_JET_PROMPTS.regenerate_with_feedback.system },
                        { role: 'user', content: JOB_JET_PROMPTS.regenerate_with_feedback.user(originalMessage, feedback, 'outreach message') }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();
            document.getElementById('outreach-text').innerText = data.choices[0].message.content.trim();
            document.getElementById('outreach-feedback-input').value = '';
            regenerateOutreachBtn.textContent = '✅ Refined!';
        } catch (e) {
            console.error(e);
            alert('Error: ' + e.message);
            regenerateOutreachBtn.textContent = '❌ Error';
        } finally {
            setTimeout(() => {
                regenerateOutreachBtn.textContent = originalText;
                regenerateOutreachBtn.disabled = false;
            }, 2000);
        }
    });
}
