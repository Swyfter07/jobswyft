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
export { Textarea } from "@/components/ui/textarea"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
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
export { Progress } from "@/components/ui/progress"
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"

// Components — shadcn (new)
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
export { Skeleton } from "@/components/ui/skeleton"

// Components — blocks
export { IconBadge } from "@/components/blocks/icon-badge"
export { SkillPill, SkillSectionLabel } from "@/components/blocks/skill-pill"
export { MatchIndicator } from "@/components/blocks/match-indicator"
export { SelectionChips } from "@/components/blocks/selection-chips"
export { CreditBar } from "@/components/blocks/credit-bar"
export { CreditBalance } from "@/components/blocks/credit-balance"
export { CopyChip, CopyButton } from "@/components/blocks/copy-chip"
export { CollapsibleSection } from "@/components/blocks/collapsible-section"

// Components — features
export { ResumeCard } from "@/components/features/resume/resume-card"
export { ResumeEmptyState } from "@/components/features/resume/resume-empty-state"
export { JobCard } from "@/components/features/job-card"
export { LoggedOutView } from "@/components/features/logged-out-view"
export { Coach } from "@/components/features/coach"
export { Autofill } from "@/components/features/autofill"
export { AIStudio } from "@/components/features/ai-studio"
export { NonJobPageView } from "@/components/features/non-job-page-view"

// Components — layout
export { AppHeader } from "@/components/layout/app-header"
export { ExtensionSidebar } from "@/components/layout/extension-sidebar"

// Types — blocks
export type { IconBadgeProps } from "@/components/blocks/icon-badge"
export type { SkillPillProps, SkillSectionLabelProps } from "@/components/blocks/skill-pill"
export type { MatchIndicatorProps } from "@/components/blocks/match-indicator"
export type { SelectionChipsProps, ChipOption } from "@/components/blocks/selection-chips"
export type { CreditBarProps } from "@/components/blocks/credit-bar"
export type { CreditBalanceProps } from "@/components/blocks/credit-balance"
export type { CopyChipProps, CopyButtonProps } from "@/components/blocks/copy-chip"
export type { CollapsibleSectionProps } from "@/components/blocks/collapsible-section"

// Types — features
export type {
  ResumePersonalInfo,
  ResumeExperienceEntry,
  ResumeEducationEntry,
  ResumeCertificationEntry,
  ResumeProjectEntry,
  ResumeData,
  ResumeSummary,
  ResumeCardProps,
} from "@/components/features/resume/resume-card"
export type { JobData, MatchData } from "@/components/features/job-card"
export type { LoggedOutViewProps } from "@/components/features/logged-out-view"
export type { CoachProps, Message } from "@/components/features/coach"
export type { AutofillProps, AutofillField } from "@/components/features/autofill"
export type { AIStudioProps, AIStudioMatchData } from "@/components/features/ai-studio"
export type { NonJobPageViewProps } from "@/components/features/non-job-page-view"

// Types — layout
export type { AppHeaderProps } from "@/components/layout/app-header"
export type { ExtensionSidebarProps } from "@/components/layout/extension-sidebar"

// Utilities
export { cn } from "@/lib/utils"

// API mappers
export {
  unwrap,
  unwrapPaginated,
  ApiResponseError,
  mapResumeList,
  mapResumeResponse,
  mapJobResponse,
  mapMatchAnalysis,
  mapUsageResponse,
  mapProfileResponse,
} from "@/lib/mappers"

// API types (for consumers that need raw API shapes)
export type {
  ApiResponse,
  ApiError,
  ApiPaginatedData,
  ApiProfileResponse,
  ApiResumeResponse,
  ApiResumeListItem,
  ApiParsedResumeData,
  ApiJobResponse,
  ApiJobListItem,
  ApiMatchAnalysis,
  ApiUsageResponse,
} from "@/lib/api-types"

// Mapper output types
export type { CreditData, ProfileData } from "@/lib/mappers"

// Hooks
export { useClipboard } from "@/hooks/use-clipboard"
