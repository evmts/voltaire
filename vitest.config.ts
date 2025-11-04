import { defineConfig } from "vitest/config";

// https://vitest.dev/config/ - for docs
export default defineConfig({
	test: {
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		setupFiles: ["./vitest.setup.ts"],
		environment: "node",
		benchmark: {
			include: ["comparisons/**/*.bench.ts"],
		},
		coverage: {
			reportOnFailure: true,
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
			provider: "v8",
			reporter: ["text", "json-summary", "json"],
			thresholds: {
				autoUpdate: true,
				lines: 18.57,
				functions: 25.09,
				branches: 26.86,
				statements: 18.44,
			},
		},
	},
});
