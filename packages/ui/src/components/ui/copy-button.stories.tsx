import type { Meta, StoryObj } from "@storybook/react-vite"
import { CopyButton } from "./copy-button"

const meta = {
  title: "UI/CopyButton",
  component: CopyButton,
  tags: ["autodocs"],
} satisfies Meta<typeof CopyButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: "hello@example.com",
    label: "Copy email",
  },
}

export const InContext: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm">
      <span>hello@example.com</span>
      <CopyButton value="hello@example.com" label="Copy email" />
    </div>
  ),
}
