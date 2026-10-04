import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { editorialSite } from "./site/plugin";
export default defineConfig({
  plugins: [react(), editorialSite()],
  base: "/oto/",
  build: {
    rollupOptions: { output: { manualChunks: { notation: ["vexflow/core"] } } },
  },
});
