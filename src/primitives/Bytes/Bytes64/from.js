import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";

/**
 * Create Bytes64 from string or bytes
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {string | Uint8Array} value - Hex string with optional 0x prefix or Uint8Array
 * @returns {import('./BrandedBytes64.ts').BrandedBytes64} Bytes64
 * @throws {Error} If input is invalid or wrong length
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const bytes = Bytes64.from('0x' + '12'.repeat(64));
 * const bytes2 = Bytes64.from(new Uint8Array(64));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return fromBytes(value);
}
