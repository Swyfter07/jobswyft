import React, { useState, useEffect } from 'react';
import {
    Autofill,
    AutofillField,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@jobswyft/ui';
import { ResumeData, JobData, EEOPreferences, Resume } from '@/types';
import { openAIService } from '@/services/openai';
import { storageService } from '@/services/storage';
import { useToast } from './ToastContext';

interface DetectedField {
    id: string;
    selector: string;
    label: string;
    type: string;
    currentValue: string;
    category: 'personal' | 'resume' | 'questions' | 'eeo';
    eeoType?: 'veteran' | 'disability' | 'race' | 'gender' | 'sponsorship' | 'authorization';
    jobBoard: string;
    frameId?: number;
}

interface AutofillTabProps {
    resumeData: ResumeData | null;
    activeResume?: Resume | null;
    jobData?: JobData | null;
    refreshKey?: number;
}

export function AutofillTab({ resumeData, activeResume, jobData, refreshKey = 0 }: AutofillTabProps) {
    const { toast } = useToast();
    const [fields, setFields] = useState<AutofillField[]>([]);
    const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
    const [isFilling, setIsFilling] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isSmartMapping, setIsSmartMapping] = useState(false);
    const [showUndoPrompt, setShowUndoPrompt] = useState(false);
    const [previousValues, setPreviousValues] = useState<Array<{ selector: string; value: string }>>([]);
    const [generatingFieldId, setGeneratingFieldId] = useState<string | null>(null);
    const [eeoPreferences, setEeoPreferences] = useState<EEOPreferences>({});
    const [resumeFieldOverrideId, setResumeFieldOverrideId] = useState<string | null>(null);

    // Derived state for available file inputs
    const availableFileFields = detectedFields.filter(f => f.type === 'file');

    // Load EEO preferences on mount
    useEffect(() => {
        storageService.getEEOPreferences().then(setEeoPreferences);
    }, []);

    // Detect fields when tab becomes active or refreshKey changes
    useEffect(() => {
        detectFields();
    }, [refreshKey]);

    // Map resume data to field values (Tier 1: Resume Data)
    const getValueForField = (label: string, type: string, category?: string): string | undefined => {
        if (!resumeData) return undefined;

        // Handle Resume Upload
        if (category === 'resume' || type === 'file') {
            if (/resume|cv|curriculum/i.test(label) && resumeData.fileData) {
                return resumeData.fileName; // Return filename as placeholder value
            }
            return undefined;
        }

        if (!resumeData.personalInfo) return undefined;

        const labelLower = label.toLowerCase();
        const info = resumeData.personalInfo;

        if (/name/.test(labelLower)) return info.fullName;
        if (/email/.test(labelLower)) return info.email;
        if (/phone|tel/.test(labelLower)) return info.phone;
        if (/linkedin/.test(labelLower)) return info.linkedin;
        if (/website|portfolio|url/.test(labelLower)) return info.website;
        if (/city|location/.test(labelLower)) return info.location;

        return undefined;
    };

    // Get EEO preference value (Tier 2: Stored Preferences)
    const getEEOValue = (eeoType: DetectedField['eeoType']): string | undefined => {
        if (!eeoType) return undefined;

        switch (eeoType) {
            case 'veteran':
                return eeoPreferences.veteranStatus;
            case 'disability':
                return eeoPreferences.disabilityStatus;
            case 'race':
                return eeoPreferences.raceEthnicity;
            case 'gender':
                return eeoPreferences.gender;
            case 'sponsorship':
                return eeoPreferences.sponsorshipRequired;
            case 'authorization':
                return eeoPreferences.authorizedToWork;
            default:
                return undefined;
        }
    };

    const detectFields = async () => {
        setIsScanning(true);
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) {
                setIsScanning(false);
                return;
            }

            // Get all frames in the tab
            const frames = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
            if (!frames) return;

            const allFields: DetectedField[] = [];

            // Query each frame
            await Promise.all(frames.map(async (frame) => {
                try {
                    const response = await chrome.tabs.sendMessage(
                        tab.id!,
                        { action: 'DETECT_FORM_FIELDS' },
                        { frameId: frame.frameId }
                    );

                    if (response?.success && response.fields) {
                        // Tag fields with frameId
                        const frameFields = response.fields.map((f: DetectedField) => ({
                            ...f,
                            frameId: frame.frameId,
                            // Ensure ID is unique across frames
                            id: `${f.id}_frame${frame.frameId}`
                        }));
                        allFields.push(...frameFields);
                    }
                } catch (e) {
                    // Ignore errors for frames that don't have the content script or are closed
                }
            }));

            if (allFields.length > 0) {
                setDetectedFields(allFields);

                // If we don't have an override yet, check if there's an auto-detected resume field
                if (!resumeFieldOverrideId) {
                    const autoDetected = allFields.find((f: DetectedField) => f.category === 'resume');
                    if (autoDetected) {
                        setResumeFieldOverrideId(autoDetected.id);
                    }
                }
            } else {
                setDetectedFields([]);
            }
        } catch (error) {
            console.error('[AutofillTab] Error detecting fields:', error);
        } finally {
            setIsScanning(false);
        }
    };

    // Update fields whenever dependencies change
    useEffect(() => {
        if (detectedFields.length === 0) {
            setFields([]);
            return;
        }

        const autofillFields: AutofillField[] = detectedFields.map((field) => {
            // Respect detected category, but allow override
            let category = field.category;
            if (field.type === 'file') {
                if (resumeFieldOverrideId) {
                    // Override mode: force this specific field to resume, all others to questions
                    category = (field.id === resumeFieldOverrideId) ? 'resume' : 'questions';
                } else if (category !== 'resume') {
                    // Default mode: if not already detected as resume, it's a generic file (questions)
                    category = 'questions';
                }
            }

            let value: string | undefined;
            let status: 'ready' | 'missing' | 'filled' = 'missing';

            // Already filled on the page?
            if (field.currentValue) {
                status = 'filled';
                value = field.currentValue;
            } else if (category === 'personal' || category === 'resume') {
                // Tier 1: Resume data
                value = getValueForField(field.label, field.type, category);
                if (value) status = 'ready';
            } else if (category === 'eeo') {
                // Tier 2: EEO preferences
                value = getEEOValue(field.eeoType);
                if (value) status = 'ready';
            }
            // Tier 3: Questions remain 'missing' - AI will generate on click

            return {
                id: field.id,
                label: field.label,
                value: value || field.currentValue || undefined,
                status,
                category
            };
        });

        setFields(autofillFields);
    }, [detectedFields, resumeFieldOverrideId, resumeData, eeoPreferences]);

    const handleFill = async () => {
        setIsFilling(true);

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) return;

            // Store current values for undo
            setPreviousValues(
                detectedFields.map(f => ({ selector: f.selector, value: f.currentValue }))
            );

            // Build field values for text fields (excluding files)
            const fieldValues = detectedFields
                .map(field => {
                    // Skip already filled fields
                    if (field.currentValue) return null;

                    let value: string | undefined;

                    // Determine effective category, respecting resume file override
                    let category: string = field.category;
                    if (field.type === 'file') {
                        category = (field.id === resumeFieldOverrideId) ? 'resume' : 'questions';
                    }

                    // Tier 1: Resume data (Personal Only, files handled below)
                    if (category === 'personal') {
                        value = getValueForField(field.label, field.type, category);
                    }
                    // Tier 2: EEO preferences
                    else if (category === 'eeo') {
                        value = getEEOValue(field.eeoType);
                    }

                    if (value && field.type !== 'file') {
                        return { selector: field.selector, value, frameId: field.frameId };
                    }
                    return null;
                })
                .filter(Boolean) as Array<{ selector: string; value: string; frameId?: number }>;

            // Group by frameId
            const fieldsByFrame: Record<number, Array<{ selector: string; value: string }>> = {};
            fieldValues.forEach(fv => {
                const frameId = fv.frameId || 0; // Default to main frame if undefined
                if (!fieldsByFrame[frameId]) fieldsByFrame[frameId] = [];
                fieldsByFrame[frameId].push({ selector: fv.selector, value: fv.value });
            });

            // Send fill commands to each frame
            await Promise.all(Object.entries(fieldsByFrame).map(async ([frameIdStr, values]) => {
                try {
                    const frameId = parseInt(frameIdStr);
                    await chrome.tabs.sendMessage(
                        tab.id!,
                        {
                            action: 'FILL_FORM_FIELDS',
                            fieldValues: values
                        },
                        { frameId }
                    );
                } catch (e) {
                    console.error(`[AutofillTab] Failed to fill fields in frame ${frameIdStr}:`, e);
                }
            }));
            const fileToUpload = activeResume?.fileData || resumeData?.fileData;
            const fileNameToUse = activeResume?.fileName || resumeData?.fileName;

            if (fileToUpload && fileNameToUse) {
                // Identify target selector or fallback logic
                // 1. User override
                // 2. First auto-detected resume field
                // 3. Fallback to first file input
                const resumeField = detectedFields.find(f => f.id === resumeFieldOverrideId)
                    || detectedFields.find(f => f.category === 'resume');
                const targetSelector = resumeField?.selector || 'input[type="file"]';

                console.log('[AutofillTab] Executing hybrid resume upload.', {
                    fileName: fileNameToUse,
                    targetSelector,
                    overrideId: resumeFieldOverrideId,
                    detectedFieldCount: detectedFields.length,
                    hasActiveResume: !!activeResume,
                    hasFileData: !!fileToUpload
                });

                await chrome.scripting.executeScript({
                    target: { tabId: tab.id, allFrames: true },
                    world: 'MAIN',
                    args: [targetSelector, fileToUpload, fileNameToUse],
                    func: (suggestedSelector: string, fileData: string, fileName: string) => {
                        console.log('%c [JobSwyft] Starting Resume Hunter... ', 'background: #222; color: #bada55');

                        // 1. Find all candidates (Deep Search including Shadow DOM)
                        const findFileInputs = (root: Document | ShadowRoot | Element): HTMLInputElement[] => {
                            let results: HTMLInputElement[] = [];

                            // Check self
                            if (root instanceof HTMLInputElement && root.type === 'file') {
                                results.push(root);
                            }

                            // Check children
                            const inputs = Array.from(root.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
                            results = results.concat(inputs);

                            // Check shadow roots
                            const allElements = root.querySelectorAll('*');
                            allElements.forEach(el => {
                                if (el.shadowRoot) {
                                    results = results.concat(findFileInputs(el.shadowRoot));
                                }
                            });

                            return results;
                        };

                        const allInputs = findFileInputs(document);
                        console.log(`[JobSwyft] Found ${allInputs.length} file inputs on page (including Shadow DOM).`);

                        // 2. Identify the best candidate
                        let element: HTMLInputElement | null = null;

                        const isAutofill = (el: HTMLElement) => {
                            const name = (el as any).name || '';
                            const text = (el.id + ' ' + name + ' ' + el.className + ' ' + (el.parentElement?.innerText || '')).toLowerCase();
                            return text.includes('autofill');
                        };

                        // Try suggested selector first, but only if it's not autofill
                        const suggested = document.querySelector(suggestedSelector) as HTMLInputElement;
                        if (suggested && !isAutofill(suggested)) {
                            console.log('[JobSwyft] Using suggested selector:', suggestedSelector);
                            element = suggested;
                        } else {
                            console.log('[JobSwyft] Searching for best candidate...');
                            element = allInputs.find(input => {
                                const parentText = input.parentElement?.innerText || '';
                                const labelText = document.querySelector(`label[for="${input.id}"]`)?.textContent || '';
                                const ctx = (input.id + ' ' + input.name + ' ' + parentText + ' ' + labelText).toLowerCase();
                                return !isAutofill(input) && (ctx.includes('resume') || ctx.includes('cv'));
                            }) || null;

                            if (!element) {
                                element = allInputs.find(input => !isAutofill(input)) || null;
                            }
                        }

                        if (!element) {
                            console.error('[JobSwyft] No suitable resume input found.');
                            return;
                        }

                        console.log('[JobSwyft] Targeting element:', element.id || 'anonymous input', element);

                        try {
                            const arr = fileData.split(',');
                            const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
                            const bstr = atob(arr[1]);
                            let n = bstr.length;
                            const u8arr = new Uint8Array(n);
                            while (n--) {
                                u8arr[n] = bstr.charCodeAt(n);
                            }
                            const blob = new Blob([u8arr], { type: mime });
                            const file = new File([blob], fileName, { type: mime, lastModified: Date.now() });

                            const dt = new DataTransfer();
                            dt.items.add(file);

                            const proto = HTMLInputElement.prototype;
                            const setter = Object.getOwnPropertyDescriptor(proto, 'files')?.set;
                            if (setter) {
                                setter.call(element, dt.files);
                            } else {
                                element.files = dt.files;
                            }

                            ['focus', 'input', 'change', 'blur'].forEach(eventName => {
                                element!.dispatchEvent(new Event(eventName, { bubbles: true }));
                            });

                            const container = element.closest('div, label, section') || element.parentElement;
                            if (container) {
                                container.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
                            }

                            console.log('%c [JobSwyft] Resume upload triggered: ' + fileName, 'color: #00ff00; font-weight: bold');
                        } catch (e) {
                            console.error('[JobSwyft] Injection failed:', e);
                        }
                    }
                });
            }

            if (fieldValues.length > 0) {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'FILL_FORM_FIELDS',
                    fieldValues
                });
            }

            setShowUndoPrompt(true);
            setTimeout(() => setShowUndoPrompt(false), 10000);
            await detectFields();
        } catch (error) {
            console.error('[AutofillTab] Error filling fields:', error);
        } finally {
            setIsFilling(false);
        }
    };

    const handleUndo = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id || previousValues.length === 0) return;

            await chrome.tabs.sendMessage(tab.id, {
                action: 'FILL_FORM_FIELDS',
                fieldValues: previousValues
            });

            await detectFields();
        } catch (error) {
            console.error('[AutofillTab] Error undoing fill:', error);
        } finally {
            setShowUndoPrompt(false);
        }
    };

    // Smart Map handler - On-demand AI field mapping
    const handleSmartMap = async () => {
        if (!resumeData || detectedFields.length === 0) return;

        setIsSmartMapping(true);
        try {
            // TODO: Implement AI field mapping service
            // For now, simulate a delay and refresh the field detection
            console.log('[AutofillTab] Smart Map triggered - AI mapping coming soon');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Show loading state
            await detectFields();
        } catch (error) {
            console.error('[AutofillTab] Error in smart mapping:', error);
        } finally {
            setIsSmartMapping(false);
        }
    };

    // Handle clicking on a question chip to generate AI answer
    const handleFieldClick = async (field: AutofillField) => {
        console.log('[AutofillTab] Chip clicked:', field.id, field.label, field.category);

        if (!resumeData) {
            console.warn('[AutofillTab] No resume selected');
            toast({
                title: "Resume missing",
                description: "Please select a resume first to generate answers.",
                variant: "error"
            });
            return;
        }

        if (field.category !== 'questions') {
            console.log('[AutofillTab] Field is not a question, skipping AI generation');
            return;
        }

        const detectedField = detectedFields.find(f => f.id === field.id);
        if (!detectedField) {
            console.error('[AutofillTab] Detected field not found for ID:', field.id);
            return;
        }

        if (!jobData?.description) {
            console.warn('[AutofillTab] No job description available');
            toast({
                title: "Job context missing",
                description: "Values are more accurate when you scan the job post first.",
                variant: "error"
            });
            // return; // Don't block if they really want to try without JD, but user said "job data needs to present or else ai answer autofill should now work"
            // The user explicitly said: "job data needs to present or else ai answer autofill should now work" (typo: ensure NOT work)
            return;
        }

        setGeneratingFieldId(field.id);
        try {
            // Build resume summary for context
            const resumeSummary = [
                resumeData.summary || '',
                resumeData.skills?.join(', ') || '',
                resumeData.experience?.slice(0, 2).map((e: { title: string; company: string; highlights?: string[]; description?: string }) =>
                    `${e.title} at ${e.company}: ${e.highlights?.slice(0, 2).join('; ') || e.description || ''}`
                ).join('\n') || ''
            ].filter(Boolean).join('\n\n');

            // Generate AI answer
            const answer = await openAIService.answerQuestion(
                detectedField.label,
                resumeSummary,
                jobData.title || '',
                jobData.company || '',
                jobData.description,
                'medium',
                'professional'
            );

            if (answer) {
                // Send to content script to fill the field
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'FILL_FORM_FIELDS',
                        fieldValues: [{ selector: detectedField.selector, value: answer }]
                    });

                    // Refresh field detection to update status
                    await detectFields();
                }
            }
        } catch (error) {
            console.error('[AutofillTab] Error generating AI answer:', error);
        } finally {
            setGeneratingFieldId(null);
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 h-full">
            {availableFileFields.length > 0 && (
                <div className="px-4 py-2 bg-emerald-50/50 border-b border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Resume Upload Field
                    </label>
                    <Select
                        value={resumeFieldOverrideId || undefined}
                        onValueChange={setResumeFieldOverrideId}
                    >
                        <SelectTrigger className="h-8 text-xs w-full bg-white dark:bg-black/20">
                            <SelectValue placeholder="Select upload field..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableFileFields.map(f => (
                                <SelectItem key={f.id} value={f.id} className="text-xs">
                                    {f.label || "Unnamed File Input"}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <Autofill
                fields={fields}
                isFilling={isFilling}
                isScanning={isScanning}
                isSmartMapping={isSmartMapping}
                showUndoPrompt={showUndoPrompt}
                generatingFieldId={generatingFieldId || undefined}
                onFill={handleFill}
                onUndo={handleUndo}
                onUndoDismiss={() => setShowUndoPrompt(false)}
                onScan={detectFields}
                onSmartMap={handleSmartMap}
                onFieldClick={handleFieldClick}
                className="h-full"
            />
        </div>
    );
}
