import { fromBytes } from "./fromBytes.js";

/**
 * Create Uint256 from ABI-encoded bytes
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - ABI-encoded bytes (32 bytes)
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {Error} If bytes length is not 32
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const bytes = new Uint8Array(32);
 * const value = Uint256.fromAbiEncoded(bytes);
 * ```
 */
export function fromAbiEncoded(bytes) {
	if (bytes.length !== 32) {
		throw new Error(
			`ABI-encoded Uint256 must be exactly 32 bytes, got ${bytes.length}`,
		);
	}
	return fromBytes(bytes);
}
