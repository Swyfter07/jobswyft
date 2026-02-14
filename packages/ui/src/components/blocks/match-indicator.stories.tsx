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

export const Default: Story = {
    args: { score: 85 },
}

export const StrongFit: Story = {
    name: "Strong Fit (≥80)",
    args: { score: 92 },
}

export const GoodPotential: Story = {
    name: "Good Potential (50–79)",
    args: { score: 65 },
}

export const NeedsUpskilling: Story = {
    name: "Needs Upskilling (<50)",
    args: { score: 32 },
}

export const AllThresholds: Story = {
    name: "All Score Thresholds",
    render: () => (
        <div className="space-y-6">
            <MatchIndicator score={95} />
            <MatchIndicator score={72} />
            <MatchIndicator score={38} />
        </div>
    ),
}

export const WithoutLabel: Story = {
    name: "Without Label",
    args: { score: 85, showLabel: false },
}

export const BoundaryScores: Story = {
    name: "Boundary Scores (0, 50, 80, 100)",
    render: () => (
        <div className="space-y-6">
            <MatchIndicator score={0} />
            <MatchIndicator score={50} />
            <MatchIndicator score={80} />
            <MatchIndicator score={100} />
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
        <div className="space-y-6">
            <MatchIndicator score={90} />
            <MatchIndicator score={65} />
            <MatchIndicator score={25} />
        </div>
    ),
}

export const ExtensionViewport: Story = {
    name: "Extension Viewport (360×600)",
    parameters: {
        viewport: { defaultViewport: "extensionDefault" },
    },
    render: () => (
        <div className="w-[360px] p-3 space-y-4">
            <MatchIndicator score={85} />
            <MatchIndicator score={55} showLabel={false} />
        </div>
    ),
}
