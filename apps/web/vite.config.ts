import { execSync } from "node:child_process";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Latest annotated git tag — injected as VITE_GIT_TAG so the header
// chip stays in sync with releases without a manual bump. Falls back
// to "dev" outside a git checkout (e.g. Docker build context).
function readGitTag(): string {
  try {
    return execSync("git describe --tags --abbrev=0", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

// Load env from the workspace root so VITE_LPDOCTOR_AGENT_CONTRACT,
// VITE_LPDOCTOR_API_URL, VITE_OG_NEWTON_RPC etc. resolved by /agent +
// /developers + usePermit2Migration come from the same .env the
// server reads — single source of truth across server + web.
export default defineConfig({
  plugins: [react()],
  envDir: "../../",
  define: {
    "import.meta.env.VITE_GIT_TAG": JSON.stringify(readGitTag()),
  },
  server: {
    port: 3100,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
});
