/**
 * Convert hex to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./HexType.js').HexType} hex - Hex string to convert
 * @returns {bigint} BigInt value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234');
 * const num = Hex.toBigInt(hex); // 4660n
 * ```
 */
export function toBigInt(hex) {
	return BigInt(hex);
}
