import type { Meta, StoryObj } from "@storybook/react-vite"
import { ScanEmptyState } from "./scan-empty-state"

const meta: Meta<typeof ScanEmptyState> = {
  title: "Features/ScanEmptyState",
  component: ScanEmptyState,
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "extension" },
  },
  decorators: [
    (Story) => (
      <div className="w-[340px]">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof ScanEmptyState>

export const Default: Story = {
  args: {
    canManualScan: false,
  },
}

export const WithManualScan: Story = {
  args: {
    canManualScan: true,
  },
}
