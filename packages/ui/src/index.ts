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

// Components — custom compositions
export {
  ResumeCard,
  CopyChip,
  CopyButton,
  ResumeSection,
  ResumeEmptyState,
} from "@/components/custom/resume-card"
export { AppHeader } from "@/components/custom/app-header"
export { JobCard } from "@/components/custom/job-card"
export { CreditBar } from "@/components/custom/credit-bar"
export { CreditBalance } from "@/components/custom/credit-balance"
export { LoggedOutView } from "@/components/custom/logged-out-view"
export { ExtensionSidebar } from "@/components/custom/extension-sidebar"
export { Coach } from "@/components/custom/coach"
export { Autofill } from "@/components/custom/autofill"
export { AIStudio } from "@/components/custom/ai-studio"

// Components — shared primitives
export { IconBadge } from "@/components/custom/icon-badge"
export { SkillPill, SkillSectionLabel } from "@/components/custom/skill-pill"
export { MatchIndicator } from "@/components/custom/match-indicator"
export { SelectionChips } from "@/components/custom/selection-chips"

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
} from "@/components/custom/resume-card"
export type { AppHeaderProps } from "@/components/custom/app-header"
export type { JobData, MatchData } from "@/components/custom/job-card"
export type { CreditBarProps } from "@/components/custom/credit-bar"
export type { CreditBalanceProps } from "@/components/custom/credit-balance"
export type { LoggedOutViewProps } from "@/components/custom/logged-out-view"
export type { ExtensionSidebarProps } from "@/components/custom/extension-sidebar"
export type { CoachProps, Message } from "@/components/custom/coach"
export type { AutofillProps, AutofillField } from "@/components/custom/autofill"
export type { AIStudioProps, AIStudioMatchData } from "@/components/custom/ai-studio"

// Types — shared primitives
export type { IconBadgeProps } from "@/components/custom/icon-badge"
export type { SkillPillProps, SkillSectionLabelProps } from "@/components/custom/skill-pill"
export type { MatchIndicatorProps } from "@/components/custom/match-indicator"
export type { SelectionChipsProps, ChipOption } from "@/components/custom/selection-chips"

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
