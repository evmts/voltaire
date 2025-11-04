import type { BrandedHash } from "./BrandedHash.js";
import { keccak256 } from "./keccak256.js";

/**
 * Hash string with Keccak-256
 *
 * @param str - String to hash (UTF-8 encoded)
 * @returns 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Hash.keccak256String('hello');
 * ```
 */
export function keccak256String(str: string): BrandedHash {
	const encoder = new TextEncoder();
	return keccak256(encoder.encode(str));
}
