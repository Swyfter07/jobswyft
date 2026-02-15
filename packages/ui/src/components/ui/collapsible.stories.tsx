import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"
import { Button } from "./button"
import { ChevronsUpDown } from "lucide-react"

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

export const Default: Story = {
  render: function CollapsibleDemo() {
    const [isOpen, setIsOpen] = React.useState(false)
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[360px] space-y-2">
        <div className="flex items-center justify-between rounded-md border border-border px-4 py-2">
          <h4 className="text-sm font-semibold text-foreground">3 repositories</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Toggle repositories">
              <ChevronsUpDown className="size-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border border-border px-4 py-2 text-sm text-foreground">
          @radix-ui/primitives
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border border-border px-4 py-2 text-sm text-foreground">
            @radix-ui/colors
          </div>
          <div className="rounded-md border border-border px-4 py-2 text-sm text-foreground">
            @stitches/react
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  },
}

export const InitiallyOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-[360px] space-y-2">
      <div className="flex items-center justify-between rounded-md border border-border px-4 py-2">
        <h4 className="text-sm font-semibold text-foreground">Skills</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Toggle skills">
            <ChevronsUpDown className="size-4" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border border-border px-4 py-2 text-sm text-foreground">TypeScript</div>
        <div className="rounded-md border border-border px-4 py-2 text-sm text-foreground">React</div>
        <div className="rounded-md border border-border px-4 py-2 text-sm text-foreground">Node.js</div>
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const InitiallyClosed: Story = {
  render: () => (
    <Collapsible className="w-[360px] space-y-2">
      <div className="flex items-center justify-between rounded-md border border-border px-4 py-2">
        <h4 className="text-sm font-semibold text-foreground">Advanced Settings</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Toggle advanced settings">
            <ChevronsUpDown className="size-4" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground">
          Debug mode, API keys, and other advanced options.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark bg-background p-4 rounded-xl">
      <Collapsible defaultOpen className="w-[360px] space-y-2">
        <div className="flex items-center justify-between rounded-md border border-border px-4 py-2">
          <h4 className="text-sm font-semibold text-foreground">Dark Mode Collapsible</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Toggle content">
              <ChevronsUpDown className="size-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border border-border px-4 py-2 text-sm text-foreground">
            Content in dark mode.
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
}
