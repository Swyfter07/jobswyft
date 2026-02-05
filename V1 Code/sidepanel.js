document.addEventListener('DOMContentLoaded', () => {
    setupResumeTray();
    setupAppTracker();
    setupJobAdder();
    setupJobAdder();
    setupAIAnalysis();
    setupAIModelSelector(); // Initialize Model Selector
    // setupCollapsibles(); // Disabled: Using Tabs now
    setupTabs(); // New Tab System from Premium UI
    setupCollapsibleActiveResume(); // Collapsible Resume Card
    monitorActiveTab();
    setupAutoScanListener(); // Auto-scan when job pages are detected
});

/**
 * Strip HTML tags, DOCTYPE, and common HTML artifacts from text
 */
function stripHTML(text) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

// ============================================
// AUTO JOB SCAN LISTENER (via storage changes)
// ============================================
let lastProcessedTimestamp = 0;

function setupAutoScanListener() {
    // Listen for storage changes from service worker
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;

        if (changes.job_jet_auto_scan_request) {
            const request = changes.job_jet_auto_scan_request.newValue;
            if (!request) return;

            // Prevent duplicate processing
            if (request.timestamp <= lastProcessedTimestamp) {
                console.log('[JobSwyft] Duplicate auto-scan request, skipping');
                return;
            }

            lastProcessedTimestamp = request.timestamp;
            console.log('[JobSwyft] Auto-scan triggered via storage for:', request.siteName, request.url);
            handleAutoScan(request.tabId, request.siteName, request.url);
        }
    });

    console.log('[JobSwyft] Auto-scan storage listener initialized');
}

// Track last scanned URL to detect new job pages
let lastAutoScannedUrl = '';

/**
 * Handle auto-scan trigger from service worker
 */
async function handleAutoScan(tabId, siteName, url) {
    const scanBtn = document.getElementById('scan-page-btn');
    const jobDescInput = document.getElementById('job-desc');
    const titleInput = document.getElementById('job-title');
    const companyInput = document.getElementById('job-company');

    // Check if this is a new URL (different job page)
    const isNewUrl = url && url !== lastAutoScannedUrl;

    // Skip if same URL and description already has content
    if (!isNewUrl && jobDescInput && jobDescInput.value.length > 100) {
        console.log('[JobSwyft] Skipping auto-scan - same URL and description already populated');
        return;
    }

    // Clear fields for new URL (new job page)
    if (isNewUrl) {
        console.log('[JobSwyft] New job URL detected, clearing fields');
        if (titleInput) titleInput.value = '';
        if (companyInput) companyInput.value = '';
        if (jobDescInput) jobDescInput.value = '';
        lastAutoScannedUrl = url;
    }

    // Show visual indicator that auto-scan is happening
    const originalText = scanBtn ? scanBtn.textContent : '';
    if (scanBtn) {
        scanBtn.textContent = `🔍 Auto-scanning ${siteName}...`;
        scanBtn.disabled = true;
    }

    try {
        // Execute the same scraping logic as manual scan
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames: true },
            function: scrapePageDetails
        });

        if (chrome.runtime.lastError) {
            throw new Error('Cannot scan this page.');
        }

        // Aggregate results from all frames
        let data = { title: '', company: '', location: '', salary: '', description: '' };
        for (const result of (results || [])) {
            const frameData = result?.result || {};
            if (frameData.title && !data.title) data.title = frameData.title;
            if (frameData.company && !data.company) data.company = frameData.company;
            if (frameData.location && !data.location) data.location = frameData.location;
            if (frameData.salary && !data.salary) data.salary = frameData.salary;
            if (frameData.description && frameData.description.length > (data.description?.length || 0)) {
                data.description = frameData.description;
            }
        }

        // Auto-fill fields
        const titleInput = document.getElementById('job-title');
        const companyInput = document.getElementById('job-company');

        if (titleInput && data.title) titleInput.value = data.title;
        if (companyInput && data.company) companyInput.value = data.company;

        // If description found, populate it
        if (data.description && data.description.length > 100) {
            if (jobDescInput) jobDescInput.value = data.description;
            console.log('[JobSwyft] Auto-scan complete - description extracted');
        } else {
            // AI Extraction disabled by user request
            console.log('[JobSwyft] Auto-scan: No description found via DOM scraping. AI extraction is disabled.');
        }

    } catch (error) {
        console.error('[JobSwyft] Auto-scan error:', error);
    } finally {
        if (scanBtn) {
            scanBtn.textContent = originalText;
            scanBtn.disabled = false;
        }
    }
}

// Auto-scan toggle state management
function setupAutoScanToggle() {
    const toggle = document.getElementById('auto-scan-toggle');
    if (!toggle) return;

    // Restore saved state (default: enabled)
    chrome.storage.local.get(['job_jet_auto_scan_enabled'], (result) => {
        const isEnabled = result.job_jet_auto_scan_enabled !== false;
        toggle.checked = isEnabled;
    });

    // Save state on change
    toggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        chrome.storage.local.set({ 'job_jet_auto_scan_enabled': isEnabled }, () => {
            console.log('[JobSwyft] Auto-scan', isEnabled ? 'enabled' : 'disabled');
        });
    });
}

// Initialize toggle on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setupAutoScanToggle();
});

// --- TAB SYSTEM LOGIC ---
function setupTabs() {
    // Main Tabs
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.style.display = 'none');

            // Activate clicked
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.style.display = 'block';
        });
    });

    // Sub Tabs (AI Studio)
    const pills = document.querySelectorAll('.nav-pill');
    const subViews = document.querySelectorAll('.sub-view');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            subViews.forEach(v => v.style.display = 'none');

            pill.classList.add('active');
            const targetId = pill.getAttribute('data-subtab');
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.style.display = 'block';
        });
    });
}

function switchToTab(tabId) {
    const tabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (tabBtn) tabBtn.click();
}

function switchToSubTab(subTabId) {
    // Ensure parent tab is active first
    switchToTab('tab-ai-studio');
    const pillBtn = document.querySelector(`.nav-pill[data-subtab="${subTabId}"]`);
    if (pillBtn) pillBtn.click();
}


function setupCollapsibleActiveResume() {
    const resumeCard = document.getElementById('active-resume-card');
    if (resumeCard) {
        // Assume the first child div is the header
        const header = resumeCard.getElementsByTagName('div')[0];
        if (header) {
            header.style.cursor = 'pointer';

            // Add toggle icon if missing
            let icon = header.querySelector('.resume-toggle-icon');
            if (!icon) {
                icon = document.createElement('span');
                icon.className = 'resume-toggle-icon';
                icon.textContent = '▼';
                icon.style.cssText = 'margin-left: auto; color: #94a3b8; font-size: 10px; transition: transform 0.2s;';
                header.appendChild(icon);
            }

            // Elements to toggle
            const toggleTargets = [
                document.getElementById('resume-container'),
                document.getElementById('profile-area'),
                document.getElementById('parse-resume-btn'),
                document.getElementById('resume-file-input')
            ];

            // Initial State: Expanded? Or collapsed if content exists? 
            // User requested "sleek expandable". Let's default to Expanded but allow collapse.
            // Or remember state? Simple toggle is fine.

            header.onclick = (e) => {
                // Ignore clicks on inner buttons/inputs if any (like if we put a button there later)
                if (e.target.tagName === 'BUTTON') return;

                const isCollapsed = toggleTargets[0] && toggleTargets[0].style.display === 'none';

                toggleTargets.forEach(el => {
                    if (el) {
                        // If it was hidden logic-wise (like button), forcing it 'block' might show it when it shouldn't.
                        // But for "collapse/expand", we generally want to show/hide the whole set.
                        // The button has specific logic (hide on success).
                        // If we expand, we should probably respect the button's internal state if possible, 
                        // BUT simplify: show all components of the card.
                        // If the button was hidden because parsing is done, showing it again is fine (user can re-parse).
                        // So 'block'/'none' is acceptable.
                        el.style.display = isCollapsed ? 'block' : 'none';
                    }
                });

                if (icon) icon.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';

                // Optional: Reduce padding/margin when collapsed?
                // resumeCard.classList.toggle('collapsed-card', !isCollapsed);
            };
        }
    }
}



function expandAndScrollToSection(headerId, callback) {
    // Legacy support wrapper or no-op since we switched to Tabs
    // However, if some internal logic calls this, we might want to map it to a tab switch?
    // For now, let's leave it empty or log it.
    console.log('Legacy expand requested for:', headerId);
}

function monitorActiveTab() {
    const statusEl = document.getElementById('tab-status');

    function updateStatus() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                // Update with Green Dot and Green Text
                statusEl.innerHTML = `
                    <span style="color: #10b981; font-weight: bold; font-size: 14px;">&bull;</span> 
                    <span style="color: #10b981; font-weight: 500;">${tabs[0].title}</span>
                `;
                statusEl.title = tabs[0].title; // Tooltip
            }
        });
    }

    // Configure Worker
    if (typeof pdfjsLib !== 'undefined') {
        // Use getURL for robust extension path resolution
        pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
        console.log('PDF Worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    } else {
        console.error('PDF.js library not found!');
    }

    // Initial check
    updateStatus();

    // Listen for tab switches
    chrome.tabs.onActivated.addListener(updateStatus);

    // Listen for navigation updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            updateStatus();
        }
    });
}

/* --- My Info Section --- */
const INFO_KEY = 'job_jet_info';
const COUNTER_KEY = 'job_jet_counter';

function setupAppTracker() {
    const container = document.getElementById('app-tracker-container');
    if (!container) return;

    // Load saved info
    chrome.storage.local.get([COUNTER_KEY], (result) => {
        const count = result[COUNTER_KEY] || 0;
        container.innerHTML = '';

        // Motivation Message
        let motivation = "Let's get this bread! 🍞";
        if (count > 0) motivation = "Great start! Keep going! 🚀";
        if (count >= 5) motivation = "You're on fire! 🔥";
        if (count >= 10) motivation = "JobSwyft Pilot! ✈️";
        if (count >= 20) motivation = "Unstoppable! 🌟";
        if (count >= 50) motivation = "Legendary Grind! 👑";

        // Render Application Counter
        const counterDiv = document.createElement('div');
        counterDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px; border-radius: 8px;';
        counterDiv.innerHTML = `
            <div>
                <div style="font-size: 11px; opacity: 0.9; margin-bottom: 2px;">Applications Sent</div>
                <div id="app-count" style="font-size: 28px; font-weight: 800; line-height: 1;">${count}</div>
                <div id="app-motivation" style="font-size: 10px; margin-top: 4px; opacity: 0.9; font-style: italic;">${motivation}</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                <button id="increment-counter" style="background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; width: auto; transition: background 0.2s;">+1 Applied</button>
                <button id="reset-counter" style="background: none; border: none; color: rgba(255,255,255,0.6); padding: 2px; cursor: pointer; font-size: 9px; width: auto;" title="Reset Counter">Reset</button>
            </div>
        `;
        container.appendChild(counterDiv);

        // Increment counter logic
        document.getElementById('increment-counter').onclick = () => {
            // Animate
            const btn = document.getElementById('increment-counter');
            btn.style.transform = "scale(0.95)";
            setTimeout(() => btn.style.transform = "scale(1)", 100);

            const newCount = (parseInt(document.getElementById('app-count').textContent) || 0) + 1;
            document.getElementById('app-count').textContent = newCount;

            // Update motivation
            let newMot = "Let's get this bread! 🍞";
            if (newCount > 0) newMot = "Great start! Keep going! 🚀";
            if (newCount >= 5) newMot = "You're on fire! 🔥";
            if (newCount >= 10) newMot = "JobSwyft Pilot! ✈️";
            if (newCount >= 20) newMot = "Unstoppable! 🌟";
            if (newCount >= 50) newMot = "Legendary Grind! 👑";
            document.getElementById('app-motivation').textContent = newMot;

            chrome.storage.local.set({ [COUNTER_KEY]: newCount });
        };

        // Reset counter logic
        document.getElementById('reset-counter').onclick = () => {
            if (confirm('Reset application counter?')) {
                document.getElementById('app-count').textContent = '0';
                document.getElementById('app-motivation').textContent = "Let's get this bread! 🍞";
                chrome.storage.local.set({ [COUNTER_KEY]: 0 });
            }
        };
    });
}

/**
 * Refreshes the profile view with the latest personal info from storage
 */
function setupMyInfo() {
    chrome.storage.local.get(['job_jet_resumes', 'job_jet_active_resume_id', 'job_jet_info'], (result) => {
        const resumes = result.job_jet_resumes || [];
        const activeId = result.job_jet_active_resume_id;
        const info = result.job_jet_info || {};

        // Find active resume and update its personal_info
        const activeResume = resumes.find(r => r.id === activeId);
        if (activeResume && activeResume.profile) {
            // Merge extracted info into profile's personal_info
            if (!activeResume.profile.personal_info) {
                activeResume.profile.personal_info = {};
            }
            Object.assign(activeResume.profile.personal_info, info);

            // Re-render the profile
            renderProfile(activeResume.profile);
        }
    });
}

