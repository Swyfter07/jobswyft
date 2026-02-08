import type { Meta, StoryObj } from "@storybook/react-vite"
import { CreditBar } from "./credit-bar"

const meta = {
    title: "Blocks/CreditBar",
    component: CreditBar,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof CreditBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        credits: 38,
        maxCredits: 50,
    },
    render: (args) => (
        <div className="w-[400px] border rounded-lg overflow-hidden">
            <CreditBar {...args} />
        </div>
    )
}

export const LowCredits: Story = {
    args: {
        credits: 2,
        maxCredits: 50,
    },
    render: (args) => (
        <div className="w-[400px] border rounded-lg overflow-hidden">
            <CreditBar {...args} />
        </div>
    )
}

export const FullCredits: Story = {
    args: {
        credits: 50,
        maxCredits: 50,
    },
    render: (args) => (
        <div className="w-[400px] border rounded-lg overflow-hidden">
            <CreditBar {...args} />
        </div>
    )
}
