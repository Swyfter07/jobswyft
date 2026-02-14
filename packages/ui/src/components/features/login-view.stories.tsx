import type { Meta, StoryObj } from "@storybook/react-vite"
import { LoginView } from "./login-view"

const meta = {
    title: "Features/Login View",
    component: LoginView,
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
} satisfies Meta<typeof LoginView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {},
}

export const Loading: Story = {
    args: {
        isLoading: true,
    },
}

export const Error: Story = {
    args: {
        error: "Sign-in failed. Please check your connection and try again.",
    },
}

export const DarkMode: Story = {
    name: "Dark Mode",
    decorators: [
        (Story) => (
            <div className="dark w-[400px] h-[600px] bg-background rounded-xl">
                <Story />
            </div>
        ),
    ],
    args: {},
}

export const ExtensionViewport: Story = {
    name: "Extension Viewport (360×600)",
    decorators: [
        (Story) => (
            <div className="w-[360px] h-[600px]">
                <Story />
            </div>
        ),
    ],
    args: {},
}
