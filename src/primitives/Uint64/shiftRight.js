/**
 * Right shift Uint64 value (logical shift, zero-fill)
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./Uint64Type.js').Uint64Type} uint - Value to shift
 * @param {bigint | number} bits - Number of bits to shift (0-63)
 * @returns {import('./Uint64Type.js').Uint64Type} Result (uint >> bits)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(256n);
 * const result = Uint64.shiftRight(a, 8n); // 1n
 * ```
 */
export function shiftRight(uint, bits) {
	const shiftAmount = typeof bits === "bigint" ? bits : BigInt(bits);
	return /** @type {import('./Uint64Type.js').Uint64Type} */ (
		uint >> shiftAmount
	);
}