function extractPersonalInfo(text) {
    const info = {};

    // Email regex
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) info.email = emailMatch[0];

    // Phone regex (various formats)
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
    if (phoneMatch) info.phone = phoneMatch[0];

    // LinkedIn URL
    const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/profile\/)[a-zA-Z0-9-]+/i);
    if (linkedinMatch) info.linkedin = 'https://' + linkedinMatch[0];

    // Portfolio/Website (generic URL not linkedin/email)
    const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g);
    if (urlMatch) {
        const portfolio = urlMatch.find(u => !u.includes('linkedin') && !u.includes('@'));
        if (portfolio) info.portfolio = portfolio.startsWith('http') ? portfolio : 'https://' + portfolio;
    }

    // Name - usually first non-empty line that's not a contact detail
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    for (const line of lines.slice(0, 5)) {
        if (/@|linkedin|http|www\.|^\+?\d{10,}/.test(line)) continue;
        if (line.length > 40) continue;
        info.name = line;
        break;
    }

    // Save to storage (merge with existing, don't overwrite)
    chrome.storage.local.get([INFO_KEY], (result) => {
        const existing = result[INFO_KEY] || {};
        const merged = { ...existing };
        if (info.name && !existing.name) merged.name = info.name;
        if (info.email) merged.email = info.email;
        if (info.phone) merged.phone = info.phone;
        if (info.linkedin) merged.linkedin = info.linkedin;
        if (info.portfolio && !existing.portfolio) merged.portfolio = info.portfolio;

        chrome.storage.local.set({ [INFO_KEY]: merged }, () => {
            // Refresh UI to show extracted data immediately
            setupMyInfo();
        });
    });
}

/**
 * Setup AI Model Selector
 */
function setupAIModelSelector() {
    const modelSelect = document.getElementById('openai-model-select');
    if (!modelSelect) return;

    // Load saved model
    chrome.storage.local.get(['job_jet_openai_model'], (result) => {
        if (result.job_jet_openai_model) {
            modelSelect.value = result.job_jet_openai_model;
        } else {
            // Default only if not set
            // The default in HTML is already gpt-4o-mini
        }
    });

    // Save on change
    modelSelect.addEventListener('change', () => {
        const model = modelSelect.value;
        chrome.storage.local.set({ 'job_jet_openai_model': model }, () => {
            console.log('AI Model saved:', model);

            // Visual feedback on the select itself briefly
            const originalBg = modelSelect.style.backgroundColor;
            modelSelect.style.backgroundColor = '#dcfce7'; // green-100
            setTimeout(() => {
                modelSelect.style.backgroundColor = originalBg;
            }, 500);
        });
    });
}

async function setupAIAnalysis() {
    const keyView = document.getElementById('ai-key-view');
    const analyzeBtn = document.getElementById('ai-analyze-btn');
    const resultsContainer = document.getElementById('ai-results-container');
    const keyInput = document.getElementById('openai-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');

    // Optional: Restore model select if we want it, otherwise default
    const modelSelect = document.getElementById('openai-model-select');

    if (!keyView || !analyzeBtn || !resultsContainer) {
        console.warn("AI Studio elements missing, skipping setup.");
        return;
    }

    const OPENAI_KEY_STORAGE = 'job_jet_openai_key';
    const OPENAI_MODEL_STORAGE = 'job_jet_openai_model';

    // Toggle Views based on Key existence
    const renderState = async () => {
        const result = await chrome.storage.local.get([OPENAI_KEY_STORAGE, OPENAI_MODEL_STORAGE]);
        const hasKey = !!result[OPENAI_KEY_STORAGE];

        if (hasKey) {
            keyView.style.display = 'none';
            analyzeBtn.style.display = 'flex'; // Show button
        } else {
            keyView.style.display = 'block';
            analyzeBtn.style.display = 'none'; // Hide button until key is saved
            resultsContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; font-size: 12px; padding: 20px;">Please enter your OpenAI API Key above to start.</div>';
        }

        if (result[OPENAI_MODEL_STORAGE] && modelSelect) {
            modelSelect.value = result[OPENAI_MODEL_STORAGE];
        }
    };

    // Initial Render
    renderState();

    // Save Key
    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', () => {
            const key = keyInput.value.trim();
            if (key.startsWith('sk-')) {
                chrome.storage.local.set({ [OPENAI_KEY_STORAGE]: key }, () => {
                    renderState();
                    keyInput.value = ''; // clear input
                });
            } else {
                alert('Invalid API Key. Must start with "sk-".');
            }
        });
    }

    // Analyze Logic
    analyzeBtn.addEventListener('click', async () => {
        const selectedModel = modelSelect ? modelSelect.value : "gpt-4o-mini";
        const originalText = analyzeBtn.innerHTML;
        analyzeBtn.innerHTML = '<span>🔮</span> Analyzing...';
        analyzeBtn.disabled = true;

        // Show loading state in container
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 10px; color: #64748b; font-size: 12px;">Analyzing match with ${selectedModel}...</p>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;

        try {
            // 1. Gather Data
            const jobTitle = document.getElementById('job-title').value;
            const jobDesc = document.getElementById('job-desc').value;

            if (!jobDesc || jobDesc.length < 50) {
                throw new Error("Please enter or scan a Job Description first.");
            }

            // Get parsed resume
            const STORAGE_KEY = 'job_jet_profile';
            const OPENAI_MODEL_STORAGE = 'job_jet_openai_model';
            const data = await chrome.storage.local.get([STORAGE_KEY, OPENAI_KEY_STORAGE, OPENAI_MODEL_STORAGE]);
            const profile = data[STORAGE_KEY];
            const apiKey = data[OPENAI_KEY_STORAGE];
            const model = data[OPENAI_MODEL_STORAGE] || 'gpt-4o-mini';

            if (!profile) throw new Error("No resume found. Please upload and parse a resume first.");
            if (!apiKey) throw new Error("API Key missing. Please re-enter it.");

            // Construct Context
            const resumeText = `
            SUMMARY: ${profile.summary}
            SKILLS: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}
            EXPERIENCE: ${(profile.experience || []).map(e => `${e.title} at ${e.company}: ${e.description}`).join('; ')}
            EDUCATION: ${(profile.education || []).map(e => `${e.degree} at ${e.school}`).join('; ')}
            `;

            // 2. Call OpenAI
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: JOB_JET_PROMPTS.match_analysis.system
                        },
                        {
                            role: "user",
                            content: JOB_JET_PROMPTS.match_analysis.user(resumeText, jobTitle, jobDesc)
                        }
                    ],
                    temperature: 0.0
                })
            });

            if (!response.ok) {
                const err = await response.json();
                if (response.status === 401) {
                    chrome.storage.local.remove([OPENAI_KEY_STORAGE], renderState); // clear bad key
                    throw new Error("Invalid API Key. Key has been removed.");
                }
                throw new Error(err.error?.message || "OpenAI API Error");
            }

            const json = await response.json();
            const content = json.choices[0].message.content;

            // Render Result (HTML from Prompt)
            resultsContainer.innerHTML = content;

        } catch (e) {
            console.error(e);
            resultsContainer.innerHTML = `
                <div class="card-premium" style="border-color: #fca5a5; background: #fef2f2;">
                    <div style="color: #dc2626; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                        <span>⚠️</span> Analysis Failed
                    </div>
                    <p style="font-size: 12px; color: #7f1d1d; margin-top: 4px;">${e.message}</p>
                </div>
            `;
        } finally {
            analyzeBtn.innerHTML = originalText;
            analyzeBtn.disabled = false;
        }
    });
}


/* --- Resume Tray Logic --- */
// Global constants for Resume storage keys
const RESUMES_KEY = 'job_jet_resumes';
const ACTIVE_RESUME_ID = 'job_jet_active_resume_id';

function setupResumeTray() {
    // const uploadArea = document.getElementById('resume-upload-area'); // Removed, created dynamically now
    const fileInput = document.getElementById('resume-file-input');
    // This function now just sets up event listeners if needed
    // The main renderResumeList is global and called from the storage callback
}

