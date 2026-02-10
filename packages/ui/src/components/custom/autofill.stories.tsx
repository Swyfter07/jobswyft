import type { Meta, StoryObj } from "@storybook/react"
import { Autofill, AutofillField } from "./autofill"

const meta = {
    title: "Custom/Autofill",
    component: Autofill,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof Autofill>

export default meta
type Story = StoryObj<typeof meta>

const MOCK_FIELDS: AutofillField[] = [
    { id: "1", label: "Full Name", value: "Alex Chen", status: "ready", category: "personal" },
    { id: "2", label: "Email", value: "alex@example.com", status: "ready", category: "personal" },
    { id: "3", label: "Phone", value: "+1 (555) 123-4567", status: "ready", category: "personal" },
    { id: "4", label: "Resume", value: "Senior_Product_Designer.pdf", status: "ready", category: "resume" },
    { id: "5", label: "Cover Letter", status: "missing", category: "resume" },
    { id: "6", label: "LinkedIn URL", value: "linkedin.com/in/alex", status: "filled", category: "questions" },
    { id: "7", label: "Portfolio", value: "alex.design", status: "ready", category: "questions" },
    { id: "8", label: "Why do you want to work here?", value: "I admire the company's...", status: "ready", category: "questions" },
]

export const Default: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS,
    },
}

export const Filling: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS,
        isFilling: true,
    },
}

export const Incomplete: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: [
            ...MOCK_FIELDS.slice(0, 3), // Personal info ok
            { id: "4", label: "Resume", status: "missing", category: "resume" }, // Missing resume
            { id: "5", label: "Cover Letter", status: "missing", category: "resume" },
        ]
    },
}

export const FillComplete: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS.map(f => ({ ...f, status: "filled" as const })),
        showUndoPrompt: true,
    },
}

/** No fields detected on the page - empty state. */
export const NoFieldsDetected: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: [],
    },
}

/** Partial success - some fields filled, some still ready, some missing. */
export const PartialSuccess: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: [
            { id: "1", label: "Full Name", value: "Alex Chen", status: "filled", category: "personal" },
            { id: "2", label: "Email", value: "alex@example.com", status: "filled", category: "personal" },
            { id: "3", label: "Phone", value: "+1 (555) 123-4567", status: "ready", category: "personal" },
            { id: "4", label: "Resume", value: "Senior_Product_Designer.pdf", status: "filled", category: "resume" },
            { id: "5", label: "Cover Letter", status: "missing", category: "resume" },
            { id: "6", label: "LinkedIn URL", value: "linkedin.com/in/alex", status: "filled", category: "questions" },
            { id: "7", label: "Portfolio", status: "missing", category: "questions" },
        ],
    },
}

/** Scanning state - shows loading indicator while detecting fields */
export const Scanning: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: [],
        isScanning: true,
        onScan: () => console.log("Scan triggered"),
    },
}

/** Scanning complete with fields ready */
export const ScanComplete: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS,
        isScanning: false,
        onScan: () => console.log("Scan triggered"),
    },
}

/** Smart mapping in progress - AI is analyzing fields */
export const SmartMapping: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS,
        isSmartMapping: true,
        onSmartMap: () => console.log("Smart map triggered"),
    },
}

/** All fields filled successfully - all chips are green */
export const AllFieldsFilled: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS.map(f => ({ ...f, status: "filled" as const })),
        onScan: () => console.log("Scan triggered"),
        onSmartMap: () => console.log("Smart map triggered"),
    },
}

/** Complex form with many fields (simulates Workday-style application) */
export const ComplexForm: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: [
            // Personal Info
            { id: "1", label: "First Name", value: "Alex", status: "ready", category: "personal" },
            { id: "2", label: "Last Name", value: "Chen", status: "ready", category: "personal" },
            { id: "3", label: "Email Address", value: "alex@example.com", status: "ready", category: "personal" },
            { id: "4", label: "Phone Number", value: "+1 (555) 123-4567", status: "ready", category: "personal" },
            { id: "5", label: "Address Line 1", status: "missing", category: "personal" },
            { id: "6", label: "City", value: "San Francisco", status: "ready", category: "personal" },
            { id: "7", label: "State/Province", value: "CA", status: "ready", category: "personal" },
            { id: "8", label: "Postal Code", status: "missing", category: "personal" },
            // Resume & Documents
            { id: "9", label: "Resume/CV", value: "resume.pdf", status: "ready", category: "resume" },
            { id: "10", label: "Cover Letter", status: "missing", category: "resume" },
            // Questions
            { id: "11", label: "LinkedIn URL", value: "linkedin.com/in/alex", status: "ready", category: "questions" },
            { id: "12", label: "Portfolio/Website", status: "missing", category: "questions" },
            { id: "13", label: "Years of Experience", status: "missing", category: "questions" },
            { id: "14", label: "Highest Education", status: "missing", category: "questions" },
            { id: "15", label: "Are you authorized to work?", status: "missing", category: "questions" },
            { id: "16", label: "Require Sponsorship?", status: "missing", category: "questions" },
        ],
        onScan: () => console.log("Scan triggered"),
        onSmartMap: () => console.log("Smart map triggered"),
    },
}

/** Application filled - shows undo banner notification */
export const ApplicationFilled: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS.map(f => ({ ...f, status: "filled" as const })),
        showUndoPrompt: true,
        onUndo: () => console.log("Undo triggered"),
        onUndoDismiss: () => console.log("Undo dismissed"),
        onScan: () => console.log("Scan triggered"),
    },
}

/** Dark mode - all states in dark theme */
export const DarkMode: Story = {
    args: {
        className: "w-[350px] h-[600px]",
        fields: MOCK_FIELDS,
        onScan: () => console.log("Scan triggered"),
        onSmartMap: () => console.log("Smart map triggered"),
    },
    parameters: {
        backgrounds: { default: 'dark' },
    },
    decorators: [
        (Story: React.ComponentType) => (
            <div className="dark bg-background p-4 rounded-lg">
                <Story />
            </div>
        ),
    ],
}
