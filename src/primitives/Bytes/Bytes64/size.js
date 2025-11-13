import { SIZE } from "./constants.js";

/**
 * Get size of Bytes64 (always 64)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes64.ts').BrandedBytes64} _bytes - Bytes64 value
 * @returns {64} Size in bytes
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const s = Bytes64.size(bytes); // 64
 * ```
 */
export function size(_bytes) {
	return SIZE;
}
