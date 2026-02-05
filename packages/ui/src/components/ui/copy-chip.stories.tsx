import type { Meta, StoryObj } from "@storybook/react-vite"
import { CopyChip } from "./copy-chip"
import { Mail, Phone, MapPin } from "lucide-react"

const meta = {
  title: "UI/CopyChip",
  component: CopyChip,
  tags: ["autodocs"],
} satisfies Meta<typeof CopyChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: "hello@example.com",
    label: "hello@example.com",
  },
}

export const WithIcon: Story = {
  args: {
    value: "hello@example.com",
    label: "hello@example.com",
    icon: <Mail />,
  },
}

export const VariousIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CopyChip value="hello@example.com" label="hello@example.com" icon={<Mail />} />
      <CopyChip value="+1 555-123-4567" label="+1 555-123-4567" icon={<Phone />} />
      <CopyChip value="San Francisco, CA" label="San Francisco, CA" icon={<MapPin />} />
    </div>
  ),
}
