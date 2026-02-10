// Components — shadcn primitives
export { Button, buttonVariants } from "@/components/ui/button"
export { Badge, badgeVariants } from "@/components/ui/badge"
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
export { Input } from "@/components/ui/input"
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
} from "@/components/ui/tabs"
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
export { Separator } from "@/components/ui/separator"
export { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
export { Toast, ToastContainer, toastVariants } from "@/components/ui/toast"

// Components — custom compositions
export {
  ResumeCard,
  CopyChip,
  CopyButton,
  ResumeSection,
  ResumeEmptyState,
  PersonalInfoContent,
  SkillsContent,
  ExperienceContent,
  EducationContent,
  EducationEntryCard,
} from "@/components/custom/resume-card"
export { EmptyJobState } from "@/components/custom/empty-job-state"
export { ExtensionSidebar } from "@/components/custom/extension-sidebar"
export { SidebarTabs } from "@/components/custom/sidebar-tabs"
export { JobCard } from "@/components/custom/job-card"
export { ScanTab } from "@/components/custom/scan-tab"
export { StudioTab } from "@/components/custom/studio-tab"
export { AutofillTab } from "@/components/custom/autofill-tab"
export { CoachTab } from "@/components/custom/coach-tab"
export { AIStudio } from "@/components/custom/ai-studio"
export { Coach } from "@/components/custom/coach"
export { Autofill } from "@/components/custom/autofill"
export { AppHeader } from "@/components/custom/app-header"
export { CreditBar } from "@/components/custom/credit-bar"
export { CreditBalance } from "@/components/custom/credit-balance"
export { LoggedOutView } from "@/components/custom/logged-out-view"
export { SettingsDialog } from "@/components/custom/settings-dialog"

// Types — custom compositions
export type {
  ResumePersonalInfo,
  ResumeExperienceEntry,
  ResumeEducationEntry,
  ResumeCertificationEntry,
  ResumeProjectEntry,
  ResumeData,
  ResumeSummary,
  ResumeCardProps,
  ResumeCardVariant,
} from "@/components/custom/resume-card"
export type { ExtensionSidebarProps } from "@/components/custom/extension-sidebar"
export type { SidebarTabsProps } from "@/components/custom/sidebar-tabs"
export type { JobData, MatchData } from "@/components/custom/job-card"
export type { AIStudioProps, MatchAnalysis } from "@/components/custom/ai-studio"
export type { Message as CoachMessage, CoachProps } from "@/components/custom/coach"
export type { AutofillField, AutofillProps } from "@/components/custom/autofill"
export type { AppHeaderProps } from "@/components/custom/app-header"
export type { CreditBarProps } from "@/components/custom/credit-bar"
export type { LoggedOutViewProps } from "@/components/custom/logged-out-view"
export type { ToastProps, ToastContainerProps } from "@/components/ui/toast"
export type { SettingsDialogProps, EEOPreferences } from "@/components/custom/settings-dialog"

// Utilities
export { cn } from "@/lib/utils"

// Hooks
export { useClipboard } from "@/hooks/use-clipboard"
