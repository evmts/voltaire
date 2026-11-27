import { defineConfig } from "vitest/config";

// https://vitest.dev/config/ - for docs
export default defineConfig({
	test: {
		server: {
			deps: {
				external: [/node_modules/],
			},
		},
		pool: "threads",
		testTimeout: 30000,
		hookTimeout: 30000,
		include: [
			"src/**/*.{test,test-d,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
			"examples/**/*.test.ts",
			"docs/**/*.test.ts",
			"tests/**/*.test.ts",
		],
		exclude: [
			"node_modules/**",
			"**/node_modules/**",
			"src/mcp-evals/**",
			"tests/mcp-evals/**",
			// Hardware wallet tests require optional peer dependencies (@ledgerhq/*, @trezor/*)
			"src/wallet/hardware/**",
			// Examples import @tevm/voltaire which isn't available during CI validation
			// They also require optional native deps (ffi-napi, ref-napi) for dist/
			"examples/**",
			// Tests that import from examples (which import @tevm/voltaire)
			"src/ethers-provider/**",
			// Auto-generated documentation lib copies have broken imports
			"docs/public/**",
			"docs/zig/**",
		],
		setupFiles: ["./vitest.setup.ts"],
		environment: "node",
		typecheck: {
			enabled: true,
			include: ["**/*.test-d.ts"],
		},
		benchmark: {
			include: ["comparisons/**/*.bench.ts"],
		},
		coverage: {
			reportOnFailure: true,
			include: ["src/**/*.ts"],
			// Benchmarks are not library source; counting them as uncovered
			// functions drags the global thresholds below their floor.
			exclude: [
				"src/**/*.d.ts",
				"src/**/*.test.ts",
				"src/**/*.test-d.ts",
				"src/**/*.spec.ts",
				"src/**/*.bench.ts",
			],
			provider: "v8",
			reporter: ["text", "json-summary", "json"],
			thresholds: {
				autoUpdate: true,
				// Floors sit ~1 point under the totals measured on 2026-11-24
				// (lines 65.38, functions 60.64, branches 51.67, statements 64.69).
				lines: 64,
				functions: 59,
				branches: 50,
				statements: 63,
			},
		},
	},
});
