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
		poolOptions: {
			threads: {
				maxThreads: 1,
				minThreads: 1,
			},
		},
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
			// vol-effect tests run with its own vitest version (@effect/vitest)
			"voltaire-effect/**",
			"src/mcp-evals/**",
			"tests/mcp-evals/**",
			// Hardware wallet tests require optional peer dependencies (@ledgerhq/*, @trezor/*)
			"src/wallet/hardware/**",
			// Examples import @tevm/voltaire which isn't available during CI validation
			// They also require optional native deps (ffi-napi, ref-napi) for dist/
			"examples/**",
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
			exclude: ["src/**/*.test.ts", "src/**/*.test-d.ts", "src/**/*.spec.ts"],
			provider: "v8",
			reporter: ["text", "json-summary", "json"],
			thresholds: {
				autoUpdate: true,
				lines: 18.57,
				functions: 23.85,
				branches: 26.86,
				statements: 18.44,
			},
		},
	},
});
