export const API_URL =
  import.meta.env.WXT_API_URL ?? "https://api.jobswyft.com";

export const DASHBOARD_URL = "https://dashboard.jobswyft.com";

/**
 * Side Panel className override for ExtensionSidebar component.
 * Chrome Side Panel API manages dimensions, so we remove fixed positioning.
 */
export const SIDE_PANEL_CLASSNAME =
  "relative inset-auto h-screen w-full border-l-0 shadow-none z-auto";
