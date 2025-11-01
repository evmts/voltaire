import type { Type } from "./Uint.js";
import { MAX } from "./constants.js";

/**
 * Create Uint256 from hex string
 *
 * @param this - Hex string to convert
 * @returns Uint256 value
 * @throws Error if hex is invalid or value out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromHex.call("0xff");
 * const value2 = Uint.fromHex.call("ff");
 * ```
 */
export function fromHex(this: string): Type {
	const normalized = this.startsWith("0x") ? this : `0x${this}`;
	const value = BigInt(normalized);

	if (value < 0n) {
		throw new Error(`Uint256 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint256 value exceeds maximum: ${value}`);
	}

	return value as Type;
}
