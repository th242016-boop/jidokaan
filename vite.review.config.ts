import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Produces only a client SPA shell for owner review. No Nitro/server workers,
// live database, provider keys, notification workers or API routes are hosted.
export default defineConfig({
  envDir: false,
  define: {
    "import.meta.env.VITE_REVIEW_PREVIEW": JSON.stringify("true"),
    "import.meta.env.VITE_AUTH_ENABLED": JSON.stringify("false"),
  },
  resolve: {tsconfigPaths: true},
  build: {outDir: ".review-build", sourcemap: false},
  plugins: [tailwindcss(), tanstackStart({
    spa: {enabled: true, prerender: {outputPath: "/index.html", autoSubfolderIndex: false}},
    prerender: {autoStaticPathsDiscovery: false, concurrency: 1},
  }), viteReact()],
});
