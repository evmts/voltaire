import type { BrandedHash } from "./BrandedHash.js";
import { SIZE } from "./BrandedHash.js";

/**
 * Generate random hash
 *
 * @returns Random 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Hash.random();
 * ```
 */
export function random(): BrandedHash {
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		const bytes = new Uint8Array(SIZE);
		crypto.getRandomValues(bytes);
		return bytes as BrandedHash;
	}
	throw new Error("crypto.getRandomValues not available");
}
