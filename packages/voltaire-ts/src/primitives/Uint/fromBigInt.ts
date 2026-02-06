import { MAX } from "./constants.js";
import { UintNegativeError, UintOverflowError } from "./errors.js";
import type { Uint256Type } from "./Uint256Type.js";

/**
 * Create Uint256 from bigint
 *
 * @param value - bigint to convert
 * @returns Uint256 value
 * @throws {UintNegativeError} If value is negative
 * @throws {UintOverflowError} If value exceeds maximum
 *
 * @example
 * ```typescript
 * const value = Uint.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value: bigint): Uint256Type {
	if (value < 0n) {
		throw new UintNegativeError(`Uint256 value cannot be negative: ${value}`, {
			value,
		});
	}

	if (value > MAX) {
		throw new UintOverflowError(`Uint256 value exceeds maximum: ${value}`, {
			value,
			max: MAX,
		});
	}

	return value as Uint256Type;
}
