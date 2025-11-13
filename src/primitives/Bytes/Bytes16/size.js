import { SIZE } from "./constants.js";

/**
 * Get size of Bytes16 (always 16)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes16.ts').BrandedBytes16} _bytes - Bytes16 value
 * @returns {16} Size in bytes
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const s = Bytes16.size(bytes); // 16
 * ```
 */
export function size(_bytes) {
	return SIZE;
}
