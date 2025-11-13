import { MAX } from "./constants.js";

/**
 * Left shift Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Value to shift
 * @param {bigint | number} bits - Number of bits to shift (0-63)
 * @returns {import('./BrandedUint64.js').BrandedUint64} Result (uint << bits) mod 2^64
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(1n);
 * const result = Uint64.shiftLeft(a, 8n); // 256n
 * ```
 */
export function shiftLeft(uint, bits) {
	const shiftAmount = typeof bits === "bigint" ? bits : BigInt(bits);
	return (uint << shiftAmount) & MAX;
}