// Global function to render the resume list UI
function renderResumeList(resumes, activeId) {
    const container = document.getElementById('resume-container');
    if (!container) return; // robustness check

    container.innerHTML = '';

    // 1. The Ultra Compact Bar (Always Rendered)
    const bar = document.createElement('div');
    bar.className = 'resume-compact-bar';

    // Wrapper for Icon + Select
    const wrapper = document.createElement('div');
    wrapper.className = 'resume-select-wrapper';

    const fileIcon = document.createElement('span');
    fileIcon.className = 'resume-icon-small';
    fileIcon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
    `;

    const select = document.createElement('select');
    select.className = 'compact-select';

    if (!resumes || resumes.length === 0) {
        const option = document.createElement('option');
        option.textContent = "Upload a Resume...";
        option.disabled = true;
        option.selected = true;
        select.appendChild(option);
        select.disabled = true;
    } else {
        resumes.forEach((r) => {
            const option = document.createElement('option');
            option.value = r.id;
            option.textContent = r.name;
            if (r.id === activeId) option.selected = true;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            const newId = e.target.value;
            const selectedResume = resumes.find(r => r.id === newId);

            // Sync the selected resume's profile to the global AI context key
            const profileToSync = selectedResume?.profile || null;

            chrome.storage.local.set({
                [ACTIVE_RESUME_ID]: newId,
                'job_jet_profile': profileToSync  // Critical: Sync profile for AI features
            }, () => {
                console.log('Switched to resume:', newId, 'Profile synced:', !!profileToSync);
                renderResumeList(resumes, newId);
            });
        });
    }

    wrapper.appendChild(fileIcon);
    wrapper.appendChild(select);

    // Actions (Badge + Upload)
    const actions = document.createElement('div');
    actions.className = 'resume-actions';

    // Count Badge
    const badge = document.createElement('span');
    badge.className = 'count-badge';
    const activeIndex = (resumes && resumes.length > 0)
        ? resumes.findIndex(r => r.id === activeId) + 1
        : 0;
    badge.textContent = `${activeIndex}/${resumes ? resumes.length : 0}`;

    // Upload Button
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'icon-btn-ghost';
    uploadBtn.title = 'Upload New Resume';
    uploadBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
    `;

    // Critical Fix: Explicit File Input Trigger
    uploadBtn.onclick = () => {
        const fileInput = document.getElementById('resume-file-input');
        if (fileInput) fileInput.click();
        else console.error('File input not found');
    };

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn-ghost delete-btn';
    deleteBtn.title = 'Delete Active Resume';
    deleteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    `;
    deleteBtn.onclick = () => {
        if (!resumes || resumes.length === 0) return;

        const activeResume = resumes.find(r => r.id === activeId);
        if (!activeResume) return;

        if (confirm(`Delete "${activeResume.name}"?`)) {
            const updatedResumes = resumes.filter(r => r.id !== activeId);
            const newActiveId = updatedResumes.length > 0 ? updatedResumes[0].id : null;

            chrome.storage.local.set({
                'job_jet_resumes': updatedResumes,
                'job_jet_active_resume_id': newActiveId,
                'job_jet_profile': newActiveId ? (updatedResumes[0]?.profile || null) : null
            }, () => {
                console.log('Deleted resume:', activeResume.name);
                renderResumeList(updatedResumes, newActiveId);

                // Clear profile display if no resumes left
                if (updatedResumes.length === 0) {
                    const profileList = document.getElementById('profile-list');
                    if (profileList) profileList.innerHTML = '';
                    const profileArea = document.getElementById('profile-area');
                    if (profileArea) profileArea.style.display = 'none';
                }
            });
        }
    };

    // Disable delete if no resumes
    if (!resumes || resumes.length === 0) {
        deleteBtn.disabled = true;
        deleteBtn.style.opacity = '0.4';
    }

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        bar.addEventListener(eventName, preventDefaults, false);
    });
    bar.addEventListener('drop', (e) => {
        Array.from(e.dataTransfer.files).forEach(file => handleFileUpload(file));
    });

    actions.appendChild(badge);
    actions.appendChild(uploadBtn);
    actions.appendChild(deleteBtn);

    bar.appendChild(wrapper);
    bar.appendChild(actions);

    container.appendChild(bar);

    // 2. Profile Visibility Logic
    const selectedR = (resumes && resumes.length > 0) ? resumes.find(r => r.id === activeId) : null;
    const parseBtn = document.getElementById('parse-resume-btn');
    const profileArea = document.getElementById('profile-area');
    const pContainer = document.getElementById('profile-list');

    if (selectedR && selectedR.profile) {
        renderProfile(selectedR.profile);
        if (profileArea) profileArea.style.display = 'block';
        if (parseBtn) parseBtn.style.display = 'none';
    } else {
        if (pContainer) pContainer.innerHTML = '';
        if (profileArea) profileArea.style.display = 'none';
        // Show parse button only if resumes exist
        if (parseBtn) {
            parseBtn.style.display = (resumes && resumes.length > 0) ? 'block' : 'none';
        }
    }
}


// Load initial state
chrome.storage.local.get([RESUMES_KEY, ACTIVE_RESUME_ID, 'resume'], (result) => {
    let resumes = result[RESUMES_KEY] || [];
    let activeId = result[ACTIVE_RESUME_ID];

    // Migration from single resume
    if (resumes.length === 0 && result.resume && result.resume.data) {
        const legacyResume = {
            id: Date.now().toString(),
            name: result.resume.name,
            data: result.resume.data
        };
        resumes = [legacyResume];
        activeId = legacyResume.id;
        chrome.storage.local.set({
            [RESUMES_KEY]: resumes,
            [ACTIVE_RESUME_ID]: activeId,
            'resume': null
        });
    }

    // Ensure activeId is valid
    if (resumes.length > 0 && (!activeId || !resumes.find(r => r.id === activeId))) {
        activeId = resumes[0].id;
        chrome.storage.local.set({ [ACTIVE_RESUME_ID]: activeId });
    }

    renderResumeList(resumes, activeId);

    // Render Initial Profile if exists AND sync to global AI context
    const activeResume = resumes.find(r => r.id === activeId);
    if (activeResume && activeResume.profile) {
        renderProfile(activeResume.profile);
        // Sync to global profile key for AI features
        chrome.storage.local.set({ 'job_jet_profile': activeResume.profile });
        const profileArea = document.getElementById('profile-area');
        if (profileArea) profileArea.style.display = 'block';
        const parseBtn = document.getElementById('parse-resume-btn');
        if (parseBtn) parseBtn.style.display = 'none';
    } else {
        // Clear global profile if no active profile
        chrome.storage.local.set({ 'job_jet_profile': null });
    }
});

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

// Removed global listener attachment for uploadArea since it is dynamic now.

// Global file input listener (must use getElementById since setupResumeTray's fileInput is local)
const globalFileInput = document.getElementById('resume-file-input');
if (globalFileInput) {
    globalFileInput.addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => handleFileUpload(file));
        globalFileInput.value = ''; // Reset to allow re-upload of same file
    });
}

function handleFileUpload(file) {
    if (!file) return;
    const isPdfType = file.type === 'application/pdf';
    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfType && !isPdfExt) {
        alert('Ignored ' + file.name + ' (Not a PDF)');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64String = event.target.result;
        const newResume = {
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            name: file.name,
            data: base64String
        };

        chrome.storage.local.get([RESUMES_KEY], (res) => {
            const resumes = res[RESUMES_KEY] || [];
            resumes.push(newResume);
            chrome.storage.local.set({
                [RESUMES_KEY]: resumes,
                [ACTIVE_RESUME_ID]: newResume.id
            }, () => {
                console.log('Resume uploaded. Rendering list and triggering Auto-Parse for:', newResume.id);
                renderResumeList(resumes, newResume.id);
                // Critical Feature: Auto-Parse (Smart Block Generation) on Upload
                triggerResumeParse(newResume);
            });
        });
    };
    reader.readAsDataURL(file);
}


// Inject Resume Logic (Auto-Upload)
const injectBtn = document.getElementById('inject-resume-btn');
if (injectBtn) {
    injectBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // Visual feedback
        const originalText = injectBtn.textContent;
        injectBtn.textContent = 'Uploading...';
        injectBtn.disabled = true;

        chrome.storage.local.get(['job_jet_resumes', 'job_jet_active_resume_id'], async (result) => {
            const resumes = result.job_jet_resumes || [];
            const activeId = result.job_jet_active_resume_id;
            const activeResume = resumes.find(r => r.id === activeId);

            if (activeResume && activeResume.data) {
                try {
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        args: [activeResume.name, activeResume.data],
                        function: injectedResumeUploader
                    });

                    if (results && results[0] && results[0].result) {
                        injectBtn.textContent = 'Done! ✅';
                    } else {
                        injectBtn.textContent = 'No input found ❌';
                        alert('Could not find a file input on this page.');
                    }
                } catch (e) {
                    console.error(e);
                    alert('Error uploading: ' + (e.message || e));
                    injectBtn.textContent = 'Error ❌';
                } finally {
                    setTimeout(() => {
                        injectBtn.textContent = originalText;
                        injectBtn.disabled = false;
                    }, 2000);
                }
            } else {
                alert('No active resume selected! Please upload or select one.');
                injectBtn.textContent = originalText;
                injectBtn.disabled = false;
            }
        });
    });
}

// Autofill Form Logic (Smart Blocks Data)
const autofillBtn = document.getElementById('autofill-form-btn');
if (autofillBtn) {
    autofillBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // Visual feedback
        const originalText = autofillBtn.textContent;
        autofillBtn.textContent = 'Filling...';
        autofillBtn.disabled = true;

        chrome.storage.local.get(['job_jet_profile'], async (result) => {
            const profile = result.job_jet_profile;

            if (!profile) {
                alert('No Smart Blocks data found! Please generate Smart Blocks from your resume first.');
                autofillBtn.textContent = originalText;
                autofillBtn.disabled = false;
                return;
            }

            // Prepare autofill data
            const autofillData = {
                // Personal Info
                name: profile.personal_info?.name || '',
                firstName: (profile.personal_info?.name || '').split(' ')[0] || '',
                lastName: (profile.personal_info?.name || '').split(' ').slice(1).join(' ') || '',
                email: profile.personal_info?.email || '',
                phone: profile.personal_info?.phone || '',
                linkedin: profile.personal_info?.linkedin || '',
                portfolio: profile.personal_info?.portfolio || '',
                website: profile.personal_info?.portfolio || '',
                // Professional
                summary: profile.summary || '',
                skills: (profile.skills || []).join(', '),
                // Most recent experience
                currentTitle: profile.experience?.[0]?.title || '',
                currentCompany: profile.experience?.[0]?.company || '',
                // Education
                school: profile.education?.[0]?.school || '',
                degree: profile.education?.[0]?.degree || ''
            };

            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id, allFrames: true },
                    args: [autofillData],
                    function: injectedFormFiller
                });

                // Sum results from ALL frames (main page + iframes)
                const filledCount = (results || []).reduce((sum, r) => sum + (r?.result || 0), 0);
                if (filledCount > 0) {
                    autofillBtn.textContent = `Filled ${filledCount} fields ✅`;
                } else {
                    autofillBtn.textContent = 'No fields found ❌';
                }
            } catch (e) {
                console.error(e);
                alert('Error filling form: ' + (e.message || e));
                autofillBtn.textContent = 'Error ❌';
            } finally {
                setTimeout(() => {
                    autofillBtn.textContent = originalText;
                    autofillBtn.disabled = false;
                }, 2500);
            }
        });
    });
}

// Parsing Logic
const parseBtn = document.getElementById('parse-resume-btn');
if (parseBtn) {
    parseBtn.addEventListener('click', () => triggerResumeParse());
}

function showParsingLoadingState(message = 'Parsing Resume...') {
    const profileArea = document.getElementById('profile-area');
    const listContainer = document.getElementById('profile-list');
    const parseBtn = document.getElementById('parse-resume-btn');
    const placeholder = document.getElementById('smart-blocks-placeholder');

    if (parseBtn) parseBtn.style.display = 'none';
    if (placeholder) placeholder.style.display = 'none';
    if (profileArea) profileArea.style.display = 'block';

    if (listContainer) {
        listContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; color: #64748b;">
                    <div class="loader-spinner" style="
                        width: 32px; 
                        height: 32px; 
                        border: 3px solid #e2e8f0; 
                        border-top-color: #2563eb; 
                        border-radius: 50%; 
                        animation: spin 1s linear infinite; 
                        margin-bottom: 16px;">
                    </div>
                    <span style="font-size: 14px; font-weight: 500;">${message}</span>
                    <span style="font-size: 12px; margin-top: 4px; opacity: 0.8;">This may take a few seconds</span>
                </div>
                <style>
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            `;
    }
}

