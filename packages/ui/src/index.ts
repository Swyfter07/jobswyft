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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
export { Separator } from "@/components/ui/separator"
export { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
export { Skeleton } from "@/components/ui/skeleton"
export { Progress } from "@/components/ui/progress"
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

// Components — reusable UI
export { CopyButton } from "@/components/ui/copy-button"
export { CopyChip } from "@/components/ui/copy-chip"

// Components — custom compositions
export { ResumeCard } from "@/components/custom/resume-card"
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

// Utilities
export { cn } from "@/lib/utils"

// Hooks
export { useClipboard } from "@/hooks/use-clipboard"
