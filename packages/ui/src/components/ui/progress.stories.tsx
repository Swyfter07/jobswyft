import type { Meta, StoryObj } from "@storybook/react-vite"
import { Progress } from "./progress"

const meta = {
  title: "UI/Progress",
  component: Progress,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <div className="w-[360px]">
      <Progress value={50} />
    </div>
  ),
}

export const Empty: Story = {
  render: () => (
    <div className="w-[360px]">
      <Progress value={0} />
    </div>
  ),
}

export const Full: Story = {
  render: () => (
    <div className="w-[360px]">
      <Progress value={100} />
    </div>
  ),
}

/** Multiple progress bars at various values. */
export const Animated: Story = {
  render: () => (
    <div className="w-[360px] space-y-3">
      <Progress value={15} />
      <Progress value={45} />
      <Progress value={75} />
      <Progress value={95} />
    </div>
  ),
}

export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl space-y-3">
      <Progress value={30} />
      <Progress value={70} />
    </div>
  ),
}
