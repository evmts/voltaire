/**
 * Test utilities for KZG documentation tests
 *
 * KZG requires native bindings (c-kzg-4844 compiled via Zig).
 * Tests are skipped when native bindings are not available.
 */

// Check if native KZG is available by attempting to load trusted setup
export const checkKzgAvailable = async (): Promise<boolean> => {
	try {
		const { KZG } = await import("../../../src/crypto/KZG/index.js");
		KZG.loadTrustedSetup();
		return true;
	} catch {
		return false;
	}
};

export const hasNativeKzg = await checkKzgAvailable();

// Optional c-kzg dependency detection for factory examples
export const hasCkzg = await (async () => {
  try {
    await import("c-kzg");
    return true;
  } catch {
    return false;
  }
})();