// Reusable Parsing Function
async function triggerResumeParse(directResumeObj = null) {
    const parseBtn = document.getElementById('parse-resume-btn');

    const OPENAI_KEY_STORAGE = 'job_jet_openai_key';
    const OPENAI_MODEL_STORAGE = 'job_jet_openai_model';

    chrome.storage.local.get(['job_jet_resumes', 'job_jet_active_resume_id', OPENAI_KEY_STORAGE, OPENAI_MODEL_STORAGE], async (result) => {
        const resumes = result.job_jet_resumes || [];
        const activeId = result.job_jet_active_resume_id;

        // Use direct object if provided (avoids race condition), otherwise find in storage
        const activeResume = directResumeObj || resumes.find(r => r.id === activeId);

        if (activeResume && activeResume.data) {
            const apiKey = result[OPENAI_KEY_STORAGE];
            const model = result[OPENAI_MODEL_STORAGE] || 'gpt-4o-mini';

            // SHOW LOADING UI
            console.log('Starting parse logic...', apiKey ? 'With AI' : 'Regex Fallback');
            showParsingLoadingState(apiKey ? 'AI Parsing Resume...' : 'Scanning Resume...');

            try {
                // Load PDF
                console.log('Loading PDF data...');
                const pdfData = atob(activeResume.data.split(',')[1]);
                const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                const pdf = await loadingTask.promise;
                console.log('PDF Loaded, pages:', pdf.numPages);

                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join('\n');
                    fullText += pageText + '\n\n';
                }

                // Extract and save personal info (ALWAYS DO THIS via Regex as it is fast/cheap)
                extractPersonalInfo(fullText);

                let profile;
                if (apiKey) {
                    // AI Parsing
                    profile = await parseResumeWithAI(fullText, apiKey, model);
                    if (profile.personal_info) {
                        chrome.storage.local.get([INFO_KEY], (res) => {
                            const existing = res[INFO_KEY] || {};
                            const merged = { ...existing, ...profile.personal_info };
                            // Ensure simple overwrite for simplicity, or smart merge? Overwrite is better for "Refreshing" data.
                            chrome.storage.local.set({ [INFO_KEY]: merged }, () => setupMyInfo());
                        });
                    }
                } else {
                    // Regex Parsing
                    profile = parseResumeToProfile(fullText);
                    // Add artificial delay for regex so user sees the spinner (UX)
                    await new Promise(r => setTimeout(r, 800));
                }

                // Unified Save (Persist to Resume Object)
                // We must update the active resume with this new profile
                activeResume.profile = profile;

                // Update in storage structure
                const resumeIndex = resumes.findIndex(r => r.id === activeResume.id);
                if (resumeIndex !== -1) {
                    resumes[resumeIndex] = activeResume;
                } else {
                    // If it was a new upload passed directly, it might not be in the fetched list yet? 
                    // Actually handleFileUpload saves it first. But let's be safe.
                    resumes.push(activeResume);
                }
                chrome.storage.local.set({
                    'job_jet_resumes': resumes,
                    'job_jet_profile': profile  // Critical: Sync profile for AI features
                });

                renderProfile(profile);
                console.log('Profile rendered successfully.');

                document.getElementById('profile-area').style.display = 'block';
                const placeholder = document.getElementById('smart-blocks-placeholder');
                if (placeholder) placeholder.style.display = 'none';

                // Auto-expand Smart Blocks
                const profileArea = document.getElementById('profile-area');
                const cardContent = profileArea.closest('.card-content');
                if (cardContent && cardContent.classList.contains('collapsed')) {
                    const card = cardContent.parentElement;
                    const header = card.querySelector('.profile-card-header') || card.querySelector('h3');
                    if (header) header.click();
                }

                if (parseBtn) {
                    parseBtn.textContent = 'Regenerate';
                    parseBtn.style.display = 'none';
                    parseBtn.disabled = false;
                }

            } catch (e) {
                console.error(e);
                // VISUAL ERROR REPORTING
                const listContainer = document.getElementById('profile-list');
                if (listContainer) {
                    listContainer.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: #ef4444; background: #fef2f2; border-radius: 8px; font-size: 13px;">
                            <strong>Parsing Failed</strong><br>
                            <span style="font-size: 11px; opacity: 0.8;">${e.message || e}</span><br>
                            <button onclick="document.getElementById('parse-resume-btn').click()" style="margin-top:8px; font-size: 11px;">Retry</button>
                        </div>
                    `;
                }

                if (parseBtn) {
                    parseBtn.style.display = 'block';
                    parseBtn.textContent = 'Retry Parse';
                    parseBtn.disabled = false;
                }
            }
        } else {
            alert('No active resume selected! Please upload or select one.');
        }
    });
}

function parseResumeToProfile(text) {
    const profile = {
        summary: "",
        skills: [],
        experience: [],
        education: [],
        projects: []
    };

    // Helper to find section start
    const findSection = (headers) => {
        for (const h of headers) {
            const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
            const match = text.match(regex);
            if (match) return match.index;
        }
        return -1;
    };

    const expHeaders = ['EXPERIENCE', 'WORK EXPERIENCE', 'WORK HISTORY', 'PROFESSIONAL EXPERIENCE'];
    const eduHeaders = ['EDUCATION', 'ACADEMIC HISTORY', 'EDUCATION & CREDENTIALS'];
    const skillHeaders = ['SKILLS', 'TECHNICAL SKILLS'];
    const projectHeaders = ['PROJECTS'];

    const expStart = findSection(expHeaders);
    const eduStart = findSection(eduHeaders);

    // 1. Parse Summary (Everything before first major section)
    let firstSectionIndex = Math.min(...[expStart, eduStart].filter(i => i !== -1));
    if (firstSectionIndex === Infinity) firstSectionIndex = text.length;

    if (firstSectionIndex > 0) {
        // cleanup generic headers like "SUMMARY"
        let summaryRaw = text.substring(0, firstSectionIndex).trim();
        summaryRaw = summaryRaw.replace(/^(SUMMARY|PROFILE|OBJECTIVE)\s*/i, '');
        // Simple cleanup of name/contact info (heuristic: remove first few short lines)
        const lines = summaryRaw.split('\n');
        // heuristic: usually summary is the long paragraph.
        const longLines = lines.filter(l => l.length > 50);
        if (longLines.length > 0) {
            profile.summary = longLines.join('\n');
        } else {
            profile.summary = lines.slice(-3).join('\n'); // fallback
        }
    }

    // 2. Parse Experience
    if (expStart !== -1) {
        // Find end of experience (next section)
        // We search for Edu, Skills, Projects appearing AFTER experience
        const nextSections = [eduHeaders, skillHeaders, projectHeaders];
        let expEnd = text.length;

        for (const headers of nextSections) {
            for (const h of headers) {
                const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
                // Find match AFTER expStart
                const match = text.slice(expStart + 10).match(regex);
                if (match) {
                    const absoluteIndex = expStart + 10 + match.index;
                    if (absoluteIndex < expEnd) expEnd = absoluteIndex;
                }
            }
        }

        const expText = text.substring(expStart, expEnd).replace(new RegExp(`^ (${expHeaders.join('|')})`, 'i'), '');
        profile.experience = parseJobs(expText);
    }

    // 3. Parse Education
    if (eduStart !== -1) {
        let eduEnd = text.length;
        // logic similar to experience end finding could go here, for now assume it goes to end or until skills
        for (const h of skillHeaders) {
            const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
            const match = text.slice(eduStart + 10).match(regex);
            if (match) {
                const absoluteIndex = eduStart + 10 + match.index;
                if (absoluteIndex < eduEnd) eduEnd = absoluteIndex;
            }
        }

        const eduText = text.substring(eduStart, eduEnd).replace(new RegExp(`^ (${eduHeaders.join('|')})`, 'i'), '');
        profile.education = parseEducation(eduText);
    }

    // 4. Parse Skills
    const skillStart = findSection(skillHeaders);
    if (skillStart !== -1) {
        // Find end of skills section
        let skillEnd = text.length;
        const afterSkillSections = [projectHeaders, ['CERTIFICATIONS', 'AWARDS', 'REFERENCES']];

        for (const headers of afterSkillSections) {
            for (const h of headers) {
                const regex = new RegExp(`(?:^|\\n)\\s*${h}\\s*(?:\\n|$)`, 'i');
                const match = text.slice(skillStart + 10).match(regex);
                if (match) {
                    const absoluteIndex = skillStart + 10 + match.index;
                    if (absoluteIndex < skillEnd) skillEnd = absoluteIndex;
                }
            }
        }

        const skillText = text.substring(skillStart, skillEnd)
            .replace(new RegExp(`^\\s*(${skillHeaders.join('|')})\\s*`, 'i'), '');

        // Parse skills - split by common delimiters
        const skillArray = skillText
            .split(/[,•·|●\n]+/)
            .map(s => s.trim())
            .filter(s => s.length > 1 && s.length < 50 && !/^\d+$/.test(s));

        profile.skills = skillArray;
    }

    return profile;
}

function parseJobs(text) {
    const jobs = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let currentJob = null;

    // Common Date Regex
    const dateLineRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:\d{1,2}\/\d{4})|(?:\d{4}))\s*(?:-|–|to)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current|Now|(?:\d{1,2}\/\d{4})|(?:\d{4}))/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (dateLineRegex.test(line)) {
            if (currentJob) jobs.push(currentJob);

            let title = "Title";
            let company = "Company";

            if (i > 0) title = lines[i - 1];
            if (i > 1) company = lines[i - 2];

            if (/Inc|LLC|Ltd|Corp|University|College|Solutions|Systems/i.test(title)) {
                const temp = title;
                title = company;
                company = temp;
            }

            // If company looks like a bullet point or empty, fallback
            if (company.length < 2) company = "Company";

            currentJob = {
                title: title,
                company: company,
                dates: line,
                description: ""
            };
        } else {
            if (currentJob) {
                currentJob.description += line + "\n";
            }
        }
    }
    if (currentJob) jobs.push(currentJob);
    return jobs;
}

function parseEducation(text) {
    const schools = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    // Naive education parser: every 3 lines is a school? or generic "University" detection

    let currentSchool = null;

    for (const line of lines) {
        // Heuristic: Line with "University", "College", "School" is the institution
        if (/University|College|School|Institute|Academy/i.test(line)) {
            if (currentSchool) schools.push(currentSchool);
            currentSchool = {
                school: line,
                degree: "",
                dates: ""
            };
        } else if (currentSchool) {
            // Dates?
            if (/\d{4}/.test(line)) {
                currentSchool.dates = line;
            } else {
                currentSchool.degree += line + " ";
            }
        }
    }
    if (currentSchool) schools.push(currentSchool);
    return schools;
}


const P_KEY = 'job_jet_profile';

function renderProfile(profile) {
    const container = document.getElementById('profile-list');
    container.innerHTML = '';

    // Unified Save Helper
    function saveProfile(p) {
        chrome.storage.local.get(['job_jet_resumes', 'job_jet_active_resume_id', 'job_jet_info'], (result) => {
            const resumes = result.job_jet_resumes || [];
            const activeId = result.job_jet_active_resume_id;
            const activeIndex = resumes.findIndex(r => r.id === activeId);

            if (activeIndex !== -1) {
                resumes[activeIndex].profile = p;
                chrome.storage.local.set({ job_jet_resumes: resumes });
            }
            if (p.personal_info) {
                const existingInfo = result.job_jet_info || {};
                const merged = { ...existingInfo, ...p.personal_info };
                chrome.storage.local.set({ 'job_jet_info': merged });
            }
        });
    }

    // Header "Resume Blocks"
    const headerRow = document.createElement('div');
    headerRow.className = 'smart-blocks-header';
    headerRow.innerHTML = `
        <span>Resume Blocks</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    `;
    const blockList = document.createElement('div');
    blockList.className = 'block-list';

    // Toggle entire list
    headerRow.onclick = () => {
        blockList.style.display = blockList.style.display === 'none' ? 'flex' : 'none';
        headerRow.querySelector('svg').style.transform = blockList.style.display === 'none' ? 'rotate(180deg)' : 'rotate(0deg)';
    };

    // Default Collapsed State
    blockList.style.display = 'none';
    headerRow.querySelector('svg').style.transform = 'rotate(180deg)';

    container.appendChild(headerRow);
    container.appendChild(blockList);

    // Initial Data Prep
    if (!profile.personal_info) profile.personal_info = { name: "", email: "", phone: "", linkedin: "", portfolio: "" };
    if (!profile.skills) profile.skills = [];
    if (!profile.experience) profile.experience = [];
    if (!profile.education) profile.education = [];
    if (!profile.projects) profile.projects = [];

    // Helper to create Compact Block Items
    function createBlockItem(label, iconSvg, count, renderContentFn) {
        const item = document.createElement('div');

        // Row
        const row = document.createElement('div');
        row.className = 'block-item';
        row.innerHTML = `
            <div class="block-item-left">
                <span class="block-chevron">▶</span>
                <span class="block-icon">${iconSvg}</span>
                <span>${label}</span>
            </div>
            <span class="block-count">${count}</span>
        `;

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'block-content-expanded';

        // Render content on first expand (lazy) or immediate
        const contentEl = renderContentFn();
        if (contentEl) contentDiv.appendChild(contentEl);

        // Click Handler
        row.onclick = () => {
            const isExpanded = contentDiv.style.display === 'block';
            contentDiv.style.display = isExpanded ? 'none' : 'block';
            row.querySelector('.block-chevron').style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(90deg)';
            row.style.background = isExpanded ? '#ffffff' : '#f8fafc';
        };

        item.appendChild(row);
        item.appendChild(contentDiv);
        blockList.appendChild(item);
    }

    // 1. Personal Info
    createBlockItem('Personal Info',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        '1', // 1 profile
        () => renderCollapsibleCard(profile.personal_info.name || "Details", profile.personal_info, ['name', 'email', 'phone', 'linkedin', 'portfolio'],
            (u) => { profile.personal_info = u; saveProfile(profile); }, () => { })
    );

    // 2. Summary
    createBlockItem('Summary',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>',
        profile.summary ? '1' : '0',
        () => renderCollapsibleCard("Summary", profile, ['summary'], (u) => { profile.summary = u.summary; saveProfile(profile); }, () => { })
    );

    // 3. Skills
    createBlockItem('Skills',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
        profile.skills.length,
        () => generateSkillTags(profile.skills, (newSkills) => { profile.skills = newSkills; saveProfile(profile); })
    );

    // 4. Experience
    createBlockItem('Experience',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
        profile.experience.length,
        () => renderExperienceList(profile.experience, (newExp) => { profile.experience = newExp; saveProfile(profile); })
    );

    // 5. Education
    createBlockItem('Education',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>',
        profile.education.length,
        () => renderEducationList(profile.education, (newEdu) => { profile.education = newEdu; saveProfile(profile); })
    );

    // 6. Projects
    createBlockItem('Projects',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
        profile.projects.length,
        () => renderProjectList(profile.projects, (newProj) => { profile.projects = newProj; saveProfile(profile); })
    );
}

function renderSectionHeader(container, title, onAdd) {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin: 12px 0 4px 0;';
    div.innerHTML = `<h5 style="margin:0; font-size: 12px; color: #475569; text-transform: uppercase; font-weight: 700;">${title}</h5>`;

    if (onAdd) {
        const btn = document.createElement('button');
        btn.innerText = '+ Add';
        btn.className = 'secondary';
        btn.style.cssText = 'padding: 2px 6px; font-size: 10px; width: auto;';
        btn.onclick = onAdd;
        div.appendChild(btn);
    }
    container.appendChild(div);
    return div;
}

function renderCollapsibleCard(headerTitle, dataObj, fields, onUpdate, onDelete) {
    const card = document.createElement('div');
    card.className = 'profile-card collapsed'; // Start collapsed

    // Header
    const header = document.createElement('div');
    header.className = 'profile-card-header';

    // Toggle Icon
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'profile-card-icon token-icon'; // token-icon generic
    toggleIcon.textContent = '▶';
    header.appendChild(toggleIcon);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'profile-card-title';

    // Handle empty or whitespace-only titles - ROBUST CHECK
    let displayTitle = headerTitle;
    // Check for undefined, null, empty, whitespace-only, or just a dash
    if (!displayTitle ||
        typeof displayTitle !== 'string' ||
        displayTitle.trim() === '' ||
        displayTitle.trim() === '-' ||
        displayTitle === 'undefined' ||
        displayTitle === 'undefined - undefined' ||
        displayTitle === ' - ') {
        displayTitle = "(Untitled Entry)";
    }

    titleDiv.textContent = displayTitle;
    titleDiv.title = displayTitle;

    // Delete button removed per user request: "remove cross button to delete"

    header.appendChild(titleDiv);
    // header.appendChild(removeBtn); // Removed

    // Body
    const body = document.createElement('div');
    body.className = 'profile-card-body';

    // Toggle Logic
    header.onclick = () => {
        const isCollapsed = card.classList.contains('collapsed');
        if (isCollapsed) {
            card.classList.remove('collapsed');
            body.style.display = 'flex';
        } else {
            card.classList.add('collapsed');
            body.style.display = 'none';
        }
    };

    fields.forEach(key => {
        const wrapper = document.createElement('div');
        const label = document.createElement('label');
        label.className = 'profile-field-label';
        label.innerText = key.charAt(0).toUpperCase() + key.slice(1);

        const inputGroup = document.createElement('div');
        inputGroup.style.cssText = 'display: flex; gap: 4px;';

        const isTextarea = (key === 'description' || key === 'summary');
        const input = isTextarea ? document.createElement('textarea') : document.createElement('input');
        input.className = isTextarea ? 'profile-input profile-textarea' : 'profile-input';

        input.value = dataObj[key] || "";

        input.onchange = (e) => {
            dataObj[key] = e.target.value;
            onUpdate(dataObj);

            // Update header title dynamically
            if (key === 'title' || key === 'company' || key === 'school') {
                // Reconstruct title based on available fields
                let newTitle = "Untitled";
                if (dataObj.title && dataObj.company) {
                    newTitle = `${dataObj.title} - ${dataObj.company} `;
                } else if (dataObj.title) {
                    newTitle = dataObj.title;
                } else if (dataObj.school) {
                    newTitle = dataObj.school;
                }
                const finalTitle = newTitle || "(No Title)";
                titleDiv.innerText = finalTitle;
                titleDiv.title = finalTitle;
            }
        };

        const cpBtn = createCopyButton(input);
        // tweak copy button style for sleek input
        cpBtn.style.height = 'auto';
        cpBtn.style.border = '1px solid #e2e8f0';

        inputGroup.appendChild(input);
        inputGroup.appendChild(cpBtn);

        wrapper.appendChild(label);
        wrapper.appendChild(inputGroup);
        body.appendChild(wrapper);
    });

    card.appendChild(header);
    card.appendChild(body);
    return card;
}

function createCopyButton(inputElement) {
    const btn = document.createElement('button');
    btn.innerText = 'Copy';
    btn.className = 'secondary';
    btn.style.cssText = 'padding: 2px 6px; font-size: 10px; width: auto; align-self: flex-start;';
    btn.onclick = () => {
        navigator.clipboard.writeText(inputElement.value);
        btn.innerText = '✓';
        setTimeout(() => btn.innerText = 'Copy', 1000);
    };
    return btn;
}

// ==========================================
// RENDER HELPERS (New for Compact UI)
// ==========================================

function generateSkillTags(skills, onUpdate) {
    const container = document.createElement('div');

    // TextArea for editing as CSV (simpler for user)
    const textarea = document.createElement('textarea');
    textarea.className = 'profile-input profile-textarea';
    textarea.value = skills.join(', ');
    textarea.placeholder = "Java, React, SQL...";

    textarea.onchange = (e) => {
        const raw = e.target.value;
        const newSkills = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
        onUpdate(newSkills);
    };

    const label = document.createElement('label');
    label.className = 'profile-field-label';
    label.innerText = 'Edit Skills (Comma Separated)';

    container.appendChild(label);
    container.appendChild(textarea);
    return container;
}

function renderExperienceList(experience, onUpdate) {
    const container = document.createElement('div');

    // Add Button
    const addBtn = document.createElement('button');
    addBtn.className = 'secondary';
    addBtn.innerText = '+ Add Position';
    addBtn.style.marginBottom = '8px';
    addBtn.onclick = () => {
        const newExp = [...experience];
        newExp.unshift({ title: "New Role", company: "", dates: "", description: "" });
        onUpdate(newExp);
    };
    container.appendChild(addBtn);

    experience.forEach((job, index) => {
        const card = renderCollapsibleCard(
            `${job.title} - ${job.company}`,
            job,
            ['title', 'company', 'dates', 'description'],
            (updatedJob) => {
                const newExp = [...experience];
                newExp[index] = updatedJob;
                onUpdate(newExp);
            },
            () => { /* Delete logic internal or wrapper */ }
        );

        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete';
        delBtn.style.cssText = 'font-size: 10px; color: red; background: none; border: none; margin-top: 4px; cursor: pointer;';
        delBtn.onclick = () => {
            if (confirm('Delete position?')) {
                const newExp = [...experience];
                newExp.splice(index, 1);
                onUpdate(newExp);
            }
        };
        const wrapper = document.createElement('div');
        wrapper.appendChild(card);
        wrapper.appendChild(delBtn);
        container.appendChild(wrapper);
    });

    return container;
}

function renderEducationList(education, onUpdate) {
    const container = document.createElement('div');

    const addBtn = document.createElement('button');
    addBtn.className = 'secondary';
    addBtn.innerText = '+ Add Education';
    addBtn.style.marginBottom = '8px';
    addBtn.onclick = () => {
        const newEdu = [...education];
        newEdu.unshift({ school: "New School", degree: "", dates: "" });
        onUpdate(newEdu);
    };
    container.appendChild(addBtn);

    education.forEach((edu, index) => {
        const card = renderCollapsibleCard(
            edu.school,
            edu,
            ['school', 'degree', 'dates'],
            (updatedEdu) => {
                const newEdu = [...education];
                newEdu[index] = updatedEdu;
                onUpdate(newEdu);
            },
            () => { }
        );
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete';
        delBtn.style.cssText = 'font-size: 10px; color: red; background: none; border: none; margin-top: 4px; cursor: pointer;';
        delBtn.onclick = () => {
            if (confirm('Delete education?')) {
                const newEdu = [...education];
                newEdu.splice(index, 1);
                onUpdate(newEdu);
            }
        };
        const wrapper = document.createElement('div');
        wrapper.appendChild(card);
        wrapper.appendChild(delBtn);
        container.appendChild(wrapper);
    });
    return container;
}

function renderProjectList(projects, onUpdate) {
    const container = document.createElement('div');

    const addBtn = document.createElement('button');
    addBtn.className = 'secondary';
    addBtn.innerText = '+ Add Project';
    addBtn.style.marginBottom = '8px';
    addBtn.onclick = () => {
        const newProj = [...projects];
        newProj.unshift({ name: "New Project", technologies: "", description: "" });
        onUpdate(newProj);
    };
    container.appendChild(addBtn);

    projects.forEach((proj, index) => {
        if (Array.isArray(proj.technologies)) proj.technologies = proj.technologies.join(', ');

        const card = renderCollapsibleCard(
            proj.name || "Untitled Project",
            proj,
            ['name', 'technologies', 'description'],
            (updatedProj) => {
                const newProj = [...projects];
                newProj[index] = updatedProj;
                onUpdate(newProj);
            },
            () => { }
        );
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete';
        delBtn.style.cssText = 'font-size: 10px; color: red; background: none; border: none; margin-top: 4px; cursor: pointer;';
        delBtn.onclick = () => {
            if (confirm('Delete project?')) {
                const newProj = [...projects];
                newProj.splice(index, 1);
                onUpdate(newProj);
            }
        };
        const wrapper = document.createElement('div');
        wrapper.appendChild(card);
        wrapper.appendChild(delBtn);
        container.appendChild(wrapper);
    });
    return container;
}

/* --- Job Adding Logic --- */
function setupJobAdder() {
    const scanBtn = document.getElementById('scan-page-btn');
    // const saveBtn = document.getElementById('save-job-btn'); // Removed
    const copyDescBtn = document.getElementById('copy-desc-btn');
    const clearBtn = document.getElementById('clear-job-btn');

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.getElementById('job-title').value = '';
            document.getElementById('job-company').value = '';
            document.getElementById('job-desc').value = '';
        });
    }

    scanBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // Visual feedback
        const originalText = scanBtn.textContent;
        scanBtn.textContent = 'Scanning...';
        scanBtn.disabled = true;

        try {
            // Step 1: Try heuristic scraping in ALL frames (including iframes like Greenhouse)
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                function: scrapePageDetails
            });

            if (chrome.runtime.lastError) {
                throw new Error('Cannot scan this page. Try a normal web page.');
            }

            // Aggregate results from all frames - pick the best job description
            let data = { title: '', company: '', location: '', salary: '', description: '' };
            for (const result of (results || [])) {
                const frameData = result?.result || {};
                if (frameData.title && !data.title) data.title = frameData.title;
                if (frameData.company && !data.company) data.company = frameData.company;
                if (frameData.location && !data.location) data.location = frameData.location;
                if (frameData.salary && !data.salary) data.salary = frameData.salary;
                // Pick the longest description across all frames
                if (frameData.description && frameData.description.length > (data.description?.length || 0)) {
                    data.description = frameData.description;
                }
            }

            // Auto-fill title and company immediately
            document.getElementById('job-title').value = data.title || tab.title;
            document.getElementById('job-company').value = data.company || '';

            // Step 2: If description found, use it directly (sanitize HTML first)
            if (data.description && data.description.length > 100) {
                // Strip any HTML tags that might have leaked through
                const cleanDesc = data.description
                    .replace(/<!DOCTYPE[^>]*>/gi, '')
                    .replace(/<[^>]*>/g, '')
                    .trim();
                document.getElementById('job-desc').value = cleanDesc;
            } else {
                // Step 3: AI Fallback - Get raw page text
                scanBtn.textContent = '🤖 AI Extracting...';

                const rawTextResults = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => document.body.innerText
                });

                const rawText = rawTextResults?.[0]?.result || '';

                if (rawText.length < 100) {
                    throw new Error('Page has insufficient text content.');
                }

                // AI Extraction disabled by user request
                document.getElementById('job-desc').value = '';
                alert('Could not find description automatically via page scraping. AI extraction is disabled. Please select text on the page manually.');
            }
        } catch (e) {
            console.error('Scan error:', e);
            alert('Scan failed: ' + (e.message || 'Unknown error'));
        } finally {
            scanBtn.textContent = originalText;
            scanBtn.disabled = false;
        }
    });

    // Picker Logic
    ['pick-title', 'pick-company', 'pick-desc'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => startPicker(id));
    });

    async function startPicker(btnId) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        // Visual feedback
        const btn = document.getElementById(btnId);
        const originalText = btn.innerHTML; // icon or text
        btn.textContent = '...';
        btn.disabled = true;

        // Execute picker
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: injectedPicker
            });

            if (results && results[0] && results[0].result) {
                const text = results[0].result;
                if (btnId === 'pick-title') document.getElementById('job-title').value = text;
                if (btnId === 'pick-company') document.getElementById('job-company').value = text;
                if (btnId === 'pick-desc') document.getElementById('job-desc').value = text;
            }
        } catch (e) {
            console.error(e);
            alert('Cannot pick from this page.\n\nError: ' + (e.message || e));
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    /* Save Logic Removed */

    copyDescBtn.addEventListener('click', () => {
        const text = document.getElementById('job-desc').value;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyDescBtn.textContent;
            copyDescBtn.textContent = 'Copied!';
            setTimeout(() => copyDescBtn.textContent = originalText, 1500);
        });
    });

    // AI Answer Generator
    const generateAnswerBtn = document.getElementById('generate-answer-btn');
    const copyAnswerBtn = document.getElementById('copy-answer-btn');

    if (generateAnswerBtn) {
        generateAnswerBtn.addEventListener('click', async () => {
            const question = document.getElementById('ai-question-input').value.trim();
            const jobDesc = document.getElementById('job-desc').value.trim();
            const jobTitle = document.getElementById('job-title').value.trim();
            const jobCompany = document.getElementById('job-company').value.trim();
            const answerLength = document.getElementById('answer-length').value;
            const answerTone = document.getElementById('answer-tone').value;

            if (!question) {
                alert('Please enter a question to answer.');
                return;
            }

            // Get resume/profile data
            const OPENAI_MODEL_STORAGE = 'job_jet_openai_model';
            const result = await chrome.storage.local.get(['job_jet_profile', 'job_jet_openai_key', OPENAI_MODEL_STORAGE]);
            const profile = result.job_jet_profile;
            const apiKey = result.job_jet_openai_key;
            const model = result[OPENAI_MODEL_STORAGE] || 'gpt-4o-mini';

            if (!apiKey) {
                alert('Please set your OpenAI API key in Settings first.');
                return;
            }

            if (!profile) {
                alert('Please generate Smart Blocks from your resume first.');
                return;
            }

            // Build resume summary (Use FULL details now)
            const resumeSummary = [
                profile.summary ? `Summary: ${profile.summary} ` : '',
                profile.skills?.length ? `Skills: ${profile.skills.join(', ')} ` : '',
                profile.experience?.map(e =>
                    `Role: ${e.title} at ${e.company} (${e.dates || 'N/A'}) \nDetails: ${e.description} `
                ).join('\n\n') || '',
                profile.projects?.map(p =>
                    `Project: ${p.name} (${p.technologies || ''}) \nDetails: ${p.description} `
                ).join('\n\n') || '',
                profile.education?.map(e =>
                    `Education: ${e.degree} from ${e.school} (${e.dates || 'N/A'})`
                ).join('\n') || ''
            ].filter(Boolean).join('\n\n');

            // Visual feedback
            const originalText = generateAnswerBtn.textContent;
            generateAnswerBtn.textContent = '🔄 Generating...';
            generateAnswerBtn.disabled = true;

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey} `
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            {
                                role: 'system',
                                content: JOB_JET_PROMPTS.answer_question.system(answerTone)
                            },
                            {
                                role: 'user',
                                content: JOB_JET_PROMPTS.answer_question.user(question, resumeSummary, jobTitle, jobCompany, answerLength, answerTone)
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: answerLength === 'long' ? 800 : answerLength === 'short' ? 200 : 500
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error?.message || 'API request failed');
                }

                const data = await response.json();
                const answer = data.choices[0].message.content.trim();

                // Display answer
                document.getElementById('ai-answer-output').style.display = 'block';
                document.getElementById('ai-answer-text').textContent = answer;

                generateAnswerBtn.textContent = '✅ Done!';
            } catch (e) {
                console.error(e);
                alert('Error generating answer: ' + e.message);
                generateAnswerBtn.textContent = '❌ Error';
            } finally {
                setTimeout(() => {
                    generateAnswerBtn.textContent = originalText;
                    generateAnswerBtn.disabled = false;
                }, 2000);
            }
        });
    }

    if (copyAnswerBtn) {
        copyAnswerBtn.addEventListener('click', () => {
            const answer = document.getElementById('ai-answer-text').textContent;
            navigator.clipboard.writeText(answer).then(() => {
                const originalText = copyAnswerBtn.textContent;
                copyAnswerBtn.textContent = '✅ Copied!';
                setTimeout(() => copyAnswerBtn.textContent = originalText, 1500);
            });
        });
    }

    // Clear answer button
    const clearAnswerBtn = document.getElementById('clear-answer-btn');
    if (clearAnswerBtn) {
        clearAnswerBtn.addEventListener('click', () => {
            document.getElementById('ai-question-input').value = '';
            document.getElementById('ai-answer-output').style.display = 'none';
            document.getElementById('ai-answer-text').textContent = '';
            document.getElementById('answer-feedback-input').value = '';
        });
    }

    // Regenerate Answer with Feedback
    const regenerateAnswerBtn = document.getElementById('regenerate-answer-btn');
    if (regenerateAnswerBtn) {
        regenerateAnswerBtn.addEventListener('click', async () => {
            const originalAnswer = document.getElementById('ai-answer-text').textContent;
            const feedback = document.getElementById('answer-feedback-input').value.trim();

            if (!feedback) {
                alert('Please enter feedback for regeneration.');
                return;
            }

            if (!originalAnswer) {
                alert('No answer to refine. Generate one first.');
                return;
            }

            const OPENAI_MODEL_STORAGE = 'job_jet_openai_model';
            const result = await chrome.storage.local.get(['job_jet_openai_key', OPENAI_MODEL_STORAGE]);
            const apiKey = result.job_jet_openai_key;
            const model = result[OPENAI_MODEL_STORAGE] || 'gpt-4o-mini';

            if (!apiKey) {
                alert('Please set your OpenAI API key in Settings.');
                return;
            }

            const originalText = regenerateAnswerBtn.textContent;
            regenerateAnswerBtn.textContent = '🔄 Refining...';
            regenerateAnswerBtn.disabled = true;

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey} `
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: JOB_JET_PROMPTS.regenerate_with_feedback.system },
                            { role: 'user', content: JOB_JET_PROMPTS.regenerate_with_feedback.user(originalAnswer, feedback, 'answer') }
                        ],
                        temperature: 0.7,
                        max_tokens: 500
                    })
                });

                if (!response.ok) throw new Error('API request failed');

                const data = await response.json();
                const refinedAnswer = data.choices[0].message.content.trim();

                document.getElementById('ai-answer-text').textContent = refinedAnswer;
                document.getElementById('answer-feedback-input').value = '';

                regenerateAnswerBtn.textContent = '✅ Refined!';
            } catch (e) {
                console.error(e);
                alert('Error refining answer: ' + e.message);
                regenerateAnswerBtn.textContent = '❌ Error';
            } finally {
                setTimeout(() => {
                    regenerateAnswerBtn.textContent = originalText;
                    regenerateAnswerBtn.disabled = false;
                }, 2000);
            }
        });
    }



    // Cover Letter Generator
    const generateCoverBtn = document.getElementById('generate-cover-btn');
    const copyCoverBtn = document.getElementById('copy-cover-btn');
    const clearCoverBtn = document.getElementById('clear-cover-btn');

    if (generateCoverBtn) {
        generateCoverBtn.onclick = async () => {
            // Strip any HTML tags from job description
            let jobDesc = document.getElementById('job-desc').value.trim();
            jobDesc = jobDesc.replace(/<[^>]*>/g, '').replace(/<!DOCTYPE[^>]*>/gi, '').trim();

            const jobTitle = document.getElementById('job-title').value.trim();
            const jobCompany = document.getElementById('job-company').value.trim();
            const coverLength = document.getElementById('cover-length').value;
            const coverTone = document.getElementById('cover-tone').value;

            // Get resume/profile data
            const OPENAI_MODEL_STORAGE = 'job_jet_openai_model';
            const result = await chrome.storage.local.get(['job_jet_profile', 'job_jet_openai_key', OPENAI_MODEL_STORAGE]);
            const profile = result.job_jet_profile;
            const apiKey = result.job_jet_openai_key;
            const model = result[OPENAI_MODEL_STORAGE] || 'gpt-4o-mini';

            if (!apiKey) {
                alert('Please set your OpenAI API key in Settings first.');
                return;
            }

            if (!profile) {
                alert('Please generate Smart Blocks from your resume first.');
                return;
            }

            if (!jobDesc && !jobTitle) {
                alert('Please scan or enter a job description first.');
                return;
            }

            // Build resume data string and sanitize all fields
            const resumeData = stripHTML([
                `Name: ${profile.personal_info?.name || ''} `,
                profile.summary ? `Summary: ${profile.summary} ` : '',
                profile.skills?.length ? `Skills: ${profile.skills.join(', ')} ` : '',
                profile.experience?.slice(0, 3).map(e =>
                    `${e.title} at ${e.company}${e.dates ? ` (${e.dates})` : ''} `
                ).join('\n') || '',
                profile.projects?.slice(0, 2).map(p =>
                    `Project: ${p.name} - ${p.description} `
                ).join('\n') || '',
                profile.education?.slice(0, 2).map(e =>
                    `${e.degree} from ${e.school} `
                ).join('\n') || ''
            ].filter(Boolean).join('\n'));

            // Ensure job description is also sanitized
            const cleanJobDesc = stripHTML(jobDesc);

            // Visual feedback
            const originalText = generateCoverBtn.textContent;
            generateCoverBtn.textContent = '🔄 Generating...';
            generateCoverBtn.disabled = true;

            try {
                const maxTokens = coverLength === 'very_long' ? 1200 : coverLength === 'long' ? 800 : coverLength === 'short' ? 300 : 500;

                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            {
                                role: 'system',
                                content: JOB_JET_PROMPTS.cover_letter.system(coverTone)
                            },
                            {
                                role: 'user',
                                content: JOB_JET_PROMPTS.cover_letter.user(resumeData, jobDesc, jobTitle, jobCompany, coverLength, coverTone)
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: maxTokens
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error?.message || 'API request failed');
                }

                const data = await response.json();
                const coverLetter = data.choices[0].message.content.trim();

                // Display cover letter
                document.getElementById('cover-letter-output').style.display = 'block';
                document.getElementById('cover-letter-text').textContent = coverLetter;

                generateCoverBtn.textContent = '✅ Done!';
            } catch (e) {
                console.error(e);
                alert('Error generating cover letter: ' + e.message);
                generateCoverBtn.textContent = '❌ Error';
            } finally {
                setTimeout(() => {
                    generateCoverBtn.textContent = originalText;
                    generateCoverBtn.disabled = false;
                }, 2000);
            }
        };
    }

    if (copyCoverBtn) {
        copyCoverBtn.addEventListener('click', () => {
            const coverLetter = document.getElementById('cover-letter-text').innerText;
            navigator.clipboard.writeText(coverLetter).then(() => {
                const originalText = copyCoverBtn.textContent;
                copyCoverBtn.textContent = '✅ Copied!';
                setTimeout(() => copyCoverBtn.textContent = originalText, 1500);
            });
        });
    }

    if (clearCoverBtn) {
        clearCoverBtn.addEventListener('click', () => {
            document.getElementById('cover-letter-output').style.display = 'none';
            document.getElementById('cover-letter-text').textContent = '';
            document.getElementById('cover-feedback-input').value = '';
        });
    }

    // Regenerate Cover Letter with Feedback
    const regenerateCoverBtn = document.getElementById('regenerate-cover-btn');
    if (regenerateCoverBtn) {
        regenerateCoverBtn.addEventListener('click', async () => {
            const originalCover = document.getElementById('cover-letter-text').innerText;
            const feedback = document.getElementById('cover-feedback-input').value.trim();

            if (!feedback) {
                alert('Please enter feedback for regeneration.');
                return;
            }

            if (!originalCover) {
                alert('No cover letter to refine. Generate one first.');
                return;
            }

            const OPENAI_MODEL_STORAGE = 'job_jet_openai_model';
            const result = await chrome.storage.local.get(['job_jet_openai_key', OPENAI_MODEL_STORAGE]);
            const apiKey = result.job_jet_openai_key;
            const model = result[OPENAI_MODEL_STORAGE] || 'gpt-4o-mini';

            if (!apiKey) {
                alert('Please set your OpenAI API key in Settings.');
                return;
            }

            const originalText = regenerateCoverBtn.textContent;
            regenerateCoverBtn.textContent = '🔄 Refining...';
            regenerateCoverBtn.disabled = true;

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey} `
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: JOB_JET_PROMPTS.regenerate_with_feedback.system },
                            { role: 'user', content: JOB_JET_PROMPTS.regenerate_with_feedback.user(originalCover, feedback, 'cover letter') }
                        ],
                        temperature: 0.7,
                        max_tokens: 800
                    })
                });

                if (!response.ok) throw new Error('API request failed');

                const data = await response.json();
                const refinedCover = data.choices[0].message.content.trim();

                document.getElementById('cover-letter-text').textContent = refinedCover;
                document.getElementById('cover-feedback-input').value = '';

                regenerateCoverBtn.textContent = '✅ Refined!';
            } catch (e) {
                console.error(e);
                alert('Error refining cover letter: ' + e.message);
                regenerateCoverBtn.textContent = '❌ Error';
            } finally {
                setTimeout(() => {
                    regenerateCoverBtn.textContent = originalText;
                    regenerateCoverBtn.disabled = false;
                }, 2000);
            }
        });
    }

    // Export Cover Letter to PDF
    const exportCoverPdfBtn = document.getElementById('export-cover-pdf-btn');
    if (exportCoverPdfBtn) {
        // Use onclick to prevent duplicate listeners if setup runs multiple times
        exportCoverPdfBtn.onclick = async () => {
            const coverLetter = document.getElementById('cover-letter-text').innerText;
            const jobTitle = document.getElementById('job-title').value.trim();
            const jobCompany = document.getElementById('job-company').value.trim();

            if (!coverLetter) {
                alert('No cover letter to export. Generate one first.');
                return;
            }

            // Get user name from profile
            const result = await chrome.storage.local.get(['job_jet_profile']);
            const profile = result.job_jet_profile;
            const userName = profile?.personal_info?.name || 'Applicant';
            const userEmail = profile?.personal_info?.email || '';
            const userPhone = profile?.personal_info?.phone || '';

            // Create a printable HTML document
            const printWindow = window.open('', '_blank');

            printWindow.document.write(`
<!DOCTYPE html>
            <html>
                <head>
                    <title>Cover Letter - ${jobCompany || 'Application'}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

                        @page {
                            size: letter;
                        margin: 0.6in;
                        }

                        * {margin: 0; padding: 0; box-sizing: border-box; }

                        html, body {
                            height: 100%;
                        max-height: 100vh;
                        overflow: hidden;
                        }

                        body {
                            font - family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        font-size: 10.5pt;
                        line-height: 1.5;
                        color: #1e293b;
                        padding: 0;
                        }

                        .page {
                            height: 100%;
                        display: flex;
                        flex-direction: column;
                        }

                        .header {
                            margin - bottom: 16px;
                        padding-bottom: 12px;
                        border-bottom: 2px solid #e2e8f0;
                        }

                        .name {
                            font - size: 16pt;
                        font-weight: 600;
                        color: #0f172a;
                        margin-bottom: 2px;
                        }

                        .contact {
                            font - size: 9pt;
                        color: #64748b;
                        }

                        .recipient {
                            margin - bottom: 14px;
                        font-size: 10pt;
                        }

                        .content {
                            flex: 1;
                        text-align: justify;
                        white-space: pre-wrap;
                        font-size: 10.5pt;
                        }

                        .footer {
                            margin - top: 20px;
                        padding-top: 10px;
                        }

                        @media print {
                            @page {
                            margin: 0.6in;
                            }
                        html, body {
                            height: auto;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="header">
                            <div class="name">${userName}</div>
                            <div class="contact">${[userEmail, userPhone].filter(Boolean).join(' • ')}</div>
                        </div>
                        ${jobCompany ? `<div class="recipient"><strong>${jobCompany}</strong>${jobTitle ? `<br>Re: ${jobTitle}` : ''}</div>` : ''}
                        <div class="content">${coverLetter}</div>
                    </div>
                </body>
            </html>
    `);
            printWindow.document.close();

            // Wait for fonts to load, then print
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    }

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
            const OPENAI_MODEL_STORAGE = 'job_jet_openai_model';
            const result = await chrome.storage.local.get(['job_jet_openai_key', 'job_jet_profile', OPENAI_MODEL_STORAGE]);
            const apiKey = result.job_jet_openai_key;
            const profile = result.job_jet_profile;
            const model = result[OPENAI_MODEL_STORAGE] || 'gpt-4o-mini';

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
                        'Authorization': `Bearer ${apiKey} `
                    },
                    body: JSON.stringify({
                        model: model,
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

    // Clear Outreach
    const clearOutreachBtn = document.getElementById('clear-outreach-btn');
    if (clearOutreachBtn) {
        clearOutreachBtn.addEventListener('click', () => {
            // Hide output
            document.getElementById('outreach-output').style.display = 'none';
            document.getElementById('outreach-text').innerText = '';
            document.getElementById('outreach-feedback-input').value = '';

            // Clear inputs (optional, but requested "1 click clear")
            document.getElementById('outreach-manager-name').value = '';
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

            const OPENAI_MODEL_STORAGE = 'job_jet_openai_model';
            const result = await chrome.storage.local.get(['job_jet_openai_key', OPENAI_MODEL_STORAGE]);
            const apiKey = result.job_jet_openai_key;
            const model = result[OPENAI_MODEL_STORAGE] || 'gpt-4o-mini';

            if (!apiKey) return;

            const originalText = regenerateOutreachBtn.textContent;
            regenerateOutreachBtn.textContent = '🔄 Refining...';
            regenerateOutreachBtn.disabled = true;

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey} `
                    },
                    body: JSON.stringify({
                        model: model,
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
    // Helper: Construct resume summary for AI context
    function constructResumeSummaryForAI(profile) {
        if (!profile) return '';
        return [
            profile.summary ? `Summary: ${profile.summary} ` : '',
            profile.personal_info ? `Contact: ${profile.personal_info.name} | ${profile.personal_info.email || ''} | ${profile.personal_info.linkedin || ''} ` : '',
            profile.skills?.length ? `Skills: ${profile.skills.join(', ')} ` : '',
            profile.experience?.map(e =>
                `Role: ${e.title} at ${e.company} (${e.dates || 'N/A'}) \nDetails: ${e.description} `
            ).join('\n\n') || '',
            profile.projects?.map(p =>
                `Project: ${p.name} (${p.technologies || ''}) \nDetails: ${p.description} `
            ).join('\n\n') || '',
            profile.education?.map(e =>
                `Education: ${e.degree} at ${e.school} (${e.dates || ''})`
            ).join('\n') || ''
        ].filter(Boolean).join('\n\n');
    }
}

// AI-powered job description extraction fallback
async function extractJobDescriptionWithAI(apiKey, rawText, pageTitle) {
    try {
        const saved = await chrome.storage.local.get(['job_jet_openai_model']);
        const model = saved.job_jet_openai_model || 'gpt-4o-mini';

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: JOB_JET_PROMPTS.job_description_extraction.system },
                    { role: 'user', content: JOB_JET_PROMPTS.job_description_extraction.user(rawText, pageTitle) }
                ],
                temperature: 0.0,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            console.error('AI extraction failed:', response.status);
            return null;
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) {
        console.error('AI extraction error:', e);
        return null;
    }
}

// This function is injected into the page and runs in the page context
function scrapePageDetails() {
    // Helper to clean text
    const clean = (str) => str ? str.trim().replace(/\s+/g, ' ') : '';

    // 1. Get Title
    let title = '';
    const h1 = document.querySelector('h1');
    if (h1) title = clean(h1.innerText);
    if (!title) {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) title = clean(ogTitle.content);
    }
    if (!title) title = clean(document.title);

    // 2. Get Company
    let company = '';
    // Strategy A: JSON-LD (Best for structured data)
    try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            const json = JSON.parse(script.innerText);
            if (json['@type'] === 'JobPosting' && json.hiringOrganization) {
                company = json.hiringOrganization.name;
                // Bonus: We can get description from here too!
                if (!window._scrapedDescription && json.description) {
                    window._scrapedDescription = json.description.replace(/<[^>]*>?/gm, ''); // Strip HTML
                }
                break;
            }
        }
    } catch (e) { }

    // Strategy B: Meta Tags
    if (!company) {
        const ogSiteName = document.querySelector('meta[property="og:site_name"]');
        if (ogSiteName) company = clean(ogSiteName.content);
    }

    // Strategy C: Common Class Names
    if (!company) {
        const companyEl = document.querySelector('[class*="company"], [class*="employer"], [class*="organization"]');
        if (companyEl) company = clean(companyEl.innerText);
    }

    // 4. Get Location (New)
    let location = '';
    // JSON-LD
    try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            const json = JSON.parse(script.innerText);
            if (json['@type'] === 'JobPosting' && json.jobLocation) {
                const loc = json.jobLocation;
                if (loc.address) {
                    location = [loc.address.addressLocality, loc.address.addressRegion].filter(Boolean).join(', ');
                }
                break;
            }
        }
    } catch (e) { }
    // Meta / Common
    if (!location) {
        const locEl = document.querySelector('[class*="location"], [class*="jobLocation"]');
        if (locEl) location = clean(locEl.innerText);
    }

    // 5. Get Salary (New)
    let salary = '';
    // JSON-LD
    try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
            const json = JSON.parse(script.innerText);
            if (json['@type'] === 'JobPosting' && json.baseSalary) {
                const val = json.baseSalary.value;
                if (val) {
                    salary = (val.minValue ? val.minValue + '-' + val.maxValue : val.value) + ' ' + (val.currency || '');
                }
                break;
            }
        }
    } catch (e) { }
    // Common
    if (!salary) {
        const salEl = document.querySelector('[class*="salary"], [class*="compensation"]');
        if (salEl) salary = clean(salEl.innerText);
    }

    // 3. Get Description
    let description = '';

    // Strategy A: User Selection (Highest Priority if deliberate)
    const selection = window.getSelection().toString();
    if (selection && selection.length > 50) {
        description = selection;
    }

    // Strategy B: Cached from JSON-LD
    if (!description && window._scrapedDescription) {
        description = window._scrapedDescription;
    }

    // Strategy C: Heuristic Selectors (Common job boards)
    if (!description) {
        const selectors = [
            // Indeed
            '#jobDescriptionText',
            '.jobsearch-jobDescriptionText',
            '.jobsearch-JobComponent-description',
            // LinkedIn
            '.jobs-description__content',
            '.jobs-box__html-content',
            '.description__text',
            '#job-details',
            '.show-more-less-html__markup',
            // Glassdoor
            '[class*="JobDetails_jobDescription"]',
            '.jobDescriptionContent',
            '[data-test="jobDescription"]',
            // ZipRecruiter
            '.jobDescriptionSection',
            '.job_description',
            // Lever
            '[data-testid="jobDescription-container"]',
            '.posting-categories',
            '.section-wrapper',
            // Workday
            '[data-automation-id="jobPostingDescription"]',
            '.job-description-container',
            // Greenhouse
            '#content',
            '.job-post-description',
            '#job_description',
            // AngelList / Wellfound
            '.job-details',
            '[class*="styles_description"]',
            // SmartRecruiters
            '.job-sections',
            // Ashby
            '[class*="Ashby"]',
            '.ashby-job-posting-description',
            // Generic fallbacks
            '[data-test="job-description-text"]',
            '[id*="job_description"]',
            '[id*="job-description"]',
            '[class*="job-description"]',
            '[class*="jobDescription"]',
            '[class*="description"]',
            '#main',
            'article',
            'main'
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.length > 100) {
                description = clean(el.innerText);
                break;
            }
        }
    }

    // Strategy D: Meta Description (Last resort)
    if (!description) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) description = clean(metaDesc.content);
    }

    return {
        title: title,
        company: company,
        location: location,
        salary: salary,
        description: description,
        url: window.location.href
    };
}

/* --- Job Tracker Logic --- */
function loadJobs() {
    const list = document.getElementById('job-list');
    chrome.storage.local.get(['jobs'], (result) => {
        const jobs = result.jobs || [];
        list.innerHTML = '';

        if (jobs.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #888;">No jobs saved yet.</p>';
            return;
        }

        jobs.forEach(job => {
            const item = document.createElement('div');
            item.className = 'job-item';
            item.innerHTML = `
        < div class="job-title" > <a href="${job.url}" target="_blank" style="text-decoration: none; color: inherit;">${job.title}</a></div >
        <div class="job-company">${job.company}</div>
        <div class="status-badge">${job.status}</div>
    `;
            list.appendChild(item);
        });
    });
}
// This function is injected and runs in the page context
function injectedPicker() {
    return new Promise((resolve) => {
        // Create style for highligher
        const styleId = 'job-jet-picker-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
        .job - jet - highlight {
        outline: 2px solid #2563eb!important;
        background - color: rgba(37, 99, 235, 0.1)!important;
        cursor: crosshair!important;
    }
    `;
            document.head.appendChild(style);
        }

        let hoveredElement = null;

        function onMouseOver(e) {
            e.stopPropagation();
            if (hoveredElement) hoveredElement.classList.remove('job-jet-highlight');
            hoveredElement = e.target;
            hoveredElement.classList.add('job-jet-highlight');
        }

        function onMouseOut(e) {
            e.stopPropagation();
            if (hoveredElement) {
                hoveredElement.classList.remove('job-jet-highlight');
                hoveredElement = null;
            }
        }

        function onClick(e) {
            e.preventDefault();
            e.stopPropagation();
            cleanup();
            const text = e.target.innerText.trim();
            resolve(text);
        }

        function onKeyDown(e) {
            if (e.key === 'Escape') {
                cleanup();
                resolve(''); // Cancelled
            }
        }

        function cleanup() {
            document.removeEventListener('mouseover', onMouseOver, true);
            document.removeEventListener('mouseout', onMouseOut, true);
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('keydown', onKeyDown, true);
            if (hoveredElement) hoveredElement.classList.remove('job-jet-highlight');
            const style = document.getElementById(styleId);
            if (style) style.remove();
        }

        // Add listeners with capture to ensure we get them first
        document.addEventListener('mouseover', onMouseOver, true);
        document.addEventListener('mouseout', onMouseOut, true);
        document.addEventListener('click', onClick, true);
        document.addEventListener('keydown', onKeyDown, true);
    });
}
// This function is injected and runs in the page context
function injectedResumeUploader(fileName, base64Data) {
    // 1. Find all file inputs
    const inputs = Array.from(document.querySelectorAll('input[type="file"]'));

    // Filter for visible or likely candidates if multiple (heuristic)
    // For now, let's try to set it on ALL of them, or the first one that looks empty.
    // Usually there is only one relevant one active.

    let targetInput = inputs[0];
    if (!targetInput) return false;

    // 2. Convert Base64 to Blob/File
    // Data URI format: "data:application/pdf;base64,..."
    const byteString = atob(base64Data.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'application/pdf' });
    const file = new File([blob], fileName, { type: 'application/pdf', lastModified: new Date() });

    // 3. Create DataTransfer to simulate drag/drop or file selection
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // 4. Assign to input
    targetInput.files = dataTransfer.files;

    // 5. Trigger events so React/Frameworks detect the change
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    targetInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Bonus: If there are dropzones, we might need to fake a drop event, 
    // but input.files + change is usually enough for modern uploaders.

    return true;
}

