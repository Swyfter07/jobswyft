import type { Meta, StoryObj } from "@storybook/react-vite"
import { Separator } from "./separator"

const meta = {
  title: "UI/Separator",
  component: Separator,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

export const Horizontal: Story = {
  render: () => (
    <div className="w-[360px] space-y-3">
      <p className="text-sm text-foreground">Above the separator</p>
      <Separator />
      <p className="text-sm text-foreground">Below the separator</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3">
      <span className="text-sm text-foreground">Left</span>
      <Separator orientation="vertical" />
      <span className="text-sm text-foreground">Right</span>
    </div>
  ),
}

/** Separator between content blocks. */
export const WithContent: Story = {
  render: () => (
    <div className="w-[360px]">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-foreground">Personal Info</h4>
        <p className="text-xs text-muted-foreground">Name, email, and contact details.</p>
      </div>
      <Separator className="my-3" />
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-foreground">Experience</h4>
        <p className="text-xs text-muted-foreground">Work history and achievements.</p>
      </div>
    </div>
  ),
}

export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl space-y-3">
      <p className="text-sm text-foreground">Above the separator</p>
      <Separator />
      <p className="text-sm text-foreground">Below the separator</p>
    </div>
  ),
}
