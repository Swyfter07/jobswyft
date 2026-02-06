import type { Meta, StoryObj } from "@storybook/react-vite"
import { LoggedOutView } from "./logged-out-view"

const meta = {
    title: "Custom/LoggedOutView",
    component: LoggedOutView,
    parameters: { layout: "centered" },
    tags: ["autodocs"],
    argTypes: {
        onSignIn: { action: "sign in" },
    },
    decorators: [
        (Story) => (
            <div className="w-[400px] h-[600px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof LoggedOutView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {},
}
