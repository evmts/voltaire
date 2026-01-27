import { defineConfig } from "vitest/config";

// https://vitest.dev/config/ - for docs
export default defineConfig({
	test: {
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
			"voltaire-effect/**/*.{test,test-d,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
			"examples/**/*.test.ts",
			"docs/**/*.test.ts",
			"tests/**/*.test.ts",
		],
		exclude: [
			"src/mcp-evals/**",
			"tests/mcp-evals/**",
			"node_modules/**",
			"**/node_modules/**",
			// Hardware wallet tests require optional peer dependencies (@ledgerhq/*, @trezor/*)
			"src/wallet/hardware/**",
			// Most examples test dist/ which requires optional native deps (ffi-napi, ref-napi)
			// Exclude all examples except viem-account
			"examples/addresses/**",
			"examples/c/**",
			"examples/contract/**",
			"examples/crypto/**",
			"examples/getting-started/**",
			"examples/hashing/**",
			"examples/hex-and-bytes/**",
			"examples/precompiles/**",
			"examples/primitives/**",
			"examples/rlp/**",
			"examples/signing/**",
			"examples/swift/**",
			"examples/swift-examples/**",
			"examples/typescript/**",
			"examples/viem-publicclient/**",
			"examples/ethers-provider/**",
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
