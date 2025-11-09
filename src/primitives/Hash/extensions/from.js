import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";

/**
 * Create Hash from string or bytes
 *
 * @param {string | Uint8Array} value - Hex string with optional 0x prefix or Uint8Array
 * @returns {import('./BrandedHash.ts').BrandedHash} Hash bytes
 *
 * @example
 * ```js
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
