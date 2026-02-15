/**
 * Thin Serializable HTML Collector — Collects raw page data for engine pipeline.
 *
 * IMPORTANT: This function is serialized by Chrome and injected via
 * chrome.scripting.executeScript(). It MUST NOT use imports, closures,
 * or external references. All logic is inlined.
 *
 * Runs in MAIN world via chrome.scripting.executeScript({ func, world: 'MAIN' })
 * for maximum DOM access. Returns raw data only — all extraction logic lives in engine.
 */
export function collectPageData(): {
  html: string;
  url: string;
  jsonLd: string[];
  ogMeta: Record<string, string>;
  hasShowMore: boolean;
} {
  // Collect full page HTML
  const html = document.documentElement.outerHTML;
  const url = location.href;

  // Collect JSON-LD structured data
  const jsonLd = Array.from(
    document.querySelectorAll('script[type="application/ld+json"]')
  ).map((el) => el.textContent ?? "");

  // Collect OpenGraph meta tags
  const ogMeta = Object.fromEntries(
    Array.from(document.querySelectorAll('meta[property^="og:"]')).map(
      (el) => [
        el.getAttribute("property") ?? "",
        el.getAttribute("content") ?? "",
      ]
    )
  );

  // Detect show-more button presence (reuse sentinel patterns, read-only)
  const showMoreSelectors = [
    ".show-more-less-html__button--more",
    'button[aria-label="Show full description"]',
    '[class*="show-more"]',
    '[class*="showMore"]',
    '[class*="read-more"]',
    '[class*="readMore"]',
    "details:not([open])",
  ];
  const hasShowMore = showMoreSelectors.some((sel) => {
    try {
      return document.querySelector(sel) !== null;
    } catch {
      return false;
    }
  });

  return { html, url, jsonLd, ogMeta, hasShowMore };
}
