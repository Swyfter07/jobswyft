import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface EEOPreferences {
    veteranStatus?: 'I am a veteran' | 'I am not a veteran' | 'I prefer not to answer';
    disabilityStatus?: 'Yes, I have a disability' | 'No, I do not have a disability' | 'I prefer not to answer';
    raceEthnicity?: string;
    gender?: string;
    sponsorshipRequired?: 'Yes' | 'No';
    authorizedToWork?: 'Yes' | 'No';
}

export interface SettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    apiKey: string
    onApiKeyChange: (key: string) => void
    model: string
    onModelChange: (model: string) => void
    autoAnalysis?: boolean
    onAutoAnalysisChange?: (enabled: boolean) => void
    eeoPreferences?: EEOPreferences
    onEEOPreferencesChange?: (prefs: EEOPreferences) => void
}

export function SettingsDialog({
    open,
    onOpenChange,
    apiKey,
    onApiKeyChange,
    model,
    onModelChange,
    autoAnalysis = true,
    onAutoAnalysisChange,
    eeoPreferences = {},
    onEEOPreferencesChange
}: SettingsDialogProps) {

    const updateEEO = (key: keyof EEOPreferences, value: string) => {
        onEEOPreferencesChange?.({ ...eeoPreferences, [key]: value || undefined });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Extension Settings</DialogTitle>
                    <DialogDescription>
                        Configure AI and autofill preferences.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="eeo">EEO Preferences</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>OpenAI API Key</Label>
                            <Input
                                type="password"
                                placeholder="sk-..."
                                value={apiKey || ''}
                                onChange={(e) => onApiKeyChange(e.target.value)}
                                className="text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Your key is stored locally and used only for AI features.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>AI Model</Label>
                            <Select value={model} onValueChange={onModelChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                                    <SelectItem value="gpt-4o">GPT-4o (Best)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {onAutoAnalysisChange && (
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-Analyze Jobs</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Analyze match automatically when scanning
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={autoAnalysis}
                                    onClick={() => onAutoAnalysisChange(!autoAnalysis)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoAnalysis ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoAnalysis ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="eeo" className="space-y-4 py-4">
                        <p className="text-xs text-muted-foreground pb-2">
                            These preferences auto-fill EEO compliance questions on job applications.
                        </p>

                        <div className="space-y-2">
                            <Label>Veteran Status</Label>
                            <Select value={eeoPreferences.veteranStatus || ''} onValueChange={(v) => updateEEO('veteranStatus', v)}>
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="I am a veteran">I am a veteran</SelectItem>
                                    <SelectItem value="I am not a veteran">I am not a veteran</SelectItem>
                                    <SelectItem value="I prefer not to answer">Prefer not to answer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Disability Status</Label>
                            <Select value={eeoPreferences.disabilityStatus || ''} onValueChange={(v) => updateEEO('disabilityStatus', v)}>
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes, I have a disability">Yes, I have a disability</SelectItem>
                                    <SelectItem value="No, I do not have a disability">No, I do not have a disability</SelectItem>
                                    <SelectItem value="I prefer not to answer">Prefer not to answer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Authorized to Work in US?</Label>
                                <Select value={eeoPreferences.authorizedToWork || ''} onValueChange={(v) => updateEEO('authorizedToWork', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Sponsorship Required?</Label>
                                <Select value={eeoPreferences.sponsorshipRequired || ''} onValueChange={(v) => updateEEO('sponsorshipRequired', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Yes</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select value={eeoPreferences.gender || ''} onValueChange={(v) => updateEEO('gender', v)}>
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Race/Ethnicity</Label>
                            <Select value={eeoPreferences.raceEthnicity || ''} onValueChange={(v) => updateEEO('raceEthnicity', v)}>
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="American Indian or Alaska Native">American Indian or Alaska Native</SelectItem>
                                    <SelectItem value="Asian">Asian</SelectItem>
                                    <SelectItem value="Black or African American">Black or African American</SelectItem>
                                    <SelectItem value="Hispanic or Latino">Hispanic or Latino</SelectItem>
                                    <SelectItem value="Native Hawaiian or Pacific Islander">Native Hawaiian or Pacific Islander</SelectItem>
                                    <SelectItem value="White">White</SelectItem>
                                    <SelectItem value="Two or More Races">Two or More Races</SelectItem>
                                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

