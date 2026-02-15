import type { Meta, StoryObj } from "@storybook/react-vite"
import { Textarea } from "./textarea"

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <div className="w-[360px]">
      <Textarea />
    </div>
  ),
}

export const Placeholder: Story = {
  render: () => (
    <div className="w-[360px]">
      <Textarea placeholder="Type your message here..." />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-[360px]">
      <Textarea placeholder="Disabled textarea" disabled />
    </div>
  ),
}

export const WithValue: Story = {
  render: () => (
    <div className="w-[360px]">
      <Textarea defaultValue="This textarea already has content filled in. It demonstrates how the component looks when there is pre-existing text that the user might want to edit." />
    </div>
  ),
}

export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl">
      <Textarea placeholder="Dark mode textarea..." />
    </div>
  ),
}

export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <Textarea placeholder="Extension viewport textarea..." />
    </div>
  ),
}
