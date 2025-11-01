import type { Type } from "./Uint.js";
import { MAX } from "./constants.js";

/**
 * Create Uint256 from bigint
 *
 * @param this - bigint to convert
 * @returns Uint256 value
 * @throws Error if value out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromBigInt.call(100n);
 * ```
 */
export function fromBigInt(this: bigint): Type {
	if (this < 0n) {
		throw new Error(`Uint256 value cannot be negative: ${this}`);
	}

	if (this > MAX) {
		throw new Error(`Uint256 value exceeds maximum: ${this}`);
	}

	return this as Type;
}
