/**
 * Check if value is RLP Data structure
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedRlp.js').BrandedRlp} True if value is valid RLP data structure
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * Rlp.isData({ type: 'bytes', value: new Uint8Array([1]) });
 * // => true
 * Rlp.isData({ type: 'list', value: [] });
 * // => true
 * Rlp.isData('invalid');
 * // => false
 * ```
 */
export function isData(value) {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		"value" in value &&
		(value.type === "bytes" || value.type === "list")
	);
}
