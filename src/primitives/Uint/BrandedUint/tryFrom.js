import { from } from "./from.js";

/**
 * Try to create Uint256, returns undefined if invalid (standard form)
 *
 * @param {bigint | number | string} value - bigint, number, or string
 * @returns {import('./BrandedUint.js').BrandedUint | undefined} Uint256 value or undefined
 *
 * @example
 * ```typescript
 * const a = Uint.tryFrom(100n); // Uint256
 * const b = Uint.tryFrom(-1n); // undefined
 * const c = Uint.tryFrom("invalid"); // undefined
 * ```
 */
export function tryFrom(value) {
	try {
		return from(value);
	} catch {
		return undefined;
	}
}
