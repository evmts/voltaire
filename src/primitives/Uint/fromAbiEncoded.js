import { fromBytes } from "./fromBytes.js";

/**
 * Create Uint256 from ABI-encoded bytes
 *
 * @param {Uint8Array} bytes - ABI-encoded bytes (32 bytes)
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {Error} If bytes length is not 32
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array(32);
 * const value = Uint.fromAbiEncoded(bytes);
 * ```
 */
export function fromAbiEncoded(bytes) {
	if (bytes.length !== 32) {
		throw new Error(`ABI-encoded Uint256 must be exactly 32 bytes, got ${bytes.length}`);
	}
	return fromBytes(bytes);
}
