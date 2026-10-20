import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  root: "apps/web",
  base: process.env.BASE_PATH || "./",
  plugins: [react()],
  build: { outDir: "../../dist/web", emptyOutDir: true },
});
