import type { Preview } from "@storybook/react-vite"
import "../src/styles/globals.css"

const preview: Preview = {
  tags: ["autodocs"],
  initialGlobals: {
    theme: "light",
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      toolbar: {
        icon: "circlehollow",
        items: [
          { title: "Light", value: "light" },
          { title: "Dark", value: "dark" },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light"
      return (
        <div className={theme === "dark" ? "dark" : ""}>
          <div className="min-h-screen bg-background text-foreground p-4">
            <Story />
          </div>
        </div>
      )
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "667px" },
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1440px", height: "900px" },
        },
        extensionDefault: {
          name: "Extension Default",
          styles: { width: "360px", height: "600px" },
        },
        extensionWide: {
          name: "Extension Wide",
          styles: { width: "500px", height: "600px" },
        },
      },
    },
  },
}

export default preview
