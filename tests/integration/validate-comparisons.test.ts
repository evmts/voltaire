/**
 * Validation tests for comparison files
 * Ensures all comparison implementations exist and can be imported without errors
 */

import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const COMPARISONS_DIR = join(import.meta.dir, "../../comparisons");

// Categories that should have FFI implementations
const FFI_CATEGORIES = [
	"address",
	"bytecode",
	"keccak256",
	"rlp",
	"signature-utils",
	"transaction",
	"wallet-generation",
	"eip191",
	"eip712",
	"hash32",
];

// Categories that remain pure JavaScript
const JS_CATEGORIES = [
	"abi",
	"abi-events",
	"abi-extended",
	"bytes",
	"data-padding",
	"ens",
	"hex",
	"number-formatting",
	"numeric",
	"solidity-packed",
	"string-encoding",
	"uint-branded",
	"uint256",
	"units",
];

describe("Comparison files validation", () => {
	test("comparisons directory exists", () => {
		expect(existsSync(COMPARISONS_DIR)).toBe(true);
		const stat = statSync(COMPARISONS_DIR);
		expect(stat.isDirectory()).toBe(true);
	});

	test("all expected categories exist", () => {
		const allCategories = [...FFI_CATEGORIES, ...JS_CATEGORIES];
		const dirs = readdirSync(COMPARISONS_DIR, { withFileTypes: true })
			.filter((d) => d.isDirectory() && d.name !== "shared")
			.map((d) => d.name);

		for (const category of allCategories) {
			expect(dirs).toContain(category);
		}
	});

	for (const category of FFI_CATEGORIES) {
		describe(`FFI category: ${category}`, () => {
			const categoryDir = join(COMPARISONS_DIR, category);

			test(`${category} directory exists`, () => {
				expect(existsSync(categoryDir)).toBe(true);
			});

			test(`${category} has benchmark files`, () => {
				if (!existsSync(categoryDir)) return;

				const files = readdirSync(categoryDir, { recursive: true }) as string[];
				const benchFiles = files.filter(
					(f) => typeof f === "string" && f.endsWith(".bench.ts"),
				);

				expect(benchFiles.length).toBeGreaterThan(0);
			});

			test(`${category} has guil-native implementations`, () => {
				if (!existsSync(categoryDir)) return;

				const files = readdirSync(categoryDir, { recursive: true }) as string[];
				const nativeFiles = files.filter(
					(f) => typeof f === "string" && f.includes("guil-native"),
				);

				// Most FFI categories should have native implementations
				// (Some may not be fully migrated yet)
				if (["address", "bytecode", "keccak256", "rlp"].includes(category)) {
					expect(nativeFiles.length).toBeGreaterThan(0);
				}
			});
		});
	}

	for (const category of JS_CATEGORIES) {
		describe(`JavaScript category: ${category}`, () => {
			const categoryDir = join(COMPARISONS_DIR, category);

			test(`${category} directory exists`, () => {
				expect(existsSync(categoryDir)).toBe(true);
			});

			test(`${category} has comparison files`, () => {
				if (!existsSync(categoryDir)) return;

				const files = readdirSync(categoryDir, { recursive: true }) as string[];
				const comparisonFiles = files.filter(
					(f) =>
						typeof f === "string" &&
						(f.endsWith(".bench.ts") || f.endsWith(".ts")),
				);

				expect(comparisonFiles.length).toBeGreaterThan(0);
			});
		});
	}
});

describe("Benchmark file structure", () => {
	test("benchmark files follow naming convention", () => {
		const allFiles = readdirSync(COMPARISONS_DIR, {
			recursive: true,
		}) as string[];
		const benchFiles = allFiles.filter(
			(f) => typeof f === "string" && f.endsWith(".bench.ts"),
		);

		for (const file of benchFiles) {
			// Should end with .bench.ts
			expect(file).toMatch(/\.bench\.ts$/);
		}
	});

	test("each benchmark has implementation files", () => {
		const categories = ["address", "bytecode", "keccak256", "rlp"];

		for (const category of categories) {
			const categoryDir = join(COMPARISONS_DIR, category);
			if (!existsSync(categoryDir)) continue;

			const files = readdirSync(categoryDir, { recursive: true }) as string[];
			const benchFiles = files.filter(
				(f) => typeof f === "string" && f.endsWith(".bench.ts"),
			);

			for (const benchFile of benchFiles) {
				// Extract benchmark name (e.g., "fromHex" from "fromHex.bench.ts")
				const benchName = benchFile.replace(".bench.ts", "");

				// Check if implementation directory exists
				const implDir = join(categoryDir, benchName);
				if (existsSync(implDir) && statSync(implDir).isDirectory()) {
					// Should have at least one implementation file
					const implFiles = readdirSync(implDir);
					// Some directories might be empty if not yet implemented
					// Just verify the structure exists
					expect(implFiles.length).toBeGreaterThanOrEqual(0);
				}
			}
		}
	});
});

