/**
 * Compare two NetworkIds for equality
 *
 * @this {import('./NetworkIdType.js').NetworkIdType}
 * @param {import('./NetworkIdType.js').NetworkIdType} other - Network ID to compare
 * @returns {boolean} True if equal
 *
 * @example
 * ```javascript
 * import * as NetworkId from './primitives/NetworkId/index.js';
 * const a = NetworkId.from(1);
 * const b = NetworkId.from(1);
 * const equal = NetworkId._equals.call(a, b); // true
 * ```
 */
export function equals(other) {
	return this === other;
}
