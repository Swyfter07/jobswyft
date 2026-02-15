import type { Meta, StoryObj } from "@storybook/react-vite"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ────────────────────────────────────────────────────────

/** Avatar with image. */
export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=MC" alt="Marcus Chen" />
      <AvatarFallback>MC</AvatarFallback>
    </Avatar>
  ),
}

/** Fallback shown (no image). */
export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>JM</AvatarFallback>
    </Avatar>
  ),
}

/** Broken image — fallback displayed. */
export const ImageError: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://broken-link.example/avatar.png" alt="Broken" />
      <AvatarFallback>??</AvatarFallback>
    </Avatar>
  ),
}

/** All size variants. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="default">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const DarkMode: Story = {
  parameters: { backgrounds: { default: "dark" } },
  render: () => (
    <div className="dark bg-background p-4 rounded-xl flex items-center gap-4">
      <Avatar>
        <AvatarFallback>MC</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>JM</AvatarFallback>
      </Avatar>
    </div>
  ),
}
