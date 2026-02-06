/**
 * Export Separation Tests
 *
 * These tests ENFORCE that native FFI dependencies don't leak into pure JS exports.
 *
 * Architecture requirements:
 * - @tevm/voltaire (main) - Pure JavaScript ONLY (no WASM, no FFI)
 * - @tevm/voltaire/wasm - WASM + JavaScript only
 * - @tevm/voltaire/native - Native FFI version (ffi-napi, ref-napi)
 *
 * If these tests fail, you've accidentally pulled FFI dependencies into the wrong exports.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DIST_DIR = join(import.meta.dirname, "..", "dist");

/**
 * Checks if a bundle file contains FFI imports
 */
function bundleContainsFFI(bundlePath: string): {
	hasFfiNapi: boolean;
	hasRefNapi: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!existsSync(bundlePath)) {
		return {
			hasFfiNapi: false,
			hasRefNapi: false,
			errors: [`Bundle not found: ${bundlePath}`],
		};
	}

	const content = readFileSync(bundlePath, "utf-8");

	// Check for ffi-napi imports (both ESM and CJS patterns)
	const hasFfiNapi =
		content.includes("from 'ffi-napi'") ||
		content.includes('from "ffi-napi"') ||
		content.includes("import('ffi-napi')") ||
		content.includes('import("ffi-napi")') ||
		content.includes("require('ffi-napi')") ||
		content.includes('require("ffi-napi")');

	// Check for ref-napi imports
	const hasRefNapi =
		content.includes("from 'ref-napi'") ||
		content.includes('from "ref-napi"') ||
		content.includes("import('ref-napi')") ||
		content.includes('import("ref-napi")') ||
		content.includes("require('ref-napi')") ||
		content.includes('require("ref-napi")');

	if (hasFfiNapi) {
		errors.push("Bundle contains ffi-napi import");
	}
	if (hasRefNapi) {
		errors.push("Bundle contains ref-napi import");
	}

	return { hasFfiNapi, hasRefNapi, errors };
}

/**
 * Checks if a bundle file contains HDWallet code
 */
function bundleContainsHDWallet(bundlePath: string): boolean {
	if (!existsSync(bundlePath)) {
		return false;
	}

	const content = readFileSync(bundlePath, "utf-8");

	// Check for HDWallet-specific patterns
	return (
		content.includes("HDWallet") ||
		content.includes("hdwallet_generate_mnemonic") ||
		content.includes("hdwallet_mnemonic_to_seed") ||
		content.includes("hdwallet_validate_mnemonic")
	);
}

