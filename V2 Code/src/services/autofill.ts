import type { ResumeProfile } from "@/types/storage";

export interface AutofillData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  website: string;
  summary: string;
  skills: string;
  currentTitle: string;
  currentCompany: string;
  school: string;
  degree: string;
}

/**
 * Build autofill data from a parsed resume profile
 */
export function buildAutofillData(profile: ResumeProfile): AutofillData {
  const fullName = profile.personal_info?.name || "";
  const nameParts = fullName.split(" ");

  return {
    name: fullName,
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email: profile.personal_info?.email || "",
    phone: profile.personal_info?.phone || "",
    linkedin: profile.personal_info?.linkedin || "",
    portfolio: profile.personal_info?.portfolio || "",
    website: profile.personal_info?.portfolio || "",
    summary: profile.summary || "",
    skills: (profile.skills || []).join(", "),
    currentTitle: profile.experience?.[0]?.title || "",
    currentCompany: profile.experience?.[0]?.company || "",
    school: profile.education?.[0]?.school || "",
    degree: profile.education?.[0]?.degree || "",
  };
}

/**
 * Fill form fields on the active tab using profile data.
 * Returns number of fields filled.
 */
export async function fillActiveTab(
  profile: ResumeProfile
): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found");

  const data = buildAutofillData(profile);

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    args: [data],
    func: injectedFormFiller,
  });

  return (results || []).reduce(
    (sum, r) => sum + (r?.result || 0),
    0
  );
}

