/**
 * Generic frame result interface — abstracts chrome.scripting.InjectionResult
 * so the engine package has zero Chrome API dependencies.
 *
 * Extension adapters map chrome.scripting.InjectionResult[] → FrameResult[]
 * before calling engine functions.
 */
export interface FrameResult {
  /** The result returned by the injected script */
  result: Record<string, unknown> | null | undefined;
  /** The frame ID where the script was injected */
  frameId: number;
}
