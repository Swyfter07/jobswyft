import type { Meta, StoryObj } from "@storybook/react-vite"
import { NonJobPageView } from "./non-job-page-view"

const meta = {
    title: "Features/NonJobPageView",
    component: NonJobPageView,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-[360px] bg-background p-0">
                <Story />
            </div>
        ),
    ],
    argTypes: {
        onPasteJobDescription: { action: "paste job description" },
    },
} satisfies Meta<typeof NonJobPageView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithPasteHandler: Story = {
    args: {
        onPasteJobDescription: () => {},
    },
}
