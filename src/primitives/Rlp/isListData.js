import { isData } from "./isData.js";

/**
 * Check if value is RLP list data
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is RLP list data structure
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * Rlp.isListData({ type: 'list', value: [] });
 * // => true
 * Rlp.isListData({ type: 'bytes', value: new Uint8Array([1]) });
 * // => false
 * ```
 */
export function isListData(value) {
	return isData(value) && value.type === "list";
}
