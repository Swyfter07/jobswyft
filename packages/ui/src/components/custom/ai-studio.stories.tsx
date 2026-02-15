import type { Meta, StoryObj } from "@storybook/react-vite"
import { AIStudio } from "./ai-studio"

const meta = {
    title: "Custom/AiStudio",
    component: AIStudio,
    parameters: {
        layout: "centered",
        viewport: { defaultViewport: "extensionDefault" },
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-[360px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof AIStudio>

export default meta
type Story = StoryObj<typeof meta>

const defaultMatchData = {
    score: 85,
    matchedSkills: ["React", "TypeScript", "Tailwind"],
    missingSkills: ["GraphQL", "AWS"],
}

export const Default: Story = {
    args: {
        isLocked: false,
        matchData: defaultMatchData,
        defaultTab: "match",
    },
}

export const MatchTab: Story = {
    args: {
        isLocked: false,
        matchData: defaultMatchData,
        defaultTab: "match",
    },
}

export const CoverLetterTab: Story = {
    args: {
        isLocked: false,
        matchData: defaultMatchData,
        defaultTab: "cover-letter",
    },
}

export const OutreachTab: Story = {
    args: {
        isLocked: false,
        matchData: defaultMatchData,
        defaultTab: "outreach",
    },
}

export const ChatTab: Story = {
    args: {
        isLocked: false,
        matchData: defaultMatchData,
        defaultTab: "chat",
    },
}

export const Locked: Story = {
    args: {
        isLocked: true,
        matchData: defaultMatchData,
        onUnlock: () => {},
    },
}

export const Generating: Story = {
    args: {
        isLocked: false,
        isGenerating: true,
        generatingLabel: "Generating cover letter...",
        matchData: defaultMatchData,
        defaultTab: "cover-letter",
    },
}

export const DarkMode: Story = {
    decorators: [
        (Story) => (
            <div className="dark w-[360px] bg-background rounded-xl p-4">
                <Story />
            </div>
        ),
    ],
    args: {
        isLocked: false,
        matchData: defaultMatchData,
    },
}

export const ExtensionViewport: Story = {
    parameters: {
        viewport: { defaultViewport: "extensionDefault" },
    },
    decorators: [
        (Story) => (
            <div className="w-[360px]">
                <Story />
            </div>
        ),
    ],
    args: {
        isLocked: false,
        matchData: defaultMatchData,
    },
}

export const OverflowContent: Story = {
    parameters: {
        viewport: { defaultViewport: "extensionDefault" },
    },
    decorators: [
        (Story) => (
            <div className="w-[360px]">
                <Story />
            </div>
        ),
    ],
    args: {
        isLocked: false,
        matchData: {
            score: 92,
            matchedSkills: [
                "React", "TypeScript", "Tailwind CSS", "Node.js", "Express", 
                "PostgreSQL", "REST APIs", "Git", "Docker", "AWS", 
                "CI/CD", "Jest", "React Testing Library", "Storybook",
                "Webpack", "Vite", "GraphQL", "Redis", "MongoDB"
            ],
            missingSkills: [
                "Kubernetes", "Terraform", "Go", "Python", "Ruby on Rails",
                "Vue.js", "Angular", "Svelte", "Microservices", "gRPC"
            ],
        },
        defaultTab: "match",
    },
}