// ========================
// INJECTED FUNCTION
// Runs in page context - MUST be self-contained
// ========================
function injectedFormFiller(data: AutofillData): number {
  let filledCount = 0;

  // ATS-specific selectors
  const atsSelectors: Record<string, Record<string, string>> = {
    lever: {
      firstName:
        '[name="cards[eeec0675-db6d-4a4c-b8ca-0f3da3240ade][field0]"], [data-qa="first-name-input"], input[name*="firstName"]',
      lastName:
        '[name="cards[eeec0675-db6d-4a4c-b8ca-0f3da3240ade][field1]"], [data-qa="last-name-input"], input[name*="lastName"]',
      email: '[data-qa="email-input"], input[name*="email"]',
      phone: '[data-qa="phone-input"], input[name*="phone"]',
      linkedin: '[name*="linkedin"], [name*="urls[LinkedIn]"]',
      website:
        '[name*="portfolio"], [name*="urls[Portfolio]"], [name*="urls[GitHub]"]',
    },
    workday: {
      firstName:
        '[data-automation-id="legalNameSection_firstName"], [data-automation-id="firstName"]',
      lastName:
        '[data-automation-id="legalNameSection_lastName"], [data-automation-id="lastName"]',
      email:
        '[data-automation-id="email"], [data-automation-id="addressSection_email"]',
      phone:
        '[data-automation-id="phone-number"], [data-automation-id="phone"]',
    },
    greenhouse: {
      firstName: '#first_name, [name="job_application[first_name]"]',
      lastName: '#last_name, [name="job_application[last_name]"]',
      email: '#email, [name="job_application[email]"]',
      phone: '#phone, [name="job_application[phone]"]',
      linkedin: '[name="job_application[question_id][linkedin_url]"]',
    },
    smartrecruiters: {
      firstName: '[name="firstName"], [id*="firstName"]',
      lastName: '[name="lastName"], [id*="lastName"]',
      email: '[name="email"], [type="email"]',
      phone: '[name="phoneNumber"], [id*="phone"]',
    },
    icims: {
      firstName: '[id*="firstName"], [name*="firstName"]',
      lastName: '[id*="lastName"], [name*="lastName"]',
      email: '[id*="email"], [type="email"]',
      phone: '[id*="phone"], [name*="phone"]',
    },
  };

  // Attribute pattern mappings
  const fieldMappings = [
    {
      patterns: ["firstname", "first_name", "fname", "givenname", "first-name"],
      key: "firstName",
    },
    {
      patterns: [
        "lastname",
        "last_name",
        "lname",
        "familyname",
        "surname",
        "last-name",
      ],
      key: "lastName",
    },
    {
      patterns: ["fullname", "full_name", "legalname", "candidatename"],
      key: "name",
    },
    {
      patterns: ["linkedin", "linkedinprofile", "linkedinurl"],
      key: "linkedin",
    },
    {
      patterns: [
        "portfolio",
        "website",
        "github",
        "personalsite",
        "personalurl",
      ],
      key: "website",
    },
    {
      patterns: ["phone", "phonenumber", "telephone", "mobile", "cell"],
      key: "phone",
    },
    {
      patterns: [
        "summary",
        "coverletter",
        "aboutyou",
        "professionalprofile",
        "bio",
      ],
      key: "summary",
    },
    {
      patterns: ["jobtitle", "currenttitle", "position", "title"],
      key: "currentTitle",
    },
    {
      patterns: ["company", "employer", "currentcompany", "organization"],
      key: "currentCompany",
    },
    {
      patterns: [
        "school",
        "university",
        "college",
        "institution",
        "almamater",
      ],
      key: "school",
    },
    {
      patterns: ["degree", "education", "major", "fieldofstudy"],
      key: "degree",
    },
  ];

  function getAllInputs(root: Document | ShadowRoot = document) {
    const inputs: (HTMLInputElement | HTMLTextAreaElement)[] = [];
    const selector =
      'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input:not([type]), textarea';
    inputs.push(
      ...Array.from(
        root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector)
      )
    );
    root.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) {
        inputs.push(...getAllInputs(el.shadowRoot));
      }
    });
    return inputs;
  }

  function fillField(
    field: HTMLInputElement | HTMLTextAreaElement,
    value: string
  ): boolean {
    if (!value) return false;
    const currentValue = field.value || "";
    if (currentValue.trim()) return false;

    field.focus();
    field.click();

    if ((field as HTMLElement).getAttribute("contenteditable") === "true") {
      (field as HTMLElement).textContent = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    const proto =
      field.tagName === "TEXTAREA"
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;

    if (setter) {
      setter.call(field, value);
    } else {
      field.value = value;
    }

    // Reset React value tracker
    if ((field as any)._valueTracker) {
      (field as any)._valueTracker.setValue("");
    }

    field.dispatchEvent(new Event("focus", { bubbles: true }));
    field.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "a" })
    );
    field.dispatchEvent(
      new KeyboardEvent("keyup", { bubbles: true, key: "a" })
    );
    field.dispatchEvent(new Event("blur", { bubbles: true }));
    field.dispatchEvent(new Event("input", { bubbles: true }));

    return true;
  }

  function getFieldContext(field: HTMLInputElement | HTMLTextAreaElement) {
    let context = "";
    context += (field.name || "") + " ";
    context += (field.id || "") + " ";
    context += (field.placeholder || "") + " ";
    context += (field.getAttribute("autocomplete") || "") + " ";
    context += (field.getAttribute("data-testid") || "") + " ";
    context += (field.getAttribute("data-automation-id") || "") + " ";
    context += (field.getAttribute("aria-label") || "") + " ";

    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) context += label.textContent + " ";
    }
    const parent = field.parentElement;
    if (parent) {
      const label = parent.querySelector("label");
      if (label && !label.contains(field)) context += label.textContent + " ";
    }
    return context.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function matchesPattern(context: string, patterns: string[]) {
    return patterns.some((p) =>
      context.includes(p.replace(/[^a-z0-9]/g, ""))
    );
  }

  // Step 1: ATS-specific selectors
  for (const [, selectors] of Object.entries(atsSelectors)) {
    for (const [fieldKey, selector] of Object.entries(selectors)) {
      if (!(data as any)[fieldKey]) continue;
      try {
        document.querySelectorAll(selector).forEach((field) => {
          if (
            fillField(
              field as HTMLInputElement,
              (data as any)[fieldKey]
            )
          ) {
            filledCount++;
          }
        });
      } catch {}
    }
  }

  // Step 2: Type-based filling
  const allInputs = getAllInputs();
  allInputs.forEach((field) => {
    if (
      (field as HTMLInputElement).type === "hidden" ||
      field.disabled ||
      field.readOnly
    )
      return;
    if (
      (field as HTMLElement).offsetParent === null &&
      !(field as HTMLElement).closest('[class*="modal"]')
    )
      return;
    if ((field.value || "").trim()) return;

    if ((field as HTMLInputElement).type === "email" && data.email) {
      if (fillField(field, data.email)) filledCount++;
      return;
    }
    if ((field as HTMLInputElement).type === "tel" && data.phone) {
      if (fillField(field, data.phone)) filledCount++;
      return;
    }
  });

  // Step 3: Pattern matching
  allInputs.forEach((field) => {
    if (
      (field as HTMLInputElement).type === "hidden" ||
      field.disabled ||
      field.readOnly
    )
      return;
    if ((field.value || "").trim()) return;

    const context = getFieldContext(field);
    for (const mapping of fieldMappings) {
      if (
        matchesPattern(context, mapping.patterns) &&
        (data as any)[mapping.key]
      ) {
        if (fillField(field, (data as any)[mapping.key])) {
          filledCount++;
          break;
        }
      }
    }
  });

  return filledCount;
}