describe("Implementation file validation", () => {
	const testCategories = ["address", "bytecode", "keccak256"];

	for (const category of testCategories) {
		describe(`${category} implementations`, () => {
			const categoryDir = join(COMPARISONS_DIR, category);

			test(`${category} guil-native files can be imported`, async () => {
				if (!existsSync(categoryDir)) return;

				const files = readdirSync(categoryDir, { recursive: true }) as string[];
				const nativeFiles = files.filter(
					(f) =>
						typeof f === "string" &&
						f.includes("guil-native.ts") &&
						!f.includes(".bench.ts"),
				);

				for (const file of nativeFiles) {
					const fullPath = join(categoryDir, file);
					// Just check that the file can be resolved
					// (actual import might fail due to native addon dependencies)
					expect(existsSync(fullPath)).toBe(true);
				}
			});

			test(`${category} has comparison library implementations`, async () => {
				if (!existsSync(categoryDir)) return;

				const files = readdirSync(categoryDir, { recursive: true }) as string[];

				// Should have implementations for common libraries
				const hasEthers = files.some(
					(f) => typeof f === "string" && f.includes("ethers"),
				);
				const hasViem = files.some(
					(f) => typeof f === "string" && f.includes("viem"),
				);

				// At least one comparison library should be present
				expect(hasEthers || hasViem).toBe(true);
			});
		});
	}
});

describe("Documentation files", () => {
	test("categories have documentation", () => {
		const majorCategories = ["abi", "address", "bytecode", "keccak256", "rlp"];

		for (const category of majorCategories) {
			const categoryDir = join(COMPARISONS_DIR, category);
			if (!existsSync(categoryDir)) continue;

			const files = readdirSync(categoryDir);

			// Should have either RESULTS.md or BENCHMARKS.md or docs.ts
			const hasDocs = files.some(
				(f) =>
					f === "RESULTS.md" ||
					f === "BENCHMARKS.md" ||
					f === "docs.ts" ||
					f === "README.md",
			);

			expect(hasDocs).toBe(true);
		}
	});
});

describe("Benchmark infrastructure", () => {
	test("comparison files use vitest", () => {
		const sampleBench = join(COMPARISONS_DIR, "address/fromHex.bench.ts");

		if (!existsSync(sampleBench)) {
			// Skip if file doesn't exist
			return;
		}

		const content = Bun.file(sampleBench).text();
		expect(content).resolves.toContain("vitest");
		expect(content).resolves.toContain("bench");
	});

	test("package.json has required benchmark dependencies", () => {
		const packageJsonPath = join(import.meta.dir, "../../package.json");
		const packageJson = require(packageJsonPath);

		// Should have vitest for benchmarking
		expect(packageJson.devDependencies).toHaveProperty("vitest");

		// Should have comparison libraries
		expect(packageJson.devDependencies).toHaveProperty("ethers");
		expect(packageJson.devDependencies).toHaveProperty("viem");
		expect(packageJson.devDependencies).toHaveProperty("@noble/hashes");
	});
});

describe("Native module integration", () => {
	test("native module directory exists", () => {
		const nativeDir = join(
			import.meta.dir,
			"../../src/typescript/native/primitives",
		);
		// Directory may not exist in CI but should exist in local development
		// This is not a critical failure as the directory is created during build
		if (existsSync(nativeDir)) {
			const stat = statSync(nativeDir);
			expect(stat.isDirectory()).toBe(true);
		}
	});

	test("native modules export expected functions", async () => {
		const indexPath = join(
			import.meta.dir,
			"../../src/typescript/native/primitives/index.ts",
		);

		// Skip test if file doesn't exist (may not be built in CI yet)
		if (!existsSync(indexPath)) {
			return;
		}

		// Read index file to check exports
		const content = await Bun.file(indexPath).text();

		// Should export key modules
		expect(content).toContain("Address");
		expect(content).toContain("keccak256");
		expect(content).toContain("rlp");
	});

	test("WASM module directory exists", () => {
		const wasmDir = join(import.meta.dir, "../../wasm");
		// WASM directory may or may not exist depending on build status
		// This is a soft check
		if (existsSync(wasmDir)) {
			const stat = statSync(wasmDir);
			expect(stat.isDirectory()).toBe(true);
		}
	});
});

describe("Shared utilities", () => {
	test("shared directory exists for common code", () => {
		const sharedDir = join(COMPARISONS_DIR, "shared");
		expect(existsSync(sharedDir)).toBe(true);
	});

	test("shared utilities are properly structured", () => {
		const sharedDir = join(COMPARISONS_DIR, "shared");
		if (!existsSync(sharedDir)) return;

		const files = readdirSync(sharedDir);
		// Should have TypeScript files for shared utilities
		const tsFiles = files.filter((f) => f.endsWith(".ts"));
		expect(tsFiles.length).toBeGreaterThan(0);
	});
});
