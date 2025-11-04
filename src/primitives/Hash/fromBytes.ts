import type { BrandedHash } from "./BrandedHash.js";
import { SIZE } from "./BrandedHash.js";

/**
 * Create Hash from raw bytes
 *
 * @param bytes - Raw bytes (must be 32 bytes)
 * @returns Hash bytes
 * @throws If bytes is wrong length
 *
 * @example
 * ```typescript
 * const hash = Hash.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes: Uint8Array): BrandedHash {
	if (bytes.length !== SIZE) {
		throw new Error(`Hash must be ${SIZE} bytes, got ${bytes.length}`);
	}
	return new Uint8Array(bytes) as BrandedHash;
}
