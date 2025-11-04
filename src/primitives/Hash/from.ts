import type { BrandedHash } from "./BrandedHash.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";

/**
 * Create Hash from string or bytes
 *
 * @param value - Hex string with optional 0x prefix or Uint8Array
 * @returns Hash bytes
 *
 * @example
 * ```typescript
 * const hash = Hash.from('0x1234...');
 * const hash2 = Hash.from(new Uint8Array(32));
 * ```
 */
export function from(value: string | Uint8Array): BrandedHash {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return fromBytes(value);
}
