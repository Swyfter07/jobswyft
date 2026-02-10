import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    srcDir: "src",
    modules: ["@wxt-dev/module-react"],
    manifest: {
        name: "JobSwyft V3",
        version: "3.0.0",
        description: "AI-powered job application assistant",
        permissions: [
            "sidePanel",
            "storage",
            "activeTab",
            "scripting",
            "tabs",
            "webNavigation",
        ],
        host_permissions: ["<all_urls>"],
        action: {
            default_title: "Open JobSwyft",
        },
        side_panel: {
            default_path: "sidepanel.html",
        },
    },
    vite: () => ({
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                "@": "/src",
            },
        },
    }),
});
