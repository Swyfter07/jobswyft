import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  outDir: "_output",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Jobswyft",
    description: "AI-powered job application assistant — apply 5x faster",
    permissions: ["activeTab", "storage", "identity", "sidePanel"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "Jobswyft",
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
    oauth2: {
      client_id: "642843219207-bmfn4ba9dmpqcc42uv6vecsvlrm0tu4s.apps.googleusercontent.com",
      scopes: ["openid", "email", "profile"],
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
