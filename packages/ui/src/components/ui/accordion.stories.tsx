import type { Meta, StoryObj } from "@storybook/react-vite"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./accordion"

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  tags: ["autodocs"],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  render: () => (
    <Accordion type="single" defaultValue="item-1" className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>Section One</AccordionTrigger>
        <AccordionContent>
          Content for section one. This demonstrates a single-open accordion.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section Two</AccordionTrigger>
        <AccordionContent>
          Content for section two. Opening this will close section one.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Section Three</AccordionTrigger>
        <AccordionContent>
          Content for section three.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const Collapsible: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger>Collapsible Section One</AccordionTrigger>
        <AccordionContent>
          Click the trigger again to close this section.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Collapsible Section Two</AccordionTrigger>
        <AccordionContent>
          Each section can be fully collapsed.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