describe("Export Separation", () => {
	describe("Main export (@tevm/voltaire)", () => {
		const mainEsm = join(DIST_DIR, "index.js");
		const mainCjs = join(DIST_DIR, "index.cjs");

		it("ESM bundle must NOT contain ffi-napi or ref-napi", () => {
			const result = bundleContainsFFI(mainEsm);
			expect(
				result.hasFfiNapi,
				`Main ESM bundle must not import ffi-napi. ${result.errors.join(", ")}`,
			).toBe(false);
			expect(
				result.hasRefNapi,
				`Main ESM bundle must not import ref-napi. ${result.errors.join(", ")}`,
			).toBe(false);
		});

		it("CJS bundle must NOT contain ffi-napi or ref-napi", () => {
			const result = bundleContainsFFI(mainCjs);
			expect(
				result.hasFfiNapi,
				`Main CJS bundle must not import ffi-napi. ${result.errors.join(", ")}`,
			).toBe(false);
			expect(
				result.hasRefNapi,
				`Main CJS bundle must not import ref-napi. ${result.errors.join(", ")}`,
			).toBe(false);
		});

		it("ESM bundle must NOT contain HDWallet FFI code", () => {
			const hasHDWallet = bundleContainsHDWallet(mainEsm);
			expect(
				hasHDWallet,
				"Main ESM bundle must not contain HDWallet FFI code",
			).toBe(false);
		});

		it("CJS bundle must NOT contain HDWallet FFI code", () => {
			const hasHDWallet = bundleContainsHDWallet(mainCjs);
			expect(
				hasHDWallet,
				"Main CJS bundle must not contain HDWallet FFI code",
			).toBe(false);
		});
	});

	describe("WASM export (@tevm/voltaire/wasm)", () => {
		const wasmEsm = join(DIST_DIR, "wasm", "index.js");
		const wasmCjs = join(DIST_DIR, "wasm", "index.cjs");

		it("ESM bundle must NOT contain ffi-napi or ref-napi", () => {
			const result = bundleContainsFFI(wasmEsm);
			expect(
				result.hasFfiNapi,
				`WASM ESM bundle must not import ffi-napi. ${result.errors.join(", ")}`,
			).toBe(false);
			expect(
				result.hasRefNapi,
				`WASM ESM bundle must not import ref-napi. ${result.errors.join(", ")}`,
			).toBe(false);
		});

		it("CJS bundle must NOT contain ffi-napi or ref-napi", () => {
			const result = bundleContainsFFI(wasmCjs);
			expect(
				result.hasFfiNapi,
				`WASM CJS bundle must not import ffi-napi. ${result.errors.join(", ")}`,
			).toBe(false);
			expect(
				result.hasRefNapi,
				`WASM CJS bundle must not import ref-napi. ${result.errors.join(", ")}`,
			).toBe(false);
		});

		it("ESM bundle must NOT contain HDWallet FFI code", () => {
			const hasHDWallet = bundleContainsHDWallet(wasmEsm);
			expect(
				hasHDWallet,
				"WASM ESM bundle must not contain HDWallet FFI code",
			).toBe(false);
		});

		it("CJS bundle must NOT contain HDWallet FFI code", () => {
			const hasHDWallet = bundleContainsHDWallet(wasmCjs);
			expect(
				hasHDWallet,
				"WASM CJS bundle must not contain HDWallet FFI code",
			).toBe(false);
		});
	});

	describe("Native export (@tevm/voltaire/native)", () => {
		const nativeEsm = join(DIST_DIR, "native", "index.js");
		const nativeCjs = join(DIST_DIR, "native", "index.cjs");

		// Skip native bundle tests if native bundles aren't built (e.g., in CI without native deps)
		const nativeEsmExists = existsSync(nativeEsm);
		const nativeCjsExists = existsSync(nativeCjs);

		it.skipIf(!nativeEsmExists)(
			"ESM bundle MUST contain ffi-napi (as external import)",
			() => {
				const result = bundleContainsFFI(nativeEsm);
				// Native bundle should have FFI imports (marked as external)
				expect(
					result.hasFfiNapi || result.hasRefNapi,
					"Native ESM bundle should reference FFI packages (as external imports)",
				).toBe(true);
			},
		);

		it.skipIf(!nativeCjsExists)(
			"CJS bundle MUST contain ffi-napi (as external import)",
			() => {
				const result = bundleContainsFFI(nativeCjs);
				// Native bundle should have FFI imports (marked as external)
				expect(
					result.hasFfiNapi || result.hasRefNapi,
					"Native CJS bundle should reference FFI packages (as external imports)",
				).toBe(true);
			},
		);

		it.skipIf(!nativeEsmExists)("ESM bundle MUST contain HDWallet", () => {
			const hasHDWallet = bundleContainsHDWallet(nativeEsm);
			expect(hasHDWallet, "Native ESM bundle should contain HDWallet").toBe(
				true,
			);
		});

		it.skipIf(!nativeCjsExists)("CJS bundle MUST contain HDWallet", () => {
			const hasHDWallet = bundleContainsHDWallet(nativeCjs);
			expect(hasHDWallet, "Native CJS bundle should contain HDWallet").toBe(
				true,
			);
		});
	});
});

describe("Import Validation", () => {
	it("Main export can be imported without ffi-napi installed", async () => {
		// This test validates that the main export doesn't throw on import
		// by checking that we can statically analyze the bundle without FFI
		const mainEsm = join(DIST_DIR, "index.js");
		if (!existsSync(mainEsm)) {
			// Skip if bundle doesn't exist (pre-build)
			return;
		}

		const content = readFileSync(mainEsm, "utf-8");

		// Ensure no top-level ffi-napi imports that would cause immediate failure
		const topLevelFfiImport =
			content.startsWith("import ffi from 'ffi-napi'") ||
			content.startsWith('import ffi from "ffi-napi"') ||
			content.includes("\nimport ffi from 'ffi-napi'") ||
			content.includes('\nimport ffi from "ffi-napi"');

		expect(
			topLevelFfiImport,
			"Main export must not have top-level ffi-napi imports that would fail on load",
		).toBe(false);
	});

	it("WASM export can be imported without ffi-napi installed", async () => {
		const wasmEsm = join(DIST_DIR, "wasm", "index.js");
		if (!existsSync(wasmEsm)) {
			return;
		}

		const content = readFileSync(wasmEsm, "utf-8");

		const topLevelFfiImport =
			content.startsWith("import ffi from 'ffi-napi'") ||
			content.startsWith('import ffi from "ffi-napi"') ||
			content.includes("\nimport ffi from 'ffi-napi'") ||
			content.includes('\nimport ffi from "ffi-napi"');

		expect(
			topLevelFfiImport,
			"WASM export must not have top-level ffi-napi imports that would fail on load",
		).toBe(false);
	});
});
