/**
 * Convert Uint64 to number
 * WARNING: Values above Number.MAX_SAFE_INTEGER (9007199254740991) may lose precision
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Uint64 value to convert
 * @returns {number} number value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const value = Uint64.from(255n);
 * const num = Uint64.toNumber(value); // 255
 * ```
 */
export function toNumber(uint) {
	if (uint > BigInt(Number.MAX_SAFE_INTEGER)) {
		console.warn(
			`Uint64.toNumber: Value ${uint} exceeds Number.MAX_SAFE_INTEGER, precision may be lost`,
		);
	}
	return Number(uint);
}
