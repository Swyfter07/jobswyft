import type { Meta, StoryObj } from "@storybook/react-vite"
import { IconBadge } from "./icon-badge"
import { Zap, Sparkles, Brain, AlertTriangle, CheckCircle, Settings } from "lucide-react"

const meta = {
    title: "Custom/IconBadge",
    component: IconBadge,
    parameters: { layout: "centered" },
    tags: ["autodocs"],
} satisfies Meta<typeof IconBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { icon: <Zap />, variant: "primary", size: "md" },
}

export const AllVariants: Story = {
    render: () => (
        <div className="flex items-center gap-3">
            <IconBadge icon={<Zap />} variant="primary" />
            <IconBadge icon={<Brain />} variant="ai" />
            <IconBadge icon={<CheckCircle />} variant="success" />
            <IconBadge icon={<AlertTriangle />} variant="warning" />
            <IconBadge icon={<Zap />} variant="destructive" />
            <IconBadge icon={<Settings />} variant="muted" />
        </div>
    ),
}

export const AllSizes: Story = {
    render: () => (
        <div className="flex items-center gap-3">
            <IconBadge icon={<Sparkles />} variant="ai" size="sm" />
            <IconBadge icon={<Sparkles />} variant="ai" size="md" />
            <IconBadge icon={<Sparkles />} variant="ai" size="lg" />
        </div>
    ),
}
