import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { User, Wrench, Layers } from "lucide-react"
import { CollapsibleSection } from "./collapsible-section"

const meta = {
  title: "Blocks/CollapsibleSection",
  component: CollapsibleSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CollapsibleSection>

export default meta
type Story = StoryObj<typeof meta>

/** Parent section (top-level wrapper like "Resume Blocks"). */
export const Parent: Story = {
  render: () => (
    <div className="w-[360px] p-4">
      <CollapsibleSection
        icon={<Layers />}
        title="Resume Blocks"
        count={6}
        isParent
        defaultOpen
      >
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Personal Info</p>
          <p>Skills</p>
          <p>Experience</p>
          <p>Education</p>
          <p>Certifications</p>
          <p>Projects</p>
        </div>
      </CollapsibleSection>
    </div>
  ),
}

/** Child section (sub-section like "Personal Info"). */
export const Child: Story = {
  render: () => (
    <div className="w-[360px] p-4">
      <CollapsibleSection
        icon={<User />}
        title="Personal Info"
        count={4}
        copyAllValue="Marcus Chen\nmarcus@email.com\n+1 555-0192\nSan Francisco, CA"
        defaultOpen
      >
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Marcus Chen</p>
          <p>marcus@email.com</p>
          <p>+1 555-0192</p>
          <p>San Francisco, CA</p>
        </div>
      </CollapsibleSection>
    </div>
  ),
}

/** Controlled accordion — only one section open at a time. */
export const Accordion: Story = {
  render: () => {
    const [openSection, setOpenSection] = React.useState<string | null>("skills")
    const handleChange = (id: string) => (open: boolean) => {
      setOpenSection(open ? id : null)
    }
    return (
      <div className="w-[360px] p-4 space-y-1">
        <CollapsibleSection
          icon={<User />}
          title="Personal Info"
          count={4}
          open={openSection === "personal"}
          onOpenChange={handleChange("personal")}
        >
          <p className="text-sm text-muted-foreground">Personal info content...</p>
        </CollapsibleSection>
        <CollapsibleSection
          icon={<Wrench />}
          title="Skills"
          count={12}
          open={openSection === "skills"}
          onOpenChange={handleChange("skills")}
        >
          <p className="text-sm text-muted-foreground">Skills content...</p>
        </CollapsibleSection>
      </div>
    )
  },
}

/** Dark mode variant — verifies section styles render correctly. */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  render: () => (
    <div className="dark bg-background w-[360px] p-4 rounded-xl space-y-1">
      <CollapsibleSection
        icon={<Layers />}
        title="Resume Blocks"
        count={6}
        isParent
        defaultOpen
      >
        <CollapsibleSection
          icon={<User />}
          title="Personal Info"
          count={4}
          defaultOpen
        >
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Marcus Chen</p>
            <p>marcus@email.com</p>
          </div>
        </CollapsibleSection>
        <CollapsibleSection
          icon={<Wrench />}
          title="Skills"
          count={12}
        >
          <p className="text-sm text-muted-foreground">Skills content...</p>
        </CollapsibleSection>
      </CollapsibleSection>
    </div>
  ),
}
