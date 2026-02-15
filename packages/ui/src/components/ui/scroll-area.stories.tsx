import type { Meta, StoryObj } from "@storybook/react-vite"
import { ScrollArea, ScrollBar } from "./scroll-area"
import { Separator } from "./separator"

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

// ─── Helpers ────────────────────────────────────────────────────────

const tags = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`)

// ─── Stories ────────────────────────────────────────────────────────

/** Default vertical scroll. */
export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-[250px] rounded-md border border-border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium text-foreground">Tags</h4>
        {tags.map((tag) => (
          <div key={tag}>
            <div className="text-sm text-foreground py-1">{tag}</div>
            <Separator />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

/** Horizontal scroll. */
export const HorizontalScroll: Story = {
  render: () => (
    <ScrollArea className="w-[300px] rounded-md border border-border">
      <div className="flex gap-4 p-4">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-sm text-foreground"
          >
            {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
}

/** Long content demonstrating scrollbar visibility. */
export const LongContent: Story = {
  render: () => (
    <ScrollArea className="h-64 w-[360px] rounded-md border border-border">
      <div className="p-4 space-y-4">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark bg-background p-4 rounded-xl">
      <ScrollArea className="h-48 w-[250px] rounded-md border border-border">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium text-foreground">Tags</h4>
          {tags.slice(0, 15).map((tag) => (
            <div key={tag}>
              <div className="text-sm text-foreground py-1">{tag}</div>
              <Separator />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
}

export const ExtensionViewport: Story = {
  render: () => (
    <div className="w-[360px]">
      <ScrollArea className="h-48 w-full rounded-md border border-border">
        <div className="p-4">
          {tags.map((tag) => (
            <div key={tag}>
              <div className="text-sm text-foreground py-1">{tag}</div>
              <Separator />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
}
