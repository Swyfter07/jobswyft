import { AutofillTab as UIAutofillTab } from "@jobswyft/ui";
import { useAutofill } from "@/hooks/use-autofill";
import { useAppCounter } from "@/hooks/use-app-counter";

export function AutofillTab() {
  const autofill = useAutofill();
  const counter = useAppCounter();

  return (
    <UIAutofillTab
      fields={autofill.fields}
      isFilling={autofill.isFilling}
      showUndoPrompt={autofill.showUndoPrompt}
      onFill={autofill.fillForm}
      onUndoDismiss={autofill.dismissUndo}
      onInjectResume={autofill.injectResume}
      applicationCount={counter.count}
      motivation={counter.motivation}
      onIncrementApplication={counter.increment}
      onResetApplicationCounter={counter.reset}
    />
  );
}
