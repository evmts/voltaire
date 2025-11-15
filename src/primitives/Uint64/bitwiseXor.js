/**
 * Bitwise XOR Uint64 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - First operand
 * @param {import('./Uint64Type.js').Uint64Type} b - Second operand
 * @returns {import('./Uint64Type.js').Uint64Type} Result (uint ^ b)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(0b1100n);
 * const b = Uint64.from(0b1010n);
 * const result = Uint64.bitwiseXor(a, b); // 0b0110n = 6n
 * ```
 */
export function bitwiseXor(uint, b) {
	return uint ^ b;
}
