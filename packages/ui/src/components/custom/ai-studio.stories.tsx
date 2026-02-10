import type { Meta, StoryObj } from "@storybook/react"
import { AIStudio } from "./ai-studio"

const meta = {
    title: "Custom/AIStudio",
    component: AIStudio,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        isLocked: {
            control: "boolean",
            description: "Whether the AI Studio is locked (pre-scan state)",
        },
        creditBalance: {
            control: "number",
            description: "Number of remaining AI credits",
        }
    },
} satisfies Meta<typeof AIStudio>

export default meta
type Story = StoryObj<typeof meta>

export const Locked: Story = {
    args: {
        isLocked: true,
        creditBalance: 5,
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const Unlocked: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const UnlockedMatch: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "match",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const UnlockedCoverLetter: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "cover-letter",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const UnlockedAnswer: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "answer",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const UnlockedOutreach: Story = {
    args: {
        isLocked: false,
        creditBalance: 5,
        defaultTab: "outreach",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const Generating: Story = {
    args: {
        isLocked: false,
        isGenerating: true,
        generatingLabel: "Generating cover letter...",
        creditBalance: 5,
        defaultTab: "cover-letter",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

// ─── Generated Content States ────────────────────────────────────────

const SAMPLE_COVER_LETTER = `Dear Hiring Manager,

I am excited to apply for the Senior Product Designer position at Stripe. With over 5 years of experience in product design and a proven track record of building design systems at scale, I am confident in my ability to contribute to your team's success.

At Tech Corp, I led the redesign of our core platform, resulting in a 40% increase in user engagement. I collaborated closely with engineers and product managers to deliver pixel-perfect implementations while maintaining consistency across our product suite.

I am particularly drawn to Stripe's mission of building economic infrastructure for the internet, and I would love to bring my expertise in design systems and user-centered design to help shape the future of financial technology.

Thank you for considering my application. I look forward to discussing how I can contribute to Stripe's continued success.

Best regards,
Alex Chen`

const SAMPLE_ANSWER = `I am passionate about this opportunity because Stripe's mission aligns perfectly with my career goals. Throughout my career, I have focused on creating tools that empower users and simplify complex processes.

At my current role, I've had the privilege of designing financial products that serve millions of users daily. The challenge of making complex financial systems intuitive and accessible is what drives me. I believe Stripe represents the pinnacle of this challenge – building infrastructure that powers the global economy.

What excites me most is the opportunity to work on problems at scale while maintaining the craft and attention to detail that great design requires.`

const SAMPLE_OUTREACH = `Hi Sarah,

I came across your profile while researching Stripe's design team, and I was impressed by the work you've done on the Dashboard redesign.

I'm a Senior Product Designer with experience building design systems at scale, and I'm very interested in the Senior Product Designer role at Stripe.

Would you be open to a brief chat about your experience on the team?

Best,
Alex`

export const CoverLetterGenerated: Story = {
    args: {
        isLocked: false,
        creditBalance: 4,
        defaultTab: "cover-letter",
        generatedContent: {
            coverLetter: SAMPLE_COVER_LETTER,
        },
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const AnswerGenerated: Story = {
    args: {
        isLocked: false,
        creditBalance: 4,
        defaultTab: "answer",
        generatedContent: {
            answer: SAMPLE_ANSWER,
        },
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const OutreachGenerated: Story = {
    args: {
        isLocked: false,
        creditBalance: 4,
        defaultTab: "outreach",
        generatedContent: {
            outreach: SAMPLE_OUTREACH,
        },
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const MatchAnalysisWithResults: Story = {
    args: {
        isLocked: false,
        creditBalance: 4,
        defaultTab: "match",
        matchAnalysis: {
            score: 85,
            explanation: "Strong candidate with relevant experience in product design and design systems. Your background aligns well with Stripe's needs.",
            missingSkills: ["Principle", "Origami", "Motion Design"],
            tips: [
                "Highlight your experience with financial products",
                "Mention any work with complex data visualization",
                "Emphasize your cross-functional collaboration experience"
            ],
        },
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

export const MatchAnalysisLowScore: Story = {
    args: {
        isLocked: false,
        creditBalance: 4,
        defaultTab: "match",
        matchAnalysis: {
            score: 42,
            explanation: "Some relevant skills but significant gaps in required experience areas. Consider upskilling or targeting more aligned roles.",
            missingSkills: ["Figma", "Design Systems", "Prototyping", "User Research", "A/B Testing"],
            tips: [
                "Consider taking a Figma course to strengthen your tool proficiency",
                "Build a portfolio project demonstrating design system work",
                "Gain user research experience through volunteer projects"
            ],
        },
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

/** Match Analysis Error - API failure state with error message and retry button. */
export const MatchAnalysisError: Story = {
    args: {
        isLocked: false,
        creditBalance: 4,
        defaultTab: "match",
        error: "Unable to connect to AI service. Please check your API key and try again.",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}

/** Match Analysis - Rate limit error. */
export const MatchAnalysisRateLimited: Story = {
    args: {
        isLocked: false,
        creditBalance: 0,
        defaultTab: "match",
        error: "You've used all your AI credits. Upgrade to continue using AI features.",
    },
    render: (args) => (
        <div className="w-[400px] p-4">
            <AIStudio {...args} />
        </div>
    )
}
