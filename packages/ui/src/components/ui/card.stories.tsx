import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { Briefcase, MapPin, Building } from "lucide-react"

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Action</Button>
      </CardFooter>
    </Card>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Job Match</CardTitle>
        <CardDescription>Frontend Developer at TechCorp</CardDescription>
        <CardAction>
          <Badge>92%</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building className="size-4" />
            <span>TechCorp Inc.</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            <span>San Francisco, CA</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="size-4" />
            <span>Full-time</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const Small: Story = {
  render: () => (
    <Card size="sm" className="w-[300px]">
      <CardHeader>
        <CardTitle>Compact Card</CardTitle>
        <CardDescription>Smaller padding and gaps</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content with reduced spacing.</p>
      </CardContent>
    </Card>
  ),
}

export const SimpleContent: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-medium">New job match found</p>
              <p className="text-xs text-muted-foreground">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-medium">Cover letter generated</p>
              <p className="text-xs text-muted-foreground">1 hour ago</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
}
