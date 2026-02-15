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
    permissions: ["activeTab", "storage", "identity", "sidePanel", "scripting", "tabs", "webNavigation", "dom"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "Jobswyft",
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
    oauth2: {
      client_id: "642843219207-02rh11gudej7to96j84nj1vape3i0cbv.apps.googleusercontent.com",
      scopes: ["openid", "email", "profile"],
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
