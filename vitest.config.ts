import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		benchmark: {
			include: ["comparisons/**/*.bench.ts"],
		},
		include: ["src/**/*.test.ts"],
	},
});
