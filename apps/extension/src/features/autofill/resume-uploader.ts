/**
 * Resume File Uploader — Two-phase approach for file input fields.
 *
 * Phase A (extension context): Fetch resume PDF from signed URL as ArrayBuffer.
 * Phase B (injectable, page context): Inject bytes into file input via DataTransfer API.
 *
 * Phase A runs in extension context because fetch to signed URLs requires
 * extension CORS permissions. Phase B is injected into the page context
 * via chrome.scripting.executeScript.
 */

/**
 * Fetch resume PDF from a signed download URL as an ArrayBuffer.
 * Runs in EXTENSION context (not injected into page).
 */
export async function fetchResumeBlob(downloadUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch resume: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

/**
 * Injectable function: Set a file input's files property using DataTransfer API.
 *
 * IMPORTANT: This function is serialized by Chrome and injected into the page.
 * It MUST NOT use any imports, closures, or external references.
 *
 * @param selector - CSS selector for the file input element
 * @param fileBytes - ArrayBuffer contents as number[] (serialized for chrome.scripting)
 * @param fileName - Original file name (e.g., "resume.pdf")
 * @param mimeType - MIME type (e.g., "application/pdf")
 */
export function injectResumeFile(
  selector: string,
  fileBytes: number[],
  fileName: string,
  mimeType: string
): { success: boolean; error: string | null } {
  try {
    const el = document.querySelector<HTMLInputElement>(selector);
    if (!el) {
      return { success: false, error: `File input not found: ${selector}` };
    }

    if (!(el instanceof HTMLInputElement) || el.type !== "file") {
      return { success: false, error: `Element is not a file input: ${selector}` };
    }

    // Reconstruct the file from serialized bytes
    const uint8Array = new Uint8Array(fileBytes);
    const blob = new Blob([uint8Array], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });

    // Use DataTransfer API to set files on the input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    el.files = dataTransfer.files;

    // Dispatch change event to notify frameworks
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("input", { bubbles: true }));

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: `Resume upload error: ${String(err)}` };
  }
}
