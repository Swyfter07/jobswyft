import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  stories: [
    "../src/components/blocks/**/*.stories.@(ts|tsx)",
    "../src/components/features/**/*.stories.@(ts|tsx)",
    "../src/components/layout/**/*.stories.@(ts|tsx)",
    "../src/components/ui/**/*.stories.@(ts|tsx)",
  ],
  framework: "@storybook/react-vite",
}

export default config
