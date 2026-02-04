import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select"

const meta = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select job type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Employment Type</SelectLabel>
          <SelectItem value="full-time">Full-time</SelectItem>
          <SelectItem value="part-time">Part-time</SelectItem>
          <SelectItem value="contract">Contract</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Work Style</SelectLabel>
          <SelectItem value="remote">Remote</SelectItem>
          <SelectItem value="hybrid">Hybrid</SelectItem>
          <SelectItem value="onsite">On-site</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const Small: Story = {
  render: () => (
    <Select>
      <SelectTrigger size="sm" className="w-[160px]">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="applied">Applied</SelectItem>
        <SelectItem value="interview">Interview</SelectItem>
        <SelectItem value="offer">Offer</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>
  ),
}
