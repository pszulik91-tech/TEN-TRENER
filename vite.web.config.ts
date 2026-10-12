import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The same game and engine as the legacy Sites entry; no server is required.
export default defineConfig({
  plugins: [react()],
  publicDir: "publisher-public",
  define: { __PUBLISHER_SAFE__: "true" },
  resolve: { alias: [{find: /\/league-catalog\.mjs$|^\.\/league-catalog\.mjs$/, replacement: fileURLToPath(new URL("./lib/publisher-catalog.mjs", import.meta.url))}, {find: "@", replacement: fileURLToPath(new URL(".", import.meta.url)) }] },
  server: { host: "127.0.0.1", port: 5173 },
  preview: { host: "127.0.0.1", port: 4173 },
  build: { outDir: "dist", sourcemap: false },
});
