/**
 * HTML Cleaner — Extracts and cleans page HTML for AI extraction fallback.
 *
 * Injects a cleaning function via chrome.scripting.executeScript to extract
 * the main content area, strip non-content elements, and truncate to a
 * reasonable size for LLM processing.
 *
 * AC: #6 (AI Extraction Fallback)
 */

/**
 * Self-contained cleaning function injected into the page.
 * MUST have zero imports/closures (same constraint as scrapeJobPage).
 */
function cleanPageHtml(): string {
  // Prefer main content area
  const main =
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector('[role="main"]') ||
    document.body;

  // Clone to avoid mutating the page
  const clone = main.cloneNode(true) as HTMLElement;

  // Remove non-content elements
  const removeSelectors = [
    "script",
    "style",
    "nav",
    "footer",
    "header",
    "aside",
    "iframe",
    "noscript",
    "svg",
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[aria-hidden="true"]',
  ];

  for (const sel of removeSelectors) {
    const els = clone.querySelectorAll(sel);
    for (const el of els) {
      el.remove();
    }
  }

  // Get cleaned HTML
  let html = clone.innerHTML;

  // Truncate to 8000 chars max — cut at last complete tag to avoid malformed HTML
  if (html.length > 8000) {
    html = html.substring(0, 8000);
    const lastClose = html.lastIndexOf(">");
    if (lastClose > 0) {
      html = html.substring(0, lastClose + 1);
    }
  }

  return html;
}

/**
 * Inject the HTML cleaning function into the page and return cleaned HTML.
 */
export async function cleanHtmlForAI(tabId: number): Promise<string> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: cleanPageHtml,
  });

  const html = results?.[0]?.result;
  if (!html || typeof html !== "string") {
    return "";
  }

  return html;
}
