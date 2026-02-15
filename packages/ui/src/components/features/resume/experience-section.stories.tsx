import type { Meta, StoryObj } from "@storybook/react-vite"
import { ExperienceSection } from "./experience-section"
import { fullResumeData, minimalResumeData } from "./__fixtures__/mock-resume-data"

const meta = {
  title: "Features/Resume/ExperienceSection",
  component: ExperienceSection,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ExperienceSection>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Multiple entries with rich highlights. */
export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <ExperienceSection entries={fullResumeData.experience} />
    </div>
  ),
}

/** Single internship entry. */
export const SingleEntry: Story = {
  render: () => (
    <div className="w-[360px]">
      <ExperienceSection entries={minimalResumeData.experience} />
    </div>
  ),
}

/** Many highlights to test overflow/expand behaviour. */
export const ManyHighlights: Story = {
  render: () => (
    <div className="w-[360px]">
      <ExperienceSection
        entries={[
          {
            ...fullResumeData.experience[0],
            highlights: [
              ...fullResumeData.experience[0].highlights,
              "Implemented A/B testing framework used by 8 product teams",
              "Reduced cloud infrastructure costs by 25% through right-sizing",
              "Led security audit resulting in SOC 2 Type II certification",
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
      <ExperienceSection entries={fullResumeData.experience} isEditing />
    </div>
  ),
}

/** Dark theme variant. */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl">
      <ExperienceSection entries={fullResumeData.experience} />
    </div>
  ),
}

/** Extension viewport (360px). */
export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <ExperienceSection entries={fullResumeData.experience} />
    </div>
  ),
}
