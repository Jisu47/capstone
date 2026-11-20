import path from "node:path";
import { fileURLToPath } from "node:url";
const directory = path.dirname(fileURLToPath(import.meta.url));
const config = {
  // Keep disposable bundles out of repository-wide source linting.
  distDir: "node_modules/.cache/next-preview",
  devIndicators: false,
  turbopack: { root: path.resolve(directory, "../..") },
  async rewrites() {
    return [
      { source: "/group/:id/plan/agent", destination: "/presentation-preview/plan" },
      { source: "/group/:id/materials", destination: "/presentation-preview/materials" },
      { source: "/group/:id/plan", destination: "/presentation-preview/todo" },
      { source: "/group/:id/study", destination: "/presentation-preview/todo" },
      { source: "/group/:id", destination: "/presentation-preview/group" }
    ];
  }
};
export default config;
