/**
 * Test utilities for KZG tests
 *
 * KZG requires native bindings (c-kzg-4844 compiled via Zig).
 * Tests are skipped when native bindings are not available.
 */

import { KZG } from "./index.js";

// Check if native KZG is available by attempting to load trusted setup
export const checkKzgAvailable = (): boolean => {
	try {
		KZG.loadTrustedSetup();
		return true;
	} catch {
		return false;
	}
};

export const hasNativeKzg = checkKzgAvailable();
