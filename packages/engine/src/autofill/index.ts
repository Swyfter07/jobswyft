// ─── Autofill Barrel ─────────────────────────────────────────────────────────

// Detection
export { detectFormFields, findFieldByOpid } from "./field-detector";
export { deepQueryFormFields } from "./shadow-dom-traversal";
export type { DeepQueryOptions } from "./shadow-dom-traversal";

// Classification
export { classifyField, classifyFields } from "./field-classifier";
export { evaluateAllSignals } from "./signal-evaluators";

// Mapping
export { mapFieldsToData, getDataValue } from "./field-mapper";

// Fill execution
export {
  buildFillInstructions,
  executeFillInstruction,
  executeFillInstructions,
} from "./fill-script-builder";

// Native setter (PATTERN-SE9)
export {
  setFieldValue,
  setSelectValue,
  setCheckboxValue,
  setRadioValue,
  setContentEditableValue,
} from "./native-setter";

// Undo
export { captureUndoSnapshot, executeUndo } from "./undo-snapshot";
