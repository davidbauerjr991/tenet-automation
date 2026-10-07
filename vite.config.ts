import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // GitHub Pages project site — served at
  // https://<user>.github.io/tenet-automation/, a subpath, not the domain
  // root — so built asset URLs need this prefix or they 404.
  base: "/tenet-automation/",
  plugins: [react()],
  resolve: {
    // lyra-ui is a live sibling checkout with its own node_modules; make sure
    // React is only ever loaded once (two copies break hooks).
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@nicecxone/lyra-ui/styles": path.resolve(__dirname, "../lyra-ui/src/styles/lyra-tokens.css"),
      "@nicecxone/lyra-ui": path.resolve(__dirname, "../lyra-ui/src/index.ts"),
    },
  },
});
