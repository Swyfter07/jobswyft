import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet"
import { Button } from "./button"
import { Input } from "./input"

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Default right-side sheet. */
export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="sheet-name" className="text-sm font-medium">Name</label>
            <Input id="sheet-name" defaultValue="Marcus Chen" />
          </div>
        </div>
        <SheetFooter>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

/** Left side sheet. */
export const LeftSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse the sidebar menu.</SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-2">
          <p className="text-sm text-foreground">Dashboard</p>
          <p className="text-sm text-foreground">Jobs</p>
          <p className="text-sm text-foreground">Resumes</p>
          <p className="text-sm text-foreground">Settings</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
}

/** Top side sheet. */
export const TopSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Top</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notification Banner</SheetTitle>
          <SheetDescription>Important system notice.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}

/** Bottom side sheet. */
export const BottomSide: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Bottom</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Quick Actions</SheetTitle>
          <SheetDescription>Common actions at your fingertips.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
}

/** Sheet with a form. */
export const WithForm: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Form</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Certification</SheetTitle>
          <SheetDescription>Enter the details of your certification.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="cert-name" className="text-sm font-medium">Certification Name</label>
            <Input id="cert-name" placeholder="e.g. AWS Solutions Architect" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="cert-issuer" className="text-sm font-medium">Issuer</label>
            <Input id="cert-issuer" placeholder="e.g. Amazon Web Services" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="cert-date" className="text-sm font-medium">Date</label>
            <Input id="cert-date" placeholder="e.g. 2024" />
          </div>
        </div>
        <SheetFooter>
          <Button>Add Certification</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark bg-background p-4 rounded-xl">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Dark Mode Sheet</SheetTitle>
            <SheetDescription>Sheet styled in dark theme.</SheetDescription>
          </SheetHeader>
          <p className="py-4 text-sm text-muted-foreground">Content goes here.</p>
        </SheetContent>
      </Sheet>
    </div>
  ),
}
