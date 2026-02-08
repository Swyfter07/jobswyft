export const MSG = {
  JOB_SCANNED: "JOB_SCANNED",
  NOT_JOB_PAGE: "NOT_JOB_PAGE",
  MANUAL_SCAN_REQUEST: "MANUAL_SCAN_REQUEST",
  SCAN_ERROR: "SCAN_ERROR",
} as const;

export type MessageType = (typeof MSG)[keyof typeof MSG];

export interface ScanMessageData {
  title?: string;
  company?: string;
  description?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  sourceUrl: string;
}

export interface ScanMessage {
  type: typeof MSG.JOB_SCANNED;
  data: ScanMessageData;
}

export interface NotJobPageMessage {
  type: typeof MSG.NOT_JOB_PAGE;
}

export interface ManualScanMessage {
  type: typeof MSG.MANUAL_SCAN_REQUEST;
}

export interface ScanErrorMessage {
  type: typeof MSG.SCAN_ERROR;
  error: string;
}

export type ExtensionMessage =
  | ScanMessage
  | NotJobPageMessage
  | ManualScanMessage
  | ScanErrorMessage;
