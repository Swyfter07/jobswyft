import type { Meta, StoryObj } from "@storybook/react-vite"
import { CertificationsSection } from "./certifications-section"
import { fullResumeData } from "./__fixtures__/mock-resume-data"

const meta = {
  title: "Features/Resume/CertificationsSection",
  component: CertificationsSection,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof CertificationsSection>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Two certifications. */
export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <CertificationsSection entries={fullResumeData.certifications!} />
    </div>
  ),
}

/** Single certification. */
export const SingleCert: Story = {
  render: () => (
    <div className="w-[360px]">
      <CertificationsSection entries={[fullResumeData.certifications![0]]} />
    </div>
  ),
}

/** Empty array — no certifications. */
export const NoCerts: Story = {
  render: () => (
    <div className="w-[360px]">
      <CertificationsSection entries={[]} />
    </div>
  ),
}

/** Dark theme variant. */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark w-[400px] bg-background p-4 rounded-xl">
      <CertificationsSection entries={fullResumeData.certifications!} />
    </div>
  ),
}

/** Extension viewport (360px). */
export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <CertificationsSection entries={fullResumeData.certifications!} />
    </div>
  ),
}
