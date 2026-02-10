import { useSettingsStore, type EEOPreferences } from "../stores/settings-store";
import { useCreditsStore } from "../stores/credits-store";
import { useThemeStore } from "../stores/theme-store";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { autoAnalysis, autoScan, eeoPreferences, setAutoAnalysis, setAutoScan, updateEEOField } =
    useSettingsStore();
  const { credits, maxCredits } = useCreditsStore();
  const { theme, toggleTheme } = useThemeStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 bg-card border border-border rounded-lg shadow-xl w-[90%] max-w-sm max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">&times;</button>
        </div>

        <div className="p-4 space-y-5">
          {/* Toggles */}
          <div className="space-y-3">
            <ToggleRow
              label="Auto-Analysis"
              description="Automatically analyze match when job is scanned"
              checked={autoAnalysis}
              onChange={setAutoAnalysis}
            />
            <ToggleRow
              label="Auto-Scan"
              description="Automatically scan job pages when detected"
              checked={autoScan}
              onChange={setAutoScan}
            />
            <ToggleRow
              label="Dark Mode"
              description="Toggle dark/light theme"
              checked={theme === "dark"}
              onChange={() => toggleTheme()}
            />
          </div>

          {/* Credits */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credits</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${maxCredits > 0 ? (credits / maxCredits) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {credits}/{maxCredits}
              </span>
            </div>
          </div>

          {/* EEO Preferences */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              EEO Preferences
            </h3>
            <p className="text-micro text-muted-foreground">
              Pre-fill compliance fields automatically during autofill.
            </p>

            <SelectField
              label="Veteran Status"
              value={eeoPreferences.veteranStatus ?? ""}
              onChange={(v) => updateEEOField("veteranStatus", v as EEOPreferences["veteranStatus"])}
              options={["", "I am a veteran", "I am not a veteran", "I prefer not to answer"]}
            />
            <SelectField
              label="Disability Status"
              value={eeoPreferences.disabilityStatus ?? ""}
              onChange={(v) => updateEEOField("disabilityStatus", v as EEOPreferences["disabilityStatus"])}
              options={["", "Yes, I have a disability", "No, I do not have a disability", "I prefer not to answer"]}
            />
            <InputField
              label="Race/Ethnicity"
              value={eeoPreferences.raceEthnicity ?? ""}
              onChange={(v) => updateEEOField("raceEthnicity", v)}
            />
            <InputField
              label="Gender"
              value={eeoPreferences.gender ?? ""}
              onChange={(v) => updateEEOField("gender", v)}
            />
            <SelectField
              label="Sponsorship Required"
              value={eeoPreferences.sponsorshipRequired ?? ""}
              onChange={(v) => updateEEOField("sponsorshipRequired", v as EEOPreferences["sponsorshipRequired"])}
              options={["", "Yes", "No"]}
            />
            <SelectField
              label="Authorized to Work"
              value={eeoPreferences.authorizedToWork ?? ""}
              onChange={(v) => updateEEOField("authorizedToWork", v as EEOPreferences["authorizedToWork"])}
              options={["", "Yes", "No"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-micro text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-4 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-micro text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "— Select —"}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-micro text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
      />
    </div>
  );
}
