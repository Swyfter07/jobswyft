import type { Meta, StoryObj } from "@storybook/react-vite"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { Button } from "./button"

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input id="name" defaultValue="John Doe" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <label htmlFor="current" className="text-sm font-medium">
                Current password
              </label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new" className="text-sm font-medium">
                New password
              </label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
}

export const LineVariant: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList variant="line">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="matches">Matches</TabsTrigger>
        <TabsTrigger value="applications">Applications</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-4">
        <p className="text-sm text-muted-foreground">
          Your dashboard overview with key metrics and recent activity.
        </p>
      </TabsContent>
      <TabsContent value="matches" className="pt-4">
        <p className="text-sm text-muted-foreground">
          View your job matches and match scores.
        </p>
      </TabsContent>
      <TabsContent value="applications" className="pt-4">
        <p className="text-sm text-muted-foreground">
          Track your submitted applications.
        </p>
      </TabsContent>
    </Tabs>
  ),
}

export const MultipleTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="tab1">Resume</TabsTrigger>
        <TabsTrigger value="tab2">Cover Letter</TabsTrigger>
        <TabsTrigger value="tab3">Responses</TabsTrigger>
        <TabsTrigger value="tab4">Notes</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="pt-2">
        <p className="text-sm">Upload and manage your resumes.</p>
      </TabsContent>
      <TabsContent value="tab2" className="pt-2">
        <p className="text-sm">AI-generated cover letters for your applications.</p>
      </TabsContent>
      <TabsContent value="tab3" className="pt-2">
        <p className="text-sm">Pre-written responses for common interview questions.</p>
      </TabsContent>
      <TabsContent value="tab4" className="pt-2">
        <p className="text-sm">Personal notes about job listings.</p>
      </TabsContent>
    </Tabs>
  ),
}
