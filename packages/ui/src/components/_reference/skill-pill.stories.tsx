import type { Meta, StoryObj } from "@storybook/react-vite"
import { SkillPill } from "./skill-pill"

const meta = {
    title: "Custom/SkillPill",
    component: SkillPill,
    parameters: { layout: "centered" },
    tags: ["autodocs"],
} satisfies Meta<typeof SkillPill>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { name: "React", variant: "neutral" },
}

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            <SkillPill name="React" variant="matched" />
            <SkillPill name="TypeScript" variant="matched" />
            <SkillPill name="GraphQL" variant="missing" />
            <SkillPill name="AWS" variant="missing" />
            <SkillPill name="Tailwind" variant="neutral" />
        </div>
    ),
}
