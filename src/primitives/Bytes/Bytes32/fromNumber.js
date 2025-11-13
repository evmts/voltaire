import { SIZE } from "./constants.js";

/**
 * Create Bytes32 from number (padded to 32 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {number} value - Number to convert
 * @returns {import('./BrandedBytes32.ts').BrandedBytes32} Bytes32 (big-endian)
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const bytes = Bytes32.fromNumber(42);
 * ```
 */
export function fromNumber(value) {
	const bytes = new Uint8Array(SIZE);
	let n = BigInt(value);
	for (let i = SIZE - 1; i >= 0; i--) {
		bytes[i] = Number(n & 0xffn);
		n >>= 8n;
	}
	return /** @type {import('./BrandedBytes32.ts').BrandedBytes32} */ (bytes);
}
