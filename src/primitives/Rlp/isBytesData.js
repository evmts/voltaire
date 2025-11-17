import { isData } from "./isData.js";

/**
 * Check if value is RLP bytes data
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is RLP bytes data structure
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * Rlp.isBytesData({ type: 'bytes', value: new Uint8Array([1]) });
 * // => true
 * Rlp.isBytesData({ type: 'list', value: [] });
 * // => false
 * ```
 */
export function isBytesData(value) {
	return isData(value) && value.type === "bytes";
}
