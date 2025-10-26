import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		benchmark: {
			// Include benchmark files
			include: ["comparisons/**/*.bench.ts"],
		},
		// Regular test configuration
		include: ["src/**/*.test.ts"],
	},
});
