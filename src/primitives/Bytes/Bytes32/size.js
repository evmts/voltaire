import { SIZE } from "./constants.js";

/**
 * Get size of Bytes32 (always 32)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes32.ts').BrandedBytes32} _bytes - Bytes32 value
 * @returns {32} Size in bytes
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const s = Bytes32.size(bytes); // 32
 * ```
 */
export function size(_bytes) {
	return SIZE;
}
