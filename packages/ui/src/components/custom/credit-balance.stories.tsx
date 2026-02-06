import type { Meta, StoryObj } from "@storybook/react-vite"
import { CreditBalance } from "./credit-balance"

const meta = {
    title: "Custom/CreditBalance",
    component: CreditBalance,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        onBuyMore: { action: "buy more" },
    },
} satisfies Meta<typeof CreditBalance>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        total: 100,
        used: 45,
        className: "w-[250px]",
    },
}

export const LowCredits: Story = {
    args: {
        total: 50,
        used: 45, // 5 remaining (10%)
        className: "w-[250px]",
    },
}

export const Full: Story = {
    args: {
        total: 200,
        used: 0,
        className: "w-[250px]",
    },
}
