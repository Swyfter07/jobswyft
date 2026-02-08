import type { Meta, StoryObj } from "@storybook/react-vite"
import { User, Mail, Phone, MapPin } from "lucide-react"
import { CopyChip, CopyButton } from "./copy-chip"

const meta = {
  title: "Blocks/CopyChip",
  component: CopyChip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CopyChip>

export default meta
type Story = StoryObj<typeof meta>

/** Text-only CopyChips — click to copy value to clipboard. */
export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      <CopyChip value="marcus.chen@email.com" />
      <CopyChip value="TypeScript" />
      <CopyChip value="+1 (415) 555-0192" />
      <CopyChip value="San Francisco, CA" />
      <CopyChip value="React" />
    </div>
  ),
}

/** CopyChips with icons — used in Personal Info section. */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      <CopyChip value="Marcus Chen" icon={<User />} label="Marcus Chen" />
      <CopyChip value="marcus@email.com" icon={<Mail />} label="marcus@email.com" />
      <CopyChip value="+1 (415) 555-0192" icon={<Phone />} label="+1 (415) 555-0192" />
      <CopyChip value="San Francisco, CA" icon={<MapPin />} label="San Francisco, CA" />
    </div>
  ),
}

/** CopyChips with right-side icons. */
export const IconRight: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-4">
      <CopyChip value="marcus@email.com" icon={<Mail />} iconPosition="right" label="marcus@email.com" />
      <CopyChip value="+1 (415) 555-0192" icon={<Phone />} iconPosition="right" label="+1 (415) 555-0192" />
    </div>
  ),
}

/** Standalone CopyButton — ghost icon-only button for copy actions. */
export const CopyButtonDemo: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-4">
      <span className="text-sm text-muted-foreground">Copy this text:</span>
      <CopyButton value="Hello, clipboard!" label="Copy greeting" />
    </div>
  ),
}
