import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";

/**
 * Create Bytes16 from string or bytes
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {string | Uint8Array} value - Hex string with optional 0x prefix or Uint8Array
 * @returns {import('./BrandedBytes16.ts').BrandedBytes16} Bytes16
 * @throws {Error} If input is invalid or wrong length
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const bytes = Bytes16.from('0x1234567890abcdef1234567890abcdef');
 * const bytes2 = Bytes16.from(new Uint8Array(16));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return fromBytes(value);
}
