import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Toast, ToastContainer } from "./toast"
import { Button } from "./button"

const meta = {
    title: "UI/Toast",
    component: Toast,
    parameters: {
        layout: "centered",
    },
    decorators: [
        (Story: any) => (
            <div className="w-[400px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        title: "Notification",
        description: "This is a default toast message.",
        onDismiss: () => { },
    },
}

export const Success: Story = {
    args: {
        variant: "success",
        title: "Success!",
        description: "Your changes have been saved successfully.",
        onDismiss: () => { },
    },
}

export const Error: Story = {
    args: {
        variant: "error",
        title: "Error",
        description: "Something went wrong. Please try again.",
        onDismiss: () => { },
    },
}

export const Loading: Story = {
    args: {
        variant: "loading",
        title: "Processing...",
        description: "Please wait while we save your data.",
    },
}

export const Info: Story = {
    args: {
        variant: "info",
        title: "Did you know?",
        description: "You can scan jobs from LinkedIn, Indeed, and Glassdoor.",
        onDismiss: () => { },
    },
}

export const WithAction: Story = {
    args: {
        variant: "success",
        title: "Fields Filled",
        description: "Successfully filled 8 form fields.",
        action: (
            <Button variant="outline" size="sm" className="shrink-0">
                Undo
            </Button>
        ),
        onDismiss: () => { },
    },
}

export const AutofillSuccess: Story = {
    args: {
        variant: "success",
        title: "Autofill Complete",
        description: "7 out of 7 fields filled successfully!",
        action: (
            <Button variant="ghost" size="sm" className="text-success hover:text-success hover:bg-success/10 shrink-0">
                Undo All
            </Button>
        ),
        onDismiss: () => { },
    },
}

export const APIKeyError: Story = {
    args: {
        variant: "error",
        title: "API Key Required",
        description: "Please add your OpenAI API key in settings to use AI features.",
        action: (
            <Button variant="outline" size="sm" className="shrink-0">
                Settings
            </Button>
        ),
        onDismiss: () => { },
    },
}

export const GeneratingAI: Story = {
    args: {
        variant: "loading",
        title: "Generating Cover Letter",
        description: "Using GPT-4o to craft your cover letter...",
    },
}

export const InContainer: Story = {
    decorators: [
        () => (
            <div className="relative w-[500px] h-[400px] bg-muted/30 rounded-lg border">
                <p className="p-4 text-sm text-muted-foreground">Application content area</p>
                <ToastContainer position="bottom-right">
                    <Toast
                        variant="success"
                        title="Cover Letter Generated"
                        description="1 credit used. 37 remaining."
                        onDismiss={() => { }}
                    />
                </ToastContainer>
            </div>
        ),
    ],
}

export const StackedToasts: Story = {
    decorators: [
        () => (
            <div className="relative w-[500px] h-[400px] bg-muted/30 rounded-lg border">
                <p className="p-4 text-sm text-muted-foreground">Multiple notifications</p>
                <ToastContainer position="bottom-right">
                    <Toast
                        variant="info"
                        title="Job Detected"
                        description="Senior Product Designer at Stripe"
                        onDismiss={() => { }}
                    />
                    <Toast
                        variant="success"
                        title="Resume Parsed"
                        description="Extracted 12 skills and 3 experiences."
                        onDismiss={() => { }}
                    />
                </ToastContainer>
            </div>
        ),
    ],
}

export const DarkMode: Story = {
    parameters: { backgrounds: { default: "dark" } },
    decorators: [
        () => (
            <div className="dark w-[400px] bg-background p-4 rounded-xl space-y-3">
                <Toast
                    variant="success"
                    title="Success!"
                    description="Your changes have been saved."
                    onDismiss={() => { }}
                />
                <Toast
                    variant="error"
                    title="Error"
                    description="Something went wrong."
                    onDismiss={() => { }}
                />
                <Toast
                    variant="info"
                    title="Info"
                    description="You can scan jobs from LinkedIn."
                    onDismiss={() => { }}
                />
                <Toast
                    title="Default"
                    description="A plain notification toast."
                    onDismiss={() => { }}
                />
            </div>
        ),
    ],
}
