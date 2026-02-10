export interface ScrapedJobData {
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  url: string;
}

/**
 * Scrape the active tab for job posting details.
 * Executes in all frames (including iframes like Greenhouse).
 */
export async function scrapeActiveTab(): Promise<ScrapedJobData> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found");

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func: scrapePageDetails,
  });

  // Aggregate results from all frames
  const data: ScrapedJobData = {
    title: "",
    company: "",
    location: "",
    salary: "",
    description: "",
    url: tab.url || "",
  };

  for (const result of results || []) {
    const frameData = result?.result || {};
    if (frameData.title && !data.title) data.title = frameData.title;
    if (frameData.company && !data.company) data.company = frameData.company;
    if (frameData.location && !data.location) data.location = frameData.location;
    if (frameData.salary && !data.salary) data.salary = frameData.salary;
    if (
      frameData.description &&
      frameData.description.length > (data.description?.length || 0)
    ) {
      data.description = frameData.description;
    }
  }

  // Fallback title to tab title
  if (!data.title) data.title = tab.title || "";

  return data;
}

/**
 * Inject a click picker into the active tab and return the selected element's text.
 */
export async function pickElementText(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found");

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: injectedPicker,
  });

  return results?.[0]?.result || "";
}

/**
 * Inject a resume file into the active tab's file input.
 */
export async function injectResumeFile(
  fileName: string,
  base64Data: string
): Promise<boolean> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found");

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [fileName, base64Data],
    func: injectedResumeUploader,
  });

  return results?.[0]?.result || false;
}

// ========================
// INJECTED FUNCTIONS
// These run in page context - MUST be self-contained (no imports, no closures)
// ========================

function scrapePageDetails() {
  const clean = (str: string) =>
    str ? str.trim().replace(/\s+/g, " ") : "";

  // 1. Title
  let title = "";
  const h1 = document.querySelector("h1");
  if (h1) title = clean(h1.innerText);
  if (!title) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) title = clean((ogTitle as HTMLMetaElement).content);
  }
  if (!title) title = clean(document.title);

  // 2. Company via JSON-LD
  let company = "";
  let _scrapedDescription = "";
  try {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    for (const script of scripts) {
      const json = JSON.parse(script.textContent || "");
      if (json["@type"] === "JobPosting" && json.hiringOrganization) {
        company = json.hiringOrganization.name;
        if (json.description) {
          _scrapedDescription = json.description.replace(/<[^>]*>?/gm, "");
        }
        break;
      }
    }
  } catch {}

  // Company fallbacks
  if (!company) {
    const ogSiteName = document.querySelector(
      'meta[property="og:site_name"]'
    );
    if (ogSiteName) company = clean((ogSiteName as HTMLMetaElement).content);
  }
  if (!company) {
    const companyEl = document.querySelector(
      '[class*="company"], [class*="employer"], [class*="organization"]'
    );
    if (companyEl) company = clean(companyEl.textContent || "");
  }

  // 3. Location
  let location = "";
  try {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    for (const script of scripts) {
      const json = JSON.parse(script.textContent || "");
      if (json["@type"] === "JobPosting" && json.jobLocation?.address) {
        const addr = json.jobLocation.address;
        location = [addr.addressLocality, addr.addressRegion]
          .filter(Boolean)
          .join(", ");
        break;
      }
    }
  } catch {}
  if (!location) {
    const locEl = document.querySelector(
      '[class*="location"], [class*="jobLocation"]'
    );
    if (locEl) location = clean(locEl.textContent || "");
  }

  // 4. Salary
  let salary = "";
  try {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    for (const script of scripts) {
      const json = JSON.parse(script.textContent || "");
      if (json["@type"] === "JobPosting" && json.baseSalary) {
        const val = json.baseSalary.value;
        if (val) {
          salary =
            (val.minValue ? val.minValue + "-" + val.maxValue : val.value) +
            " " +
            (val.currency || "");
        }
        break;
      }
    }
  } catch {}
  if (!salary) {
    const salEl = document.querySelector(
      '[class*="salary"], [class*="compensation"]'
    );
    if (salEl) salary = clean(salEl.textContent || "");
  }

  // 5. Description
  let description = "";

  // User selection
  const selection = window.getSelection()?.toString();
  if (selection && selection.length > 50) {
    description = selection;
  }

  // JSON-LD cached
  if (!description && _scrapedDescription) {
    description = _scrapedDescription;
  }

  // Heuristic selectors
  if (!description) {
    const selectors = [
      "#jobDescriptionText",
      ".jobsearch-jobDescriptionText",
      ".jobsearch-JobComponent-description",
      ".jobs-description__content",
      ".jobs-box__html-content",
      ".description__text",
      "#job-details",
      ".show-more-less-html__markup",
      '[class*="JobDetails_jobDescription"]',
      ".jobDescriptionContent",
      '[data-test="jobDescription"]',
      ".jobDescriptionSection",
      ".job_description",
      '[data-testid="jobDescription-container"]',
      ".posting-categories",
      ".section-wrapper",
      '[data-automation-id="jobPostingDescription"]',
      ".job-description-container",
      "#content",
      ".job-post-description",
      "#job_description",
      ".job-details",
      '[class*="styles_description"]',
      ".job-sections",
      '[class*="Ashby"]',
      ".ashby-job-posting-description",
      '[data-test="job-description-text"]',
      '[id*="job_description"]',
      '[id*="job-description"]',
      '[class*="job-description"]',
      '[class*="jobDescription"]',
      '[class*="description"]',
      "#main",
      "article",
      "main",
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && (el as HTMLElement).innerText.length > 100) {
        description = clean((el as HTMLElement).innerText);
        break;
      }
    }
  }

  // Meta description fallback
  if (!description) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) description = clean((metaDesc as HTMLMetaElement).content);
  }

  return { title, company, location, salary, description, url: window.location.href };
}

function injectedPicker(): Promise<string> {
  return new Promise((resolve) => {
    const styleId = "job-jet-picker-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `.job-jet-highlight { outline: 2px solid #2563eb !important; background-color: rgba(37,99,235,0.1) !important; cursor: crosshair !important; }`;
      document.head.appendChild(style);
    }

    let hoveredElement: HTMLElement | null = null;

    function onMouseOver(e: Event) {
      e.stopPropagation();
      if (hoveredElement) hoveredElement.classList.remove("job-jet-highlight");
      hoveredElement = e.target as HTMLElement;
      hoveredElement.classList.add("job-jet-highlight");
    }
    function onMouseOut(e: Event) {
      e.stopPropagation();
      if (hoveredElement) {
        hoveredElement.classList.remove("job-jet-highlight");
        hoveredElement = null;
      }
    }
    function onClick(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
      resolve((e.target as HTMLElement).innerText.trim());
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        cleanup();
        resolve("");
      }
    }
    function cleanup() {
      document.removeEventListener("mouseover", onMouseOver, true);
      document.removeEventListener("mouseout", onMouseOut, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
      if (hoveredElement)
        hoveredElement.classList.remove("job-jet-highlight");
      document.getElementById(styleId)?.remove();
    }

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
  });
}

function injectedResumeUploader(
  fileName: string,
  base64Data: string
): boolean {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="file"]')
  );
  const targetInput = inputs[0];
  if (!targetInput) return false;

  const byteString = atob(base64Data.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: "application/pdf" });
  const file = new File([blob], fileName, {
    type: "application/pdf",
    lastModified: Date.now(),
  });

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  targetInput.files = dataTransfer.files;

  targetInput.dispatchEvent(new Event("change", { bubbles: true }));
  targetInput.dispatchEvent(new Event("input", { bubbles: true }));

  return true;
}
