import type { Meta, StoryObj } from "@storybook/react-vite"
import { EducationSection } from "./education-section"
import { fullResumeData } from "./__fixtures__/mock-resume-data"

const meta = {
  title: "Features/Resume/EducationSection",
  component: EducationSection,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof EducationSection>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Single degree entry. */
export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <EducationSection entries={fullResumeData.education} />
    </div>
  ),
}

/** Single entry with highlights. */
export const SingleEntry: Story = {
  render: () => (
    <div className="w-[360px]">
      <EducationSection
        entries={[
          {
            ...fullResumeData.education[0],
            description: "Graduated magna cum laude. Dean's List all semesters.",
            highlights: [
              "Senior thesis: Distributed consensus algorithms for IoT networks",
              "Teaching Assistant for CS 162 (Operating Systems)",
            ],
          },
        ]}
      />
    </div>
  ),
}

/** Editing mode with all fields editable. */
export const Editing: Story = {
  render: () => (
    <div className="w-[360px]">
      <EducationSection entries={fullResumeData.education} isEditing />
    </div>
  ),
}

/** Dark theme variant. */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl">
      <EducationSection entries={fullResumeData.education} />
    </div>
  ),
}

/** Extension viewport (360px). */
export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <EducationSection entries={fullResumeData.education} />
    </div>
  ),
}
