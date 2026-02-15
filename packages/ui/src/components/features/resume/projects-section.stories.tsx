import type { Meta, StoryObj } from "@storybook/react-vite"
import { ProjectsSection } from "./projects-section"
import { fullResumeData } from "./__fixtures__/mock-resume-data"

const meta = {
  title: "Features/Resume/ProjectsSection",
  component: ProjectsSection,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ProjectsSection>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Two projects with different data. */
export const Default: Story = {
  render: () => (
    <div className="w-[360px]">
      <ProjectsSection entries={fullResumeData.projects!} />
    </div>
  ),
}

/** Single project entry. */
export const SingleProject: Story = {
  render: () => (
    <div className="w-[360px]">
      <ProjectsSection entries={[fullResumeData.projects![0]]} />
    </div>
  ),
}

/** Project with URL shown. */
export const WithUrls: Story = {
  render: () => (
    <div className="w-[360px]">
      <ProjectsSection
        entries={[
          {
            ...fullResumeData.projects![0],
            url: "github.com/marcuschen/opentrace",
            highlights: [
              "500+ GitHub stars",
              "Featured in Node.js weekly newsletter",
            ],
          },
        ]}
      />
    </div>
  ),
}

/** Project with empty tech stack. */
export const NoTechStack: Story = {
  render: () => (
    <div className="w-[360px]">
      <ProjectsSection
        entries={[
          {
            name: "Personal Blog",
            description: "A minimal blog platform built from scratch.",
            techStack: [],
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
      <ProjectsSection entries={fullResumeData.projects!} isEditing />
    </div>
  ),
}

/** Dark theme variant. */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl">
      <ProjectsSection entries={fullResumeData.projects!} />
    </div>
  ),
}

/** Extension viewport (360px). */
export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <ProjectsSection entries={fullResumeData.projects!} />
    </div>
  ),
}