// Advanced form filler with 3-tier matching (Simplify-style)
function injectedFormFiller(data) {
    let filledCount = 0;

    // ========== TIER 2: ATS-SPECIFIC SELECTORS ==========
    // Hardcoded selectors for major Applicant Tracking Systems
    const atsSelectors = {
        // Lever
        lever: {
            firstName: '[name="cards[eeec0675-db6d-4a4c-b8ca-0f3da3240ade][field0]"], [data-qa="first-name-input"], input[name*="firstName"]',
            lastName: '[name="cards[eeec0675-db6d-4a4c-b8ca-0f3da3240ade][field1]"], [data-qa="last-name-input"], input[name*="lastName"]',
            email: '[data-qa="email-input"], input[name*="email"]',
            phone: '[data-qa="phone-input"], input[name*="phone"]',
            linkedin: '[name*="linkedin"], [name*="urls[LinkedIn]"]',
            website: '[name*="portfolio"], [name*="urls[Portfolio]"], [name*="urls[GitHub]"]'
        },
        // Workday
        workday: {
            firstName: '[data-automation-id="legalNameSection_firstName"], [data-automation-id="firstName"]',
            lastName: '[data-automation-id="legalNameSection_lastName"], [data-automation-id="lastName"]',
            email: '[data-automation-id="email"], [data-automation-id="addressSection_email"]',
            phone: '[data-automation-id="phone-number"], [data-automation-id="phone"]'
        },
        // Greenhouse
        greenhouse: {
            firstName: '#first_name, [name="job_application[first_name]"]',
            lastName: '#last_name, [name="job_application[last_name]"]',
            email: '#email, [name="job_application[email]"]',
            phone: '#phone, [name="job_application[phone]"]',
            linkedin: '[name="job_application[question_id][linkedin_url]"]'
        },
        // SmartRecruiters
        smartrecruiters: {
            firstName: '[name="firstName"], [id*="firstName"]',
            lastName: '[name="lastName"], [id*="lastName"]',
            email: '[name="email"], [type="email"]',
            phone: '[name="phoneNumber"], [id*="phone"]'
        },
        // ICIMS
        icims: {
            firstName: '[id*="firstName"], [name*="firstName"]',
            lastName: '[id*="lastName"], [name*="lastName"]',
            email: '[id*="email"], [type="email"]',
            phone: '[id*="phone"], [name*="phone"]'
        }
    };

    // ========== TIER 1: ATTRIBUTE PATTERNS ==========
    const fieldMappings = [
        { patterns: ['firstname', 'first_name', 'fname', 'givenname', 'first-name'], key: 'firstName' },
        { patterns: ['lastname', 'last_name', 'lname', 'familyname', 'surname', 'last-name'], key: 'lastName' },
        { patterns: ['fullname', 'full_name', 'legalname', 'candidatename'], key: 'name' },
        { patterns: ['linkedin', 'linkedinprofile', 'linkedinurl'], key: 'linkedin' },
        { patterns: ['portfolio', 'website', 'github', 'personalsite', 'personalurl'], key: 'website' },
        { patterns: ['phone', 'phonenumber', 'telephone', 'mobile', 'cell'], key: 'phone' },
        { patterns: ['summary', 'coverletter', 'aboutyou', 'professionalprofile', 'bio'], key: 'summary' },
        { patterns: ['jobtitle', 'currenttitle', 'position', 'title'], key: 'currentTitle' },
        { patterns: ['company', 'employer', 'currentcompany', 'organization'], key: 'currentCompany' },
        { patterns: ['school', 'university', 'college', 'institution', 'almamater'], key: 'school' },
        { patterns: ['degree', 'education', 'major', 'fieldofstudy'], key: 'degree' },
        { patterns: ['city', 'location', 'currentlocation'], key: 'city' },
        { patterns: ['address', 'street', 'streetaddress'], key: 'address' }
    ];

    // ========== HELPER: Get all inputs including Shadow DOM ==========
    function getAllInputs(root = document) {
        const inputs = [];
        const selector = 'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input:not([type]), textarea';

        // Regular DOM
        inputs.push(...root.querySelectorAll(selector));

        // Pierce Shadow DOM
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                inputs.push(...getAllInputs(el.shadowRoot));
            }
        });

        return inputs;
    }

    // ========== HELPER: Fill field with proper event simulation ==========
    function fillField(field, value) {
        if (!value) return false;

        // Skip if already filled
        const currentValue = field.value || field.textContent || '';
        if (currentValue.trim()) return false;

        // Focus first
        field.focus();
        field.click();

        // Handle contenteditable
        if (field.getAttribute('contenteditable') === 'true') {
            field.textContent = value;
            field.innerHTML = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }

        // Use native setter for React/Angular/Vue compatibility
        const proto = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

        if (setter) {
            setter.call(field, value);
        } else {
            field.value = value;
        }

        // Reset React 16+ value tracker before dispatching events
        if (field._valueTracker) {
            field._valueTracker.setValue('');
        }

        // Dispatch full event sequence
        field.dispatchEvent(new Event('focus', { bubbles: true }));
        field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
        field.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
        field.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'a' }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));

        // Double-tap input for stubborn frameworks
        field.dispatchEvent(new Event('input', { bubbles: true }));

        return true;
    }

    // ========== HELPER: Get field context for matching ==========
    function getFieldContext(field) {
        let context = '';

        // Direct attributes (highest confidence)
        context += (field.name || '') + ' ';
        context += (field.id || '') + ' ';
        context += (field.placeholder || '') + ' ';
        context += (field.getAttribute('autocomplete') || '') + ' ';
        context += (field.getAttribute('data-testid') || '') + ' ';
        context += (field.getAttribute('data-automation-id') || '') + ' ';
        context += (field.getAttribute('aria-label') || '') + ' ';
        context += (field.getAttribute('data-qa') || '') + ' ';

        // Associated label
        if (field.id) {
            const label = document.querySelector(`label[for= "${field.id}"]`);
            if (label) context += label.textContent + ' ';
        }

        // Immediate parent label
        const parent = field.parentElement;
        if (parent) {
            const label = parent.querySelector('label');
            if (label && !label.contains(field)) context += label.textContent + ' ';
        }

        return context.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // ========== HELPER: Match context against patterns ==========
    function matchesPattern(context, patterns) {
        return patterns.some(p => context.includes(p.replace(/[^a-z0-9]/g, '')));
    }

    // ========== STEP 1: Try ATS-Specific Selectors First ==========
    for (const [atsName, selectors] of Object.entries(atsSelectors)) {
        for (const [fieldKey, selector] of Object.entries(selectors)) {
            if (!data[fieldKey]) continue;

            try {
                const fields = document.querySelectorAll(selector);
                fields.forEach(field => {
                    if (fillField(field, data[fieldKey])) {
                        filledCount++;
                        console.log(`[JobSwyft]ATS(${atsName}): Filled ${fieldKey} `);
                    }
                });
            } catch (e) { /* Invalid selector */ }
        }
    }

    // ========== STEP 2: Fill by HTML Input Type ==========
    const allInputs = getAllInputs();

    allInputs.forEach(field => {
        // Skip hidden, disabled, readonly, or already filled
        if (field.type === 'hidden' || field.disabled || field.readOnly) return;
        if (field.offsetParent === null && !field.closest('[class*="modal"]')) return;
        if ((field.value || '').trim()) return;

        // Type-based filling (most reliable)
        if (field.type === 'email' && data.email) {
            if (fillField(field, data.email)) {
                filledCount++;
                console.log('[JobSwyft] Filled email (by type)');
            }
            return;
        }
        if (field.type === 'tel' && data.phone) {
            if (fillField(field, data.phone)) {
                filledCount++;
                console.log('[JobSwyft] Filled phone (by type)');
            }
            return;
        }
    });

    // ========== STEP 3: Fill by Attribute Pattern Matching ==========
    allInputs.forEach(field => {
        if (field.type === 'hidden' || field.disabled || field.readOnly) return;
        if ((field.value || '').trim()) return;

        const context = getFieldContext(field);

        for (const mapping of fieldMappings) {
            if (matchesPattern(context, mapping.patterns) && data[mapping.key]) {
                if (fillField(field, data[mapping.key])) {
                    filledCount++;
                    console.log(`[JobSwyft] Filled ${mapping.key} (by pattern)`);
                    break;
                }
            }
        }
    });

    return filledCount;
}


