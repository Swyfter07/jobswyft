import type { Meta, StoryObj } from "@storybook/react-vite"
import { SkillPill, SkillSectionLabel } from "./skill-pill"

const meta = {
    title: "Blocks/SkillPill",
    component: SkillPill,
    parameters: { layout: "centered" },
    tags: ["autodocs"],
} satisfies Meta<typeof SkillPill>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { name: "TypeScript", variant: "neutral" },
}

export const Matched: Story = {
    args: { name: "React", variant: "matched" },
}

export const Missing: Story = {
    args: { name: "Python", variant: "missing" },
}

export const AllVariants: Story = {
    name: "All Variants",
    render: () => (
        <div className="flex flex-wrap gap-2">
            <SkillPill name="React" variant="matched" />
            <SkillPill name="TypeScript" variant="matched" />
            <SkillPill name="Python" variant="missing" />
            <SkillPill name="Docker" variant="missing" />
            <SkillPill name="JavaScript" variant="neutral" />
        </div>
    ),
}

export const SectionLabels: Story = {
    name: "SkillSectionLabel Variants",
    render: () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <SkillSectionLabel label="Your Matches" variant="success" />
                <div className="flex flex-wrap gap-2">
                    <SkillPill name="React" variant="matched" />
                    <SkillPill name="TypeScript" variant="matched" />
                    <SkillPill name="Node.js" variant="matched" />
                </div>
            </div>
            <div className="space-y-2">
                <SkillSectionLabel label="Missing Skills" variant="warning" />
                <div className="flex flex-wrap gap-2">
                    <SkillPill name="Python" variant="missing" />
                    <SkillPill name="Kubernetes" variant="missing" />
                </div>
            </div>
        </div>
    ),
}

export const DarkMode: Story = {
    name: "Dark Mode",
    decorators: [
        (Story) => (
            <div className="dark bg-background p-6 rounded-lg">
                <Story />
            </div>
        ),
    ],
    render: () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <SkillSectionLabel label="Your Matches" variant="success" />
                <div className="flex flex-wrap gap-2">
                    <SkillPill name="React" variant="matched" />
                    <SkillPill name="TypeScript" variant="matched" />
                </div>
            </div>
            <div className="space-y-2">
                <SkillSectionLabel label="Missing Skills" variant="warning" />
                <div className="flex flex-wrap gap-2">
                    <SkillPill name="Python" variant="missing" />
                </div>
            </div>
        </div>
    ),
}

export const ExtensionViewport: Story = {
    name: "Extension Viewport (360×600)",
    parameters: {
        viewport: { defaultViewport: "extensionDefault" },
    },
    render: () => (
        <div className="w-[360px] p-3 space-y-3">
            <SkillSectionLabel label="Your Matches" variant="success" />
            <div className="flex flex-wrap gap-2">
                <SkillPill name="React" variant="matched" />
                <SkillPill name="TypeScript" variant="matched" />
                <SkillPill name="Node.js" variant="matched" />
                <SkillPill name="Tailwind CSS" variant="matched" />
                <SkillPill name="GraphQL" variant="matched" />
            </div>
            <SkillSectionLabel label="Missing Skills" variant="warning" />
            <div className="flex flex-wrap gap-2">
                <SkillPill name="Python" variant="missing" />
                <SkillPill name="Kubernetes" variant="missing" />
                <SkillPill name="AWS" variant="missing" />
            </div>
        </div>
    ),
}
