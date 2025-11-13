import type { BrandedUint256 } from "./BrandedUint256.js";
import { MAX } from "./constants.js";

/**
 * Create Uint256 from bigint or string (standard form)
 *
 * @param value - bigint or decimal/hex string
 * @returns Uint256 value
 * @throws Error if value is out of range or invalid
 *
 * @example
 * ```typescript
 * const a = Uint.from(100n);
 * const b = Uint.from("255");
 * const c = Uint.from("0xff");
 * ```
 */
export function from(value: bigint | number | string): BrandedUint256 {
	let bigintValue: bigint;

	if (typeof value === "string") {
		if (value.startsWith("0x") || value.startsWith("0X")) {
			bigintValue = BigInt(value);
		} else {
			bigintValue = BigInt(value);
		}
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new Error(`Uint256 value must be an integer: ${value}`);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new Error(`Uint256 value cannot be negative: ${bigintValue}`);
	}

	if (bigintValue > MAX) {
		throw new Error(`Uint256 value exceeds maximum: ${bigintValue}`);
	}

	return bigintValue as BrandedUint256;
}