async function parseResumeWithAI(text, apiKey, model = "gpt-4o-mini") {
    // Truncate text if needed (100k chars is plenty for resumes)
    const truncatedText = text.substring(0, 50000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey} `
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "system",
                    content: JOB_JET_PROMPTS.resume_parsing.system
                },
                {
                    role: "user",
                    content: JOB_JET_PROMPTS.resume_parsing.user(truncatedText)
                }
            ],
            response_format: { type: "json_object" }, // reliable JSON mode
            temperature: 0.2
        })
    });

    if (!response.ok) {
        throw new Error('OpenAI API request failed');
    }

    const json = await response.json();
    let content = json.choices[0].message.content;

    return JSON.parse(content);
}

function setupCollapsibles() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const header = card.querySelector('h3');
        const content = card.querySelector('.card-content');
        if (header && content) {
            header.addEventListener('click', () => {
                card.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            });
        }
    });
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Only trigger if Cmd (Mac) or Ctrl (Win) + Shift are pressed
    if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;

    switch (e.key.toLowerCase()) {
        case 's': // Scan Page
            e.preventDefault();
            document.getElementById('scan-page-btn')?.click();
            break;
        case 'f': // Autofill
            e.preventDefault();
            document.getElementById('autofill-form-btn')?.click();
            break;
        case 'a': // Answer Question
            e.preventDefault();
            const answerHeader = document.getElementById('header-answer-gen');
            const answerCard = answerHeader?.closest('.card');

            // Expand if collapsed
            if (answerCard && answerCard.classList.contains('collapsed')) {
                answerHeader.click();
            }

            // Wait slightly for animation/display block
            setTimeout(() => {
                document.getElementById('ai-question-input')?.focus();
            }, 50);
            break;

        case 'c': // Cover Letter
            e.preventDefault();
            const coverHeader = document.getElementById('header-cover-letter');
            const coverCard = coverHeader?.closest('.card');

            // Expand if collapsed
            if (coverCard && coverCard.classList.contains('collapsed')) {
                coverHeader.click();
            }

            // Focus length selector as a starting point, or just scroll to it
            setTimeout(() => {
                document.getElementById('cover-length')?.focus();
            }, 50);
            break;
    }
});

/* ========================================
   Floating Action Button (FAB) Logic
   ======================================== */

(function setupFAB() {
    const fabContainer = document.getElementById('fab-container');
    const fabMain = document.getElementById('fab-main');
    const fabMenu = document.getElementById('fab-menu');
    const fabActions = document.querySelectorAll('.fab-action');

    if (!fabMain || !fabMenu || !fabContainer) return;

    // --- Drag State ---
    let isDragging = false;
    let dragStartX, dragStartY;
    let fabStartX, fabStartY;

    // Load saved position
    const savedPos = JSON.parse(localStorage.getItem('fabPosition') || '{}');
    if (savedPos.left !== undefined && savedPos.bottom !== undefined) {
        fabContainer.style.left = savedPos.left + 'px';
        fabContainer.style.bottom = savedPos.bottom + 'px';
    }

    // --- Drag Handlers ---
    fabMain.addEventListener('mousedown', (e) => {
        isDragging = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        const rect = fabContainer.getBoundingClientRect();
        fabStartX = rect.left;
        fabStartY = window.innerHeight - rect.bottom;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;

        // Only start drag if moved more than 5px
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            isDragging = true;
            fabContainer.classList.add('dragging');

            let newLeft = fabStartX + dx;
            let newBottom = fabStartY - dy;

            // Constrain to viewport
            newLeft = Math.max(-20, Math.min(newLeft, window.innerWidth - 30));
            newBottom = Math.max(-20, Math.min(newBottom, window.innerHeight - 30));

            fabContainer.style.left = newLeft + 'px';
            fabContainer.style.bottom = newBottom + 'px';
        }
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        fabContainer.classList.remove('dragging');

        if (isDragging) {
            // Save position
            localStorage.setItem('fabPosition', JSON.stringify({
                left: parseInt(fabContainer.style.left),
                bottom: parseInt(fabContainer.style.bottom)
            }));
        }
    }

    // --- Toggle Menu (only on click, not drag) ---
    fabMain.addEventListener('click', (e) => {
        if (isDragging) {
            isDragging = false;
            return; // Don't toggle if just finished dragging
        }
        fabMain.classList.toggle('open');
        fabMenu.classList.toggle('fab-menu-hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!fabContainer.contains(e.target)) {
            fabMain.classList.remove('open');
            fabMenu.classList.add('fab-menu-hidden');
        }
    });

    // --- Handle Action Clicks ---
    fabActions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;

            // Close menu
            fabMain.classList.remove('open');
            fabMenu.classList.add('fab-menu-hidden');

            // Navigate to section
            switch (action) {
                case 'cover-letter':
                    expandAndScrollTo('header-cover-letter');
                    break;
                case 'ai-answer':
                    expandAndScrollTo('header-answer-gen');
                    break;
                case 'outreach':
                    expandAndScrollTo('header-outreach');
                    break;
                case 'scan-page':
                    expandAndScrollTo('header-page-scanner', () => {
                        document.getElementById('scan-page-btn')?.click();
                    });
                    break;
                case 'ai-insight':
                    expandAndScrollTo('header-ai-insights', () => {
                        document.getElementById('analyze-match-btn')?.click();
                    });
                    break;
            }
        });
    });

    // Helper: Expand card and scroll to it
    function expandAndScrollTo(headerId, callback) {
        let header = document.getElementById(headerId);

        // Fallback: find by partial text match
        if (!header) {
            const searchText = headerId.replace('header-', '').replace(/-/g, ' ');
            document.querySelectorAll('.card h3').forEach(h => {
                if (h.textContent.toLowerCase().includes(searchText)) {
                    header = h;
                }
            });
        }

        const card = header?.closest('.card');

        // Expand if collapsed
        if (card && card.classList.contains('collapsed')) {
            header.click();
        }

        // Scroll into view
        setTimeout(() => {
            card?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (callback) setTimeout(callback, 200);
        }, 100);
    }
})();

