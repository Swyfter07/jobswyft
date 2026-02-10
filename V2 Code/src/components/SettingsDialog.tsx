import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@jobswyft/ui";
import type { UseOpenAIReturn } from "@/hooks/use-openai";
import type { OpenAIModel } from "@/types/storage";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openai: UseOpenAIReturn;
}

export function SettingsDialog({
  open,
  onOpenChange,
  openai,
}: SettingsDialogProps) {
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");
    const success = openai.saveApiKey(keyInput.trim());
    if (success) {
      setKeyInput("");
      onOpenChange(false);
    } else {
      setError('Invalid API Key. Must start with "sk-".');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenAI API key and model preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* API Key */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">OpenAI API Key</label>
            {openai.hasKey ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Key saved (sk-...{openai.apiKey.slice(-4)})
                </span>
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={openai.removeApiKey}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              </div>
            )}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          {/* Model Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">AI Model</label>
            <Select
              value={openai.model}
              onValueChange={(v) => openai.setModel(v as OpenAIModel)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">
                  GPT-4o Mini (Fast & Affordable)
                </SelectItem>
                <SelectItem value="gpt-4o">
                  GPT-4o (Best Quality)
                </SelectItem>
                <SelectItem value="gpt-3.5-turbo">
                  GPT-3.5 Turbo (Legacy)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
