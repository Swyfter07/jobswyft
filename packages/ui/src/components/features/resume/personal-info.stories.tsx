import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { PersonalInfo } from "./personal-info"
import { fullResumeData, minimalResumeData } from "./__fixtures__/mock-resume-data"

// ─── Interactive Wrapper ────────────────────────────────────────────

function InteractivePersonalInfo({
  initialData,
}: {
  initialData: typeof fullResumeData.personalInfo
}) {
  const [data, setData] = React.useState(initialData)
  return (
    <PersonalInfo
      data={data}
      isEditing
      onChange={(field, value) =>
        setData((prev) => ({ ...prev, [field]: value }))
      }
    />
  )
}

// ─── Meta ───────────────────────────────────────────────────────────

const meta = {
  title: "Features/Resume/PersonalInfo",
  component: PersonalInfo,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof PersonalInfo>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Full contact info with all fields. */
export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <PersonalInfo data={fullResumeData.personalInfo} />
    </div>
  ),
}

/** Editing mode with all fields editable. */
export const Editing: Story = {
  render: () => (
    <div className="w-[360px]">
      <InteractivePersonalInfo initialData={fullResumeData.personalInfo} />
    </div>
  ),
}

/** Minimal data — no LinkedIn or website. */
export const MinimalData: Story = {
  render: () => (
    <div className="w-[360px]">
      <PersonalInfo data={minimalResumeData.personalInfo} />
    </div>
  ),
}

/** Dark theme variant. */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl">
      <PersonalInfo data={fullResumeData.personalInfo} />
    </div>
  ),
}

/** Extension viewport (360px). */
export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <PersonalInfo data={fullResumeData.personalInfo} />
    </div>
  ),
}
