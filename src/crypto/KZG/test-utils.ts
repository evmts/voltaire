/**
 * Test utilities for KZG tests
 *
 * KZG requires native bindings (c-kzg-4844 compiled via Zig).
 * Tests are skipped when native bindings are not available.
 */

// Check if native KZG is available by attempting dynamic import and load
const _checkKzgAvailable = async (): Promise<boolean> => {
	try {
		const { KZG } = await import("./index.js");
		KZG.loadTrustedSetup();
		return true;
	} catch {
		return false;
	}
};

// Use a synchronous check that runs once at import time
let _hasNativeKzg: boolean | null = null;

// For Vitest - need synchronous check
// We set this by trying to import synchronously and catching any errors
try {
	// Try to access the module synchronously
	const mod = await import("./index.js");
	mod.KZG.loadTrustedSetup();
	_hasNativeKzg = true;
} catch {
	_hasNativeKzg = false;
}

export const hasNativeKzg = _hasNativeKzg;
