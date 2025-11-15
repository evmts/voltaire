import type { Uint256Type } from "./Uint256Type.js";

/**
 * Convert Uint256 to number
 *
 * @param uint - Uint256 value to convert
 * @returns number value
 * @throws Error if value exceeds MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const num1 = Uint.toNumber(value);
 * const num2 = value.toNumber();
 * ```
 */
export function toNumber(uint: Uint256Type): number {
	const bigint = uint as bigint;
	if (bigint > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error(`Uint256 value exceeds MAX_SAFE_INTEGER: ${bigint}`);
	}
	return Number(bigint);
}
