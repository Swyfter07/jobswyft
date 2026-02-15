/**
 * Field Mapper — Maps user data (from autofill API response) to detected form fields.
 *
 * Uses field classification results to look up matching values in AutofillData.
 * Each mapping includes a confidence score based on classification confidence
 * and data completeness.
 */

import type {
  DetectedField,
  MappedField,
  AutofillData,
  AutofillFieldType,
} from "../types/field-types";

/**
 * Map detected fields to user data, producing MappedField[] with fill status.
 *
 * For each DetectedField:
 * 1. Look up matching value in AutofillData based on fieldType
 * 2. If value found → status: "ready"
 * 3. If no value → status: "missing"
 * 4. If file upload → status: "ready" if resume available, else "missing"
 * 5. Unmappable/unknown fields → status: "skipped"
 */
export function mapFieldsToData(
  fields: DetectedField[],
  data: AutofillData,
): MappedField[] {
  return fields.map((field) => {
    // Skip unknown fields
    if (field.fieldType === "unknown") {
      return {
        ...field,
        status: "skipped" as const,
        mappedValue: null,
        valueSource: null,
      };
    }

    const { value, source } = getDataValue(field.fieldType, data);

    // File uploads
    if (field.fieldType === "resumeUpload") {
      return {
        ...field,
        status: data.resume?.downloadUrl ? "ready" as const : "missing" as const,
        mappedValue: data.resume?.fileName ?? null,
        valueSource: "resume" as const,
      };
    }

    if (field.fieldType === "coverLetterUpload") {
      // Cover letter upload is extension adapter scope
      return {
        ...field,
        status: "skipped" as const,
        mappedValue: null,
        valueSource: null,
      };
    }

    // Custom questions cannot be auto-mapped
    if (field.fieldType === "customQuestion") {
      return {
        ...field,
        status: "skipped" as const,
        mappedValue: null,
        valueSource: null,
      };
    }

    if (value) {
      return {
        ...field,
        status: "ready" as const,
        mappedValue: value,
        valueSource: source,
      };
    }

    return {
      ...field,
      status: "missing" as const,
      mappedValue: null,
      valueSource: null,
    };
  });
}

/**
 * Resolve the data value for a given field type from AutofillData.
 *
 * Maps AutofillFieldType → path in AutofillData structure.
 */
export function getDataValue(
  fieldType: AutofillFieldType,
  data: AutofillData,
): { value: string | null; source: MappedField["valueSource"] } {
  // Personal data fields
  switch (fieldType) {
    case "firstName":
      return { value: data.personal.firstName, source: "personal" };
    case "lastName":
      return { value: data.personal.lastName, source: "personal" };
    case "fullName":
      return {
        value: data.personal.fullName
          ?? ([data.personal.firstName, data.personal.lastName].filter(Boolean).join(" ") || null),
        source: "personal",
      };
    case "email":
      return { value: data.personal.email, source: "personal" };
    case "phone":
      return { value: data.personal.phone, source: "personal" };
    case "location":
      return { value: data.personal.location, source: "personal" };
    case "linkedinUrl":
      return { value: data.personal.linkedinUrl, source: "personal" };
    case "portfolioUrl":
      return { value: data.personal.portfolioUrl, source: "personal" };
    case "websiteUrl":
      return { value: data.personal.portfolioUrl, source: "personal" };

    // Resume data
    case "coverLetterText":
      return { value: null, source: "resume" };

    // Authorization
    case "workAuthorization":
      return { value: data.workAuthorization, source: "personal" };

    // Salary
    case "salary":
      return { value: data.salaryExpectation, source: "personal" };

    // Fields that need AI or manual input
    case "address":
    case "city":
    case "state":
    case "zipCode":
    case "country":
    case "yearsExperience":
    case "education":
    case "startDate":
    case "currentCompany":
    case "currentTitle":
    case "sponsorshipRequired":
    case "eeoGender":
    case "eeoRaceEthnicity":
    case "eeoVeteranStatus":
    case "eeoDisabilityStatus":
      return { value: null, source: null };

    default:
      return { value: null, source: null };
  }
}
