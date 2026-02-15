import type { Meta, StoryObj } from "@storybook/react-vite"
import { SkillsSection } from "./skills-section"
import { fullResumeData, minimalResumeData } from "./__fixtures__/mock-resume-data"

const meta = {
  title: "Features/Resume/SkillsSection",
  component: SkillsSection,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof SkillsSection>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Standard skills list with overflow (17 skills). */
export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <SkillsSection skills={fullResumeData.skills} />
    </div>
  ),
}

/** 20+ pills to test overflow and "+N more" toggle. */
export const ManySkills: Story = {
  render: () => (
    <div className="w-[360px]">
      <SkillsSection
        skills={[
          ...fullResumeData.skills,
          "Rust", "Go", "Terraform", "Ansible", "Prometheus",
          "Vue.js", "Svelte",
        ]}
      />
    </div>
  ),
}

/** Only 3 pills — no overflow toggle. */
export const FewSkills: Story = {
  render: () => (
    <div className="w-[360px]">
      <SkillsSection skills={minimalResumeData.skills.slice(0, 3)} />
    </div>
  ),
}

/** Editing mode — comma-separated textarea. */
export const Editing: Story = {
  render: () => (
    <div className="w-[360px]">
      <SkillsSection skills={fullResumeData.skills} isEditing />
    </div>
  ),
}

/** Dark theme variant. */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl">
      <SkillsSection skills={fullResumeData.skills} />
    </div>
  ),
}

/** Extension viewport (360px). */
export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <SkillsSection skills={fullResumeData.skills} />
    </div>
  ),
}
