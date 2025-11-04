import { keccak_256 } from "@noble/hashes/sha3.js";
import type { BrandedHash } from "./BrandedHash.js";

/**
 * Hash data with Keccak-256
 *
 * @param data - Data to hash
 * @returns 32-byte hash
 *
 * @example
 * ```typescript
 * const hash = Hash.keccak256(data);
 * ```
 */
export function keccak256(data: Uint8Array): BrandedHash {
	return keccak_256(data) as BrandedHash;
}
