import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";

/**
 * Create Hash from string or bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {string | Uint8Array} value - Hex string with optional 0x prefix or Uint8Array
 * @returns {import('./BrandedHash.js').BrandedHash} Hash bytes
 * @throws {Error} If input is invalid or wrong length
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.from('0x1234...');
 * const hash2 = Hash.from(new Uint8Array(32));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return fromBytes(value);
}
