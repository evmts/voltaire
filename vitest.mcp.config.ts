import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/mcp-evals/**/*.test.ts"],
    exclude: ["node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
    environment: "node",
    typecheck: { enabled: false },
    coverage: { enabled: false },
  },
});
