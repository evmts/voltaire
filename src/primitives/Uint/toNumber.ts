import type { Type } from "./Uint.js";

/**
 * Convert Uint256 to number
 *
 * @param this - Uint256 value to convert
 * @returns number value
 * @throws Error if value exceeds MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const value = Uint.from(255);
 * const num = Uint.toNumber.call(value);
 * ```
 */
export function toNumber(this: Type): number {
	const bigint = this as bigint;
	if (bigint > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error(`Uint256 value exceeds MAX_SAFE_INTEGER: ${bigint}`);
	}
	return Number(bigint);
}
