import type { Meta, StoryObj } from "@storybook/react-vite"
import { ResumeEmptyState } from "./resume-empty-state"

const meta = {
  title: "Features/Resume/ResumeEmptyState",
  component: ResumeEmptyState,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ResumeEmptyState>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Default empty state with upload button. */
export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <ResumeEmptyState onUpload={() => console.log("Upload clicked")} />
    </div>
  ),
}

/** No upload callback — button hidden. */
export const NoCallback: Story = {
  render: () => (
    <div className="w-[360px]">
      <ResumeEmptyState />
    </div>
  ),
}

/** Dark theme variant. */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl">
      <ResumeEmptyState onUpload={() => console.log("Upload clicked")} />
    </div>
  ),
}

/** Extension viewport (360px). */
export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <ResumeEmptyState onUpload={() => console.log("Upload clicked")} />
    </div>
  ),
}
