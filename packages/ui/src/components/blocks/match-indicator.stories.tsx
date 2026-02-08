import type { Meta, StoryObj } from "@storybook/react-vite"
import { MatchIndicator } from "./match-indicator"

const meta = {
    title: "Blocks/MatchIndicator",
    component: MatchIndicator,
    parameters: { layout: "centered" },
    tags: ["autodocs"],
} satisfies Meta<typeof MatchIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const HighMatch: Story = {
    args: { score: 92, showLabel: true },
}

export const MediumMatch: Story = {
    args: { score: 65, showLabel: true },
}

export const LowMatch: Story = {
    args: { score: 30, showLabel: true },
}

export const CompactNoLabel: Story = {
    args: { score: 85, showLabel: false },
}

export const AllThresholds: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <MatchIndicator score={92} />
            <MatchIndicator score={65} />
            <MatchIndicator score={30} />
        </div>
    ),
}
