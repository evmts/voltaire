import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: [
      "**/node_modules/**",
    ],
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    deps: {
      optimizer: {
        ssr: {
          include: ['@noble/curves', '@noble/hashes']
        }
      }
    }
  },
});
