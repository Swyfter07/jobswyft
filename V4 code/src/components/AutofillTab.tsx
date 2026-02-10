import React, { useState, useEffect, useMemo } from 'react';
import {
    Autofill,
    AutofillField,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    cn
} from '@jobswyft/ui';
import { ResumeData, JobData, EEOPreferences, Resume } from '@/types';

import { storageService } from '@/services/storage';
import { openAIService } from '@/services/openai';
import { useToast } from './ToastContext';
import {
    Loader2,
    RotateCcw,
    Zap,
    RefreshCw,
    MousePointer2
} from "lucide-react";

// Fallback for missing currentUrl
const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

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
    confidence?: 'high' | 'medium' | 'low';
}

interface AutofillTabProps {
    resumeData: ResumeData | null;
    activeResume?: Resume | null;
    jobData?: JobData | null;
    refreshKey?: number;
}

export function AutofillTab({ resumeData, activeResume, jobData, refreshKey = 0 }: AutofillTabProps) {
    const { toast } = useToast();
    const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
    const [isFilling, setIsFilling] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ title: string; text?: string; type: 'success' | 'info' | 'error' } | null>(null);
    const [ignoredFieldIds, setIgnoredFieldIds] = useState<Set<string>>(new Set());
    const [previousValues, setPreviousValues] = useState<Array<{ selector: string; value: string }>>([]);
    const [eeoPreferences, setEeoPreferences] = useState<EEOPreferences>({});
    const [resumeFieldOverrideId, setResumeFieldOverrideId] = useState<string | null>(null);
    const lastFillTimestamp = React.useRef<number>(0);

    // Derived state for available file inputs
    const availableFileFields = detectedFields.filter(f => f.type === 'file');

    // Load EEO preferences on mount
    useEffect(() => {
        storageService.getEEOPreferences().then(setEeoPreferences);
    }, []);

    // Detect fields when tab becomes active or refreshKey changes
    useEffect(() => {
        detectFields(false);
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

    const detectFields = async (skipAI = false) => {
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

            // Get custom mappings for this domain
            const url = new URL(tab.url || currentUrl);
            const domain = url.hostname;
            const customMaps = await storageService.getCustomMappings(domain);

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
                        const frameFields = response.fields.map((f: DetectedField) => {
                            // Apply custom mapping if exists
                            const customCat = customMaps[f.selector];
                            return {
                                ...f,
                                frameId: frame.frameId,
                                id: `${f.id}_frame${frame.frameId}`,
                                ...(customCat ? { category: customCat as any, confidence: 'high' } : {})
                            };
                        });
                        allFields.push(...frameFields);
                    }
                } catch (e) {
                    // Ignore errors for frames that don't have the content script or are closed
                }
            }));

            // Filter out fields that were explicitly ignored in previous AI segmentation
            const filteredFields = allFields.filter(f => !ignoredFieldIds.has(f.id));

            if (filteredFields.length > 0) {
                // Then refine with AI if needed
                const candidates = filteredFields.filter(f => f.category === 'questions' || f.confidence === 'low');
                if (candidates.length > 0 && !skipAI) {
                    await runAISegmentation(filteredFields);
                } else {
                    // Only set fields here if we are NOT running AI, OR after AI is done
                    setDetectedFields(filteredFields);
                }

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

    const [isSegmenting, setIsSegmenting] = useState(false);
    const [isInspecting, setIsInspecting] = useState(false);
    const [mappingTarget, setMappingTarget] = useState<any | null>(null);

    /**
     * Listen for manual field selection from content script
     */
    useEffect(() => {
        const listener = (message: any) => {
            if (message.action === 'FIELD_SELECTED') {
                setMappingTarget(message.field);
                setIsInspecting(false);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    const toggleInspection = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        if (isInspecting) {
            await chrome.tabs.sendMessage(tab.id, { action: 'STOP_INSPECTION' });
            setIsInspecting(false);
        } else {
            await chrome.tabs.sendMessage(tab.id, { action: 'START_INSPECTION' });
            setIsInspecting(true);
            setStatusMessage({
                title: "Inspection Mode Active",
                text: "Click an input field on the page to map it.",
                type: 'info'
            });
        }
    };

    const handleManualMap = async (category: string) => {
        if (!mappingTarget) return;

        const newField: DetectedField = {
            ...mappingTarget,
            category: category as any,
            confidence: 'high'
        };

        // Save to local persistence (Domain-based)
        const url = new URL(currentUrl);
        const domain = url.hostname;
        const currentMaps = await storageService.getCustomMappings(domain);

        await storageService.saveCustomMapping(domain, {
            ...currentMaps,
            [mappingTarget.selector]: category
        });

        // Add to detected fields
        setDetectedFields(prev => [...prev, newField]);
        setMappingTarget(null);
        setStatusMessage({
            title: "Field Mapped",
            text: `Saved mapping for ${mappingTarget.label || 'field'}`,
            type: 'success'
        });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    /**
     * Run AI Segmentation on unknown/low-confidence fields
     */
    const runAISegmentation = async (currentFields: DetectedField[]) => {
        // Failsafe: Don't run if we just filled (within 3 seconds)
        if (Date.now() - lastFillTimestamp.current < 3000) {
            setDetectedFields(currentFields);
            return;
        }

        try {
            const hasKey = await storageService.getOpenAIKey();
            if (!hasKey) return;

            // Only analyze 'questions' or low confidence fields to save tokens
            const candidates = currentFields.filter(f => f.category === 'questions' || f.confidence === 'low');
            if (candidates.length === 0) return;

            setIsSegmenting(true);
            setStatusMessage({ title: "Refining Fields", text: "AI is analyzing form fields...", type: 'info' });

            const segmentation = await openAIService.segmentFields(candidates);

            // Apply updates
            const updatedFields = currentFields.reduce((acc, field) => {
                const newCat = segmentation[field.id];


                // If AI says 'ignore', track it and skip
                if (newCat === 'ignore') {
                    setIgnoredFieldIds(prev => new Set([...prev, field.id]));
                    return acc;
                }

                // Aggressive Filter: If the label is still just "Question" or "Attach", it's likely a trash field
                // BUT: Exempt file fields as they are often labeled simple "Attach"
                if (field.type !== 'file' && (field.label === 'Question' || field.label === 'Attach') && (!newCat || newCat === 'question')) {
                    return acc;
                }

                if (newCat) {
                    let mappedCat: any = newCat;
                    // Normalize categories to match our state
                    if (newCat === 'cover_letter') mappedCat = 'resume'; // Group cover letter with resume
                    if (newCat === 'question') mappedCat = 'questions';

                    acc.push({ ...field, category: mappedCat, confidence: 'high' });
                } else {
                    acc.push(field);
                }
                return acc;
            }, [] as DetectedField[]);

            setDetectedFields(updatedFields);
            setStatusMessage({
                title: "Form Optimized",
                text: `Removed ${currentFields.length - updatedFields.length} irrelevant fields.`,
                type: 'success'
            });
            setTimeout(() => setStatusMessage(null), 5000);
        } catch (e) {
            console.error('[AutofillTab] Segmentation error:', e);
        } finally {
            setIsSegmenting(false);
        }
    };


    // Derived fields for the UI component (useMemo to prevent rendering lag)
    const fields = useMemo(() => {
        if (detectedFields.length === 0) return [];

        return detectedFields.map((field) => {
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
                selector: field.selector,
                status,
                category: (category === 'questions' || category === 'eeo') ? 'questions' : category as any
            } as AutofillField;
        });
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

            setStatusMessage({
                title: "Application filled!",
                text: "Checking fields...",
                type: 'success'
            });
            setTimeout(() => setStatusMessage(null), 10000);
            lastFillTimestamp.current = Date.now();
            await detectFields(true);
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
            setStatusMessage(null);
        }
    };

    // Manual Map handler placeholder
    const handleFieldClick = async (field: AutofillField) => {
        // If it's a file field or common personal info, we don't generate text answers
        if (field.category === 'resume' || field.category === 'personal') {
            return;
        }

        // Generate AI Answer for questions
        if (field.category === 'questions') {
            // Check for job context
            if (!jobData?.description) {
                setStatusMessage({
                    title: "Job Context Missing",
                    text: "Please scan the job description first to help AI answer correctly.",
                    type: 'error'
                });
                return;
            }

            try {
                setStatusMessage({
                    title: "Generating Answer",
                    text: "AI is crafting a response...",
                    type: 'info'
                });

                // Build rich resume context (Restore V3 logic)
                const resumeSummary = [
                    resumeData?.summary || '',
                    resumeData?.skills?.join(', ') || '',
                    resumeData?.experience?.slice(0, 2).map((e: any) =>
                        `${e.title} at ${e.company}: ${e.highlights?.slice(0, 2).join('; ') || e.description || ''}`
                    ).join('\n') || ''
                ].filter(Boolean).join('\n\n');

                const answer = await openAIService.answerQuestion(
                    field.label,
                    resumeSummary,
                    jobData?.title || '',
                    jobData?.company || '',
                    jobData?.description || ''
                );

                setStatusMessage(null);

                const fieldSelector = field.selector;
                if (!fieldSelector) {
                    console.error('[AutofillTab] No selector found for field:', field.id);
                    return;
                }

                // Update the detected fields so it persists in the list
                setDetectedFields(prev => prev.map(f =>
                    f.id === field.id ? { ...f, currentValue: answer } : f
                ));

                // TRIGGER FILL ON PAGE IMMEDIATELY
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'FILL_FORM_FIELDS',
                        fieldValues: [{ selector: fieldSelector, value: answer }]
                    });
                }
            } catch (error) {
                console.error('[AutofillTab] AI Answer error:', error);
                setStatusMessage({
                    title: "Generation Failed",
                    text: "Could not generate an answer. Please try again.",
                    type: 'error'
                });
            }
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 h-full">
            <div className="px-4 py-2 bg-emerald-50/50 border-b border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/50 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <Button
                    variant={isInspecting ? "default" : "outline"}
                    size="sm"
                    className={cn(
                        "h-8 text-[10px] font-bold uppercase tracking-wider shrink-0",
                        isInspecting && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                    onClick={toggleInspection}
                >
                    <MousePointer2 className="mr-1.5 size-3" />
                    {isInspecting ? "Stop Selecting" : "Manual Map"}
                </Button>

                {availableFileFields.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase whitespace-nowrap">
                            Resume:
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
            </div>
            <Autofill
                fields={fields}
                isFilling={isFilling}
                isScanning={isScanning}
                isSegmenting={isSegmenting}
                isInspecting={isInspecting}
                statusMessage={statusMessage || undefined}
                onUndo={handleUndo}
                onUndoDismiss={() => setStatusMessage(null)}
                onScan={() => detectFields(false)}
                onManualMap={toggleInspection}
                onFill={handleFill}
                onFieldClick={handleFieldClick}
                className="h-full"
            />

            {/* Manual Mapping Modal / Selector */}
            {mappingTarget && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-xs shadow-2xl border-emerald-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold">Map Field</CardTitle>
                            <p className="text-[10px] text-muted-foreground">Select a category for: {mappingTarget.label || mappingTarget.id}</p>
                        </CardHeader>
                        <CardContent className="space-y-2 pb-4">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-xs h-8"
                                onClick={() => handleManualMap('personal')}
                            >
                                Personal Info
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-xs h-8"
                                onClick={() => handleManualMap('questions')}
                            >
                                Application Question
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-xs h-8"
                                onClick={() => handleManualMap('resume')}
                            >
                                Resume / Document
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full text-xs h-8 text-muted-foreground mt-2"
                                onClick={() => setMappingTarget(null)}
                            >
                                Cancel
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
